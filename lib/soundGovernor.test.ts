// Run with: npm test
//
// Uses the Node test runner and Node's native type stripping, so this repo
// gains a test suite without gaining a dependency — it has two lockfiles
// (package-lock.json and yarn.lock, both tracked), and adding a devDependency
// would update one and leave the other to drift.
//
// These mirror src/utils/soundGovernor.test.ts in the TellMeWhatToPlay client.
// The two governors enforce different halves of the same rules, so the numbers
// have to agree; if you change one table, this is what tells you.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  GAME_CUE_IDS,
  SOUND_LIST,
  isFanSoundId,
  isGameCue,
  pickNextVariant,
} from './soundFx.ts';
import {
  createRoomGovernor,
  resolvePlaying,
  SOUND_KIND,
  type SoundBlockReason,
  type SoundDecision,
  ARTIST_SIGNAL_STALE_MS,
  CONFIRM_FRESH_MS,
} from './soundGovernor.ts';

const T0 = 1_700_000_000_000;
const at = (nowMs: number, playing: boolean | null = null) => ({ nowMs, playing });

// Narrows a decision to the blocked case so the reason can be read. Asserting
// it here rather than in each test keeps a typo'd id — which would pass as
// `ok` — from quietly reading as "no reason given".
const reasonOf = (d: SoundDecision): SoundBlockReason => {
  assert.equal(d.ok, false, 'expected this to be blocked');
  return (d as Extract<SoundDecision, { ok: false }>).reason;
};

describe('crowd noise is exempt', () => {
  test('the room may mash applause without limit', () => {
    const g = createRoomGovernor();
    for (let i = 0; i < 40; i += 1) {
      assert.equal(g.tryPlay('applause', at(T0 + i * 10)).ok, true, `tap ${i}`);
    }
  });

  test('and a different crowd sound does not trip a budget', () => {
    const g = createRoomGovernor();
    g.tryPlay('applause', at(T0));
    assert.equal(g.tryPlay('cheers', at(T0 + 1)).ok, true);
  });
});

describe('the density brake', () => {
  test('blocks a different phrase that no per-sound rule would stop', () => {
    // The failure per-sound cooldowns cannot catch: twenty fans each firing a
    // DIFFERENT phrase once breaks no per-sound rule and still sounds like a
    // cartoon.
    const g = createRoomGovernor();
    assert.equal(g.tryPlay('we-love-you-landon', at(T0)).ok, true);
    assert.deepEqual(g.tryPlay('we-love-you-guys', at(T0 + 2000)), {
      ok: false,
      reason: 'budget',
      retryInMs: 18_000,
    });
    assert.equal(g.tryPlay('we-love-you-guys', at(T0 + 20_000)).ok, true);
  });

  test('keeps hits apart even when they are different hits', () => {
    const g = createRoomGovernor();
    g.tryPlay('thunder', at(T0));
    assert.equal(g.tryPlay('fog-horn', at(T0 + 500)).ok, false);
    assert.equal(g.tryPlay('fog-horn', at(T0 + 2500)).ok, true);
  });
});

describe('shared clocks and lifetime caps', () => {
  test('the same hit cannot repeat inside its cooldown', () => {
    const g = createRoomGovernor();
    g.tryPlay('thunder', at(T0));
    assert.equal(g.tryPlay('thunder', at(T0 + 1000)).ok, false);
  });

  test('a per-user cooldown is the phone’s job, not the board’s', () => {
    // crowd is scope 'user'; the board must not re-enforce it.
    const g = createRoomGovernor();
    g.tryPlay('applause', at(T0));
    assert.equal(g.tryPlay('applause', at(T0 + 1)).ok, true);
  });

  test('shh is spent after two and stays spent', () => {
    const g = createRoomGovernor();
    assert.equal(g.tryPlay('shh', at(T0)).ok, true);
    assert.equal(g.tryPlay('shh', at(T0 + 60_000)).ok, true);
    assert.equal(reasonOf(g.tryPlay('shh', at(T0 + 600_000))), 'spent');
  });

  test('a new show gets its caps back', () => {
    const g = createRoomGovernor();
    g.tryPlay('shh', at(T0));
    g.tryPlay('shh', at(T0 + 60_000));
    g.reset();
    assert.equal(g.tryPlay('shh', at(T0 + 120_000)).ok, true);
  });
});

describe('presets', () => {
  test('dueling pianos lifts the phrase cap, because heckling is the format', () => {
    const g = createRoomGovernor('dueling-pianos');
    for (let i = 0; i < 8; i += 1) {
      assert.equal(
        g.tryPlay('we-love-you-landon', at(T0 + i * 60_000)).ok,
        true,
        `chant ${i}`
      );
    }
  });

  test('a listening room holds hits until a gap', () => {
    const g = createRoomGovernor('listening-room');
    assert.equal(reasonOf(g.check('thunder', at(T0, true))), 'when');
    assert.equal(g.check('thunder', at(T0, false)).ok, true);
  });

  test('a sound override survives the loosest preset', () => {
    // shh is self-defeating when mashed wherever it is played.
    const g = createRoomGovernor('dueling-pianos');
    g.tryPlay('shh', at(T0));
    g.tryPlay('shh', at(T0 + 60_000));
    assert.equal(reasonOf(g.tryPlay('shh', at(T0 + 120_000))), 'spent');
  });

  test('switching preset mid-show takes effect', () => {
    const g = createRoomGovernor();
    assert.equal(g.check('thunder', at(T0, true)).ok, true);
    g.setPreset('listening-room');
    assert.equal(reasonOf(g.check('thunder', at(T0, true))), 'when');
  });
});

