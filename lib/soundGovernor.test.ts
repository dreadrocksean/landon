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
  createRoomGovernor,
  resolvePlaying,
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