describe('check() is free', () => {
  test('does not consume the budget it reports on', () => {
    const g = createRoomGovernor();
    for (let i = 0; i < 10; i += 1) assert.equal(g.check('thunder', at(T0)).ok, true);
    assert.equal(g.tryPlay('thunder', at(T0)).ok, true);
  });
});

describe('resolvePlaying', () => {
  test('believes the artist over a fan who says otherwise', () => {
    assert.equal(
      resolvePlaying(
        { artistPlaying: { on: false, atMs: T0 }, playConfirmAtMs: T0 + 1000 },
        T0 + 2000
      ),
      false
    );
  });

  test('falls through once the artist signal goes stale', () => {
    assert.equal(
      resolvePlaying({ artistPlaying: { on: true, atMs: T0 } }, T0 + ARTIST_SIGNAL_STALE_MS + 1),
      null
    );
  });

  test('takes a recent fan confirmation as playing', () => {
    assert.equal(resolvePlaying({ playConfirmAtMs: T0 }, T0 + 1000), true);
    assert.equal(resolvePlaying({ playConfirmAtMs: T0 }, T0 + CONFIRM_FRESH_MS + 1), null);
  });

  test('takes a crowd on one song’s lyrics as playing', () => {
    assert.equal(resolvePlaying({ lyricsPresenceCount: 3 }, T0), true);
    assert.equal(resolvePlaying({ lyricsPresenceCount: 2 }, T0), null);
  });

  test('unknown never blocks', () => {
    assert.equal(resolvePlaying({}, T0), null);
    const g = createRoomGovernor('listening-room');
    assert.equal(g.check('thunder', at(T0, null)).ok, true);
  });
});


// Hecklers are the first kind to actually use the when-gate, so the gate and
// the kind are tested together. Numbers must match the client suite's
// 'hecklers wait for a gap' block.
describe('hecklers', () => {
  test('wait for a gap, and run out eventually but not after two', () => {
    const g = createRoomGovernor();
    assert.equal(reasonOf(g.check('freebird', at(T0, true))), 'when');
    for (let i = 0; i < 6; i += 1) {
      assert.equal(g.tryPlay('freebird', at(T0 + i * 200_000, false)).ok, true);
    }
    assert.equal(
      reasonOf(g.tryPlay('freebird', at(T0 + 7 * 200_000, false))),
      'spent'
    );
  });

  test('still fire when nobody knows whether a song is on', () => {
    const g = createRoomGovernor();
    assert.equal(g.tryPlay('freebird', at(T0, null)).ok, true);
  });

  test('stop a second heckler riding in behind the first', () => {
    // Different sound, so no per-sound cooldown applies — the kind budget is
    // the only thing between one gag and a comedy club.
    const g = createRoomGovernor();
    assert.equal(g.tryPlay('freebird', at(T0, false)).ok, true);
    assert.deepEqual(g.tryPlay('boo', at(T0 + 1000, false)), {
      ok: false,
      reason: 'budget',
      retryInMs: 24_000,
    });
    assert.equal(g.tryPlay('boo', at(T0 + 25_000, false)).ok, true);
  });

  test('dueling pianos heckles over the playing, uncapped', () => {
    const g = createRoomGovernor('dueling-pianos');
    for (let i = 0; i < 5; i += 1) {
      assert.equal(g.tryPlay('freebird', at(T0 + i * 30_000, true)).ok, true);
    }
  });

  test('a listening room gets exactly one all night', () => {
    const g = createRoomGovernor('listening-room');
    assert.equal(g.tryPlay('freebird', at(T0, false)).ok, true);
    assert.equal(
      reasonOf(g.tryPlay('freebird', at(T0 + 600_000, false))),
      'spent'
    );
  });
});

// Rain is the only bed with no `url`, so a typo in its spec would show up as
// silence at a gig rather than as a build error.
describe('rain', () => {
  test('is an ambience bed the board knows how to render', () => {
    const rain = SOUND_LIST.find((s) => s.id === 'rain');
    assert.ok(rain, 'rain missing from the catalogue');
    assert.equal(rain.bed, true);
    assert.equal(SOUND_KIND.rain, 'ambience');
  });

  test('shares the ambience clock rather than getting its own', () => {
    const g = createRoomGovernor();
    assert.equal(g.tryPlay('rain', at(T0)).ok, true);
    assert.equal(reasonOf(g.tryPlay('surf', at(T0 + 1000))), 'budget');
  });
});


// A button is a FAMILY and a press picks a take. The shift that skips the
// previous pick is the one line in the engine that can be wrong without
// anybody hearing it: drop a take out of the rotation and the board still
// sounds fine, just less varied than it is supposed to be.
describe('variant picker', () => {
  test('a family of one always plays its only take', () => {
    for (const last of [undefined, 0]) {
      assert.equal(pickNextVariant(last, 1, () => 0.99), 0);
    }
  });

  test('never repeats the previous take', () => {
    for (let count = 2; count <= 6; count += 1) {
      for (let last = 0; last < count; last += 1) {
        for (let r = 0; r < 100; r += 1) {
          const i = pickNextVariant(last, count, () => r / 100);
          assert.notEqual(i, last, `count=${count} last=${last} r=${r}`);
          assert.ok(i >= 0 && i < count, `out of range: ${i}`);
        }
      }
    }
  });

  test('can still reach every other take', () => {
    // The off-by-one this guards: a shift applied on the wrong side of the
    // comparison excludes an index permanently rather than just the last one.
    const count = 4;
    for (let last = 0; last < count; last += 1) {
      const seen = new Set<number>();
      for (let r = 0; r < 1000; r += 1) {
        seen.add(pickNextVariant(last, count, () => r / 1000));
      }
      const expected = [0, 1, 2, 3].filter((i) => i !== last);
      assert.deepEqual([...seen].sort(), expected, `last=${last}`);
    }
  });

  test('with no history every take is reachable', () => {
    const seen = new Set<number>();
    for (let r = 0; r < 1000; r += 1) {
      seen.add(pickNextVariant(undefined, 3, () => r / 1000));
    }
    assert.deepEqual([...seen].sort(), [0, 1, 2]);
  });

  test('a random() of almost 1 stays in range', () => {
    // Math.random() is [0,1), but a stubbed or patched rand is not always, and
    // an index one past the end is a silent no-op play rather than a throw.
    assert.ok(pickNextVariant(undefined, 4, () => 0.9999999) < 4);
    assert.ok(pickNextVariant(2, 4, () => 0.9999999) < 4);
  });

  test('draws uniformly over the takes it is allowed', () => {
    const count = 4;
    const last = 1;
    const counts = [0, 0, 0, 0];
    for (let r = 0; r < 300; r += 1) {
      counts[pickNextVariant(last, count, () => r / 300)] += 1;
    }
    assert.equal(counts[last], 0);
    for (const i of [0, 2, 3]) {
      assert.equal(counts[i], 100, `index ${i} got ${counts[i]}`);
    }
  });
});

// The manifest is generated from whatever is in public/sfx, so these assert
// the WIRING rather than the contents — a family that loses its files should
// fail here, not at a gig.
describe('sound families', () => {
  test('cheers has grown into a real family', () => {
    const cheers = SOUND_LIST.find((s) => s.id === 'cheers');
    assert.ok(cheers);
    assert.ok(cheers.variants > 1, `expected >1 take, got ${cheers.variants}`);
  });

  test('every button has at least one take or a synth to fall back on', () => {
    const dead = SOUND_LIST.filter((s) => s.variants === 0).map((s) => s.id);
    assert.deepEqual(dead, [], `buttons with nothing to play: ${dead}`);
  });

  test('the new ids are wired to the board', () => {
    for (const id of ['battle', 'explosion', 'rain']) {
      const entry = SOUND_LIST.find((s) => s.id === id);
      assert.ok(entry, `${id} missing from SOUND_LIST`);
      assert.ok(entry.variants >= 1, `${id} has no takes`);
    }
    assert.equal(SOUND_KIND.explosion, 'hit');
    assert.equal(SOUND_KIND.battle, 'ambience');
  });
});

// The game's own voice. A fanfare means "somebody won" and a sparkle means
// "here is the answer", so unlike every other sound on the board these two
// make a CLAIM — which is exactly why no fan may fire them.
describe('game cues', () => {
  test('both cues can actually make a noise', () => {
    for (const id of GAME_CUE_IDS) {
      const entry = SOUND_LIST.find((s) => s.id === id);
      assert.ok(entry, `${id} missing from SOUND_LIST`);
      assert.ok(entry.variants >= 1, `${id} has nothing to play`);
    }
  });

  test('no fan can fire one, however the request is shaped', () => {
    for (const id of GAME_CUE_IDS) {
      assert.equal(isFanSoundId(id), false, `${id} is fan-playable`);
    }
  });

  test('the reference tone is not mistaken for a game cue', () => {
    assert.equal(isFanSoundId('test'), false);
    assert.equal(isGameCue('test'), false);
  });

  test('every ordinary effect is still fan-playable', () => {
    const blocked = SOUND_LIST.filter(
      (s) => s.id !== 'test' && !isGameCue(s.id) && !isFanSoundId(s.id)
    ).map((s) => s.id);
    assert.deepEqual(blocked, [], `unexpectedly blocked: ${blocked}`);
  });
});
