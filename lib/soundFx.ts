// lib/soundFx.ts
// Audience-triggered sound effects for the venue board.
//
// The point of the feature is that the board's audio output can be patched
// into the band's PA, so a fan's tap is heard by the whole room instead of
// just seen on the screen. That makes this the one thing on the board capable
// of interrupting the show, which drives every decision here:
//
//  1. The cooldown is GLOBAL, not per-fan. Thirty phones mashing is a wall of
//     noise through a rig running at gig volume. Extras are DROPPED rather
//     than queued — a queue only moves the pile-up into the next song.
//  2. The app's primary quick-tap emote stays SILENT (see SOUND_FOR_REACTION).
//     It is throttled to 180ms in the client precisely because it is built for
//     a mashing thumb; wiring that to a PA turns every happy fan into an
//     air-raid siren.
//  3. Everything is levelled on the way in, so the first sound of the night
//     can't set the engineer's gain and the second one take the roof off.
//
// The sounds are SYNTHESIZED rather than loaded. For a first pass that buys a
// lot: no asset pipeline, no licensing, nothing to pull over a venue's wifi,
// and no chance of a half-loaded buffer firing silently mid-set. They are
// frankly placeholders — a real soundboard wants recordings, and "We love you
// Landon!" can only ever be a recording — so `url` is the seam for when those
// arrive, and a fetched sound is levelled by the same path.

import {
  createRoomGovernor,
  DEFAULT_PRESET,
  type RoomGovernor,
  type SoundDecision,
  type SoundPlaying,
  type SoundPresetId,
} from "./soundGovernor.ts";

export type SoundId =
  // One-shots: a punctuation mark on something happening on stage.
  | "thunder"
  | "applause"
  | "cheers"
  | "fog-horn"
  | "shh"
  | "xmas-bells"
  | "we-love-you-landon"
  | "we-love-you-adrian"
  | "we-love-you-guys"
  // Hecklers: a single voice from the room, landing in a gap.
  | "freebird"
  | "boo"
  // Beds: ambience that runs for ten to thirty seconds under the band.
  | "breeze"
  | "surf"
  | "night-forest"
  | "large-crowd"
  | "rain"
  // Not a sound effect — the engineer's reference tone.
  | "test";

// Rendered offline at this rate and resampled by the browser if the output
// device differs, which is cheaper than guessing the device rate up front.
const SAMPLE_RATE = 44100;

// What every sound is scaled to. RMS tracks how loud something SEEMS better
// than peak does, so it leads; the ceiling then catches the transient sounds
// (an explosion is brief and loud, and matching its RMS to a 3s wash of
// applause would otherwise boost it into clipping). This approximates what a
// proper LUFS measurement would do and is not a substitute for one — real
// recordings should be measured rather than trusted to this.
const TARGET_RMS = 0.14;
const PEAK_CEILING = 0.89;

type RenderCtx = OfflineAudioContext;

interface SoundSpec {
  label: string;
  // Only needed to size the offline render for a synthesized sound.
  seconds: number;
  // A spec carrying `url` prefers the recording and falls back to the synth if
  // the fetch fails, so a missing file degrades to a placeholder rather than
  // to silence. Ids with no synth at all simply go quiet, which is why the
  // ones that have a plausible stand-in keep theirs.
  render?: (ctx: RenderCtx) => void;
  url?: string;
  // A BED runs for ten to thirty seconds under the band rather than landing
  // as a hit. Two differences follow, both enforced in play():
  //   - only one plays at a time, and a new one fades the old out, because a
  //     cooldown measured in seconds cannot stop 30s beds from stacking;
  //   - it is trimmed below the one-shots. Levelling everything to one target
  //     is right for hits, but a wash of surf matched to the loudness of a
  //     thunder clap sits on top of the band instead of behind it.
  bed?: boolean;
  // Applied after levelling. 1 unless a sound needs to sit back.
  trim?: number;
}

// Beds are trimmed to this under the levelled target.
const BED_TRIM = 0.55;

// Long enough for the longest bed to be cut off cleanly rather than clicking.
const BED_FADE_S = 0.25;

// Deterministic noise. The same seed gives the same sound every render, so a
// change to one of these is an actual change rather than a different roll of
// the dice — which matters when the only way to judge them is listening.
const mulberry32 = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const noiseSource = (ctx: RenderCtx, seconds: number, seed: number) => {
  const frames = Math.max(1, Math.ceil(seconds * ctx.sampleRate));
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  const rnd = mulberry32(seed);
  for (let i = 0; i < frames; i += 1) data[i] = rnd() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  return source;
};

// A cluster of short decaying noise bursts — the shape both applause and a
// handful of sleigh bells share, differing mainly in how long each burst
// rings and where the filter puts it in the spectrum.
const burstSource = (
  ctx: RenderCtx,
  opts: { seconds: number; count: number; decay: number; seed: number }
) => {
  const frames = Math.max(1, Math.ceil(opts.seconds * ctx.sampleRate));
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  const rnd = mulberry32(opts.seed);
  const decayFrames = Math.max(1, Math.floor(opts.decay * ctx.sampleRate));
  for (let n = 0; n < opts.count; n += 1) {
    const start = Math.floor(rnd() * frames);
    const amp = 0.4 + rnd() * 0.6;
    const len = Math.min(decayFrames, frames - start);
    for (let i = 0; i < len; i += 1) {
      data[start + i] +=
        (rnd() * 2 - 1) * amp * Math.exp((-i / decayFrames) * 4);
    }
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  return source;
};

const envelope = (
  ctx: RenderCtx,
  opts: { attack: number; hold: number; release: number; peak: number }
) => {
  const gain = ctx.createGain();
  // exponentialRamp can never reach or pass through zero, hence the floor.
  gain.gain.setValueAtTime(0.0001, 0);
  gain.gain.linearRampToValueAtTime(opts.peak, opts.attack);
  gain.gain.setValueAtTime(opts.peak, opts.attack + opts.hold);
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    opts.attack + opts.hold + opts.release
  );
  return gain;
};

const SFX = "/sfx";

const SOUNDS: Record<SoundId, SoundSpec> = {
  thunder: {
    label: "Thunder",
    seconds: 1.9,
    url: `${SFX}/thunder.mp3`,
    render: (ctx) => {
      const noise = noiseSource(ctx, 1.9, 3);
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(2400, 0);
      lp.frequency.exponentialRampToValueAtTime(90, 1.3);
      noise
        .connect(lp)
        .connect(
          envelope(ctx, { attack: 0.004, hold: 0.05, release: 1.5, peak: 1 })
        )
        .connect(ctx.destination);

      // The body. Without a sub sweep underneath, the filtered noise reads as
      // a cymbal rather than a bang.
      const boom = ctx.createOscillator();
      boom.type = "sine";
      boom.frequency.setValueAtTime(130, 0);
      boom.frequency.exponentialRampToValueAtTime(32, 0.9);
      boom
        .connect(
          envelope(ctx, { attack: 0.006, hold: 0.1, release: 1.1, peak: 1.1 })
        )
        .connect(ctx.destination);

      noise.start(0);
      boom.start(0);
    },
  },

  applause: {
    label: "Applause",
    seconds: 2.8,
    url: `${SFX}/applause.m4a`,
    render: (ctx) => {
      const claps = burstSource(ctx, {
        seconds: 2.8,
        count: 340,
        decay: 0.045,
        seed: 11,
      });
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 1500;
      bp.Q.value = 0.6;
      claps
        .connect(bp)
        .connect(
          envelope(ctx, { attack: 0.12, hold: 1.2, release: 1.4, peak: 1 })
        )
        .connect(ctx.destination);
      claps.start(0);
    },
  },

  cheers: { label: "Cheers", seconds: 5, url: `${SFX}/cheers.mp3` },

  "fog-horn": {
    label: "Fog horn",
    seconds: 1.5,
    url: `${SFX}/fog-horn.mp3`,
    render: (ctx) => {
      const out = envelope(ctx, {
        attack: 0.03,
        hold: 0.95,
        release: 0.45,
        peak: 0.5,
      });
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 3400;
      out.connect(lp).connect(ctx.destination);

      // One sawtooth is a kazoo; three stacked is a horn.
      [232, 293, 349].forEach((hz, i) => {
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(hz * 0.94, 0);
        osc.frequency.exponentialRampToValueAtTime(hz, 0.07);
        const trim = ctx.createGain();
        trim.gain.value = 1 / (i + 1.4);
        osc.connect(trim).connect(out);
        osc.start(0);
      });
    },
  },

  shh: {
    label: "Shhhhh",
    seconds: 1.5,
    url: `${SFX}/shh.mp3`,
    render: (ctx) => {
      const noise = noiseSource(ctx, 1.5, 23);
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.setValueAtTime(5200, 0);
      bp.frequency.exponentialRampToValueAtTime(3200, 1.4);
      bp.Q.value = 1.1;
      noise
        .connect(bp)
        .connect(
          envelope(ctx, { attack: 0.1, hold: 0.7, release: 0.7, peak: 1 })
        )
        .connect(ctx.destination);
      noise.start(0);
    },
  },

  "xmas-bells": {
    label: "Xmas bells",
    seconds: 2.2,
    url: `${SFX}/xmas-bells.mp3`,
    render: (ctx) => {
      const jingle = burstSource(ctx, {
        seconds: 2.2,
        count: 95,
        decay: 0.03,
        seed: 7,
      });
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 4200;
      bp.Q.value = 1.6;
      jingle
        .connect(bp)
        .connect(
          envelope(ctx, { attack: 0.02, hold: 1.1, release: 0.9, peak: 1 })
        )
        .connect(ctx.destination);
      jingle.start(0);

      // Two partials, so it rings as metal instead of hissing as filtered
      // noise.
      [2637, 3136].forEach((hz, i) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = hz;
        osc
          .connect(
            envelope(ctx, {
              attack: 0.005,
              hold: 0.05,
              release: 1.6,
              peak: 0.22 / (i + 1),
            })
          )
          .connect(ctx.destination);
        osc.start(0);
      });
    },
  },

  // Named chants. These are the ones with no synthesized stand-in and no
  // generic fallback — a wrong name is worse than silence — and the reason
  // the catalogue will eventually have to be resolved per artist rather than
  // shipped as a fixed list.
  "we-love-you-landon": {
    label: "We love you Landon",
    seconds: 4,
    url: `${SFX}/we-love-you-landon.mp3`,
  },
  "we-love-you-adrian": {
    label: "We love you Adrian",
    seconds: 4,
    url: `${SFX}/we-love-you-adrian.mp3`,
  },
  "we-love-you-guys": {
    label: "We love you guys",
    seconds: 4,
    url: `${SFX}/we-love-you-guys.mp3`,
  },

  // Hecklers. Recordings only, for the same reason the chants are: a human
  // voice is the entire content here, and there is no oscillator arrangement
  // that reads as a man shouting across a room rather than as a broken synth.
  // A fetch failure leaves these silent, which is the right failure — a
  // wrong-sounding heckle is worse than a missing one.
  freebird: {
    label: "Freebird!",
    seconds: 2.5,
    url: `${SFX}/freebird.wav`,
  },
  boo: {
    label: "Boooo",
    seconds: 2.5,
    url: `${SFX}/boo.wav`,
  },

  breeze: {
    label: "Breeze",
    seconds: 30,
    url: `${SFX}/breeze.mp3`,
    bed: true,
    trim: BED_TRIM,
  },
  surf: {
    label: "Surf",
    seconds: 15,
    url: `${SFX}/surf.mp3`,
    bed: true,
    trim: BED_TRIM,
  },
  "night-forest": {
    label: "Night forest",
    seconds: 15,
    url: `${SFX}/night-forest.mp3`,
    bed: true,
    trim: BED_TRIM,
  },
  "large-crowd": {
    label: "Large crowd",
    seconds: 10,
    url: `${SFX}/large-crowd.mp3`,
    bed: true,
    trim: BED_TRIM,
  },

  // The one sound in here with no `url` at all, and the only one that does not
  // want one. Every other synth is a placeholder apologising for a missing
  // recording; rain IS filtered noise, so this is the same thing a recording
  // would be, minus twenty seconds of audio over a venue's wifi. Give it a
  // url only if someone turns up with a recording that genuinely beats it.
  rain: {
    label: "Rain",
    seconds: 20,
    bed: true,
    trim: BED_TRIM,
    render: (ctx) => {
      // Faded in rather than switched on. Every other bed is a recording that
      // the encoder happened to start quietly; this one would otherwise
      // arrive as a step, which through a PA is a thump.
      const out = ctx.createGain();
      out.gain.setValueAtTime(0.0001, 0);
      out.gain.linearRampToValueAtTime(1, 0.6);
      out.connect(ctx.destination);

      // Two layers, because neither is rain on its own: the wash alone is a
      // radio between stations, and the drops alone are a leaking tap.
      const wash = noiseSource(ctx, 20, 41);
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 700;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 7000;
      const washTrim = ctx.createGain();
      washTrim.gain.value = 0.8;
      wash.connect(hp).connect(lp).connect(washTrim).connect(out);
      wash.start(0);

      // Individual drops hitting something hard. Deliberately sparse — push
      // the count up and they smear back into the wash, which costs CPU to
      // render and changes nothing you can hear.
      const drops = burstSource(ctx, {
        seconds: 20,
        count: 900,
        decay: 0.012,
        seed: 42,
      });
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 3200;
      bp.Q.value = 0.9;
      const dropTrim = ctx.createGain();
      dropTrim.gain.value = 0.5;
      drops.connect(bp).connect(dropTrim).connect(out);
      drops.start(0);
    },
  },

  test: {
    label: "Test tone",
    seconds: 1.2,
    render: (ctx) => {
      // A steady 1 kHz tone is what an engineer expects for setting a
      // channel's gain, so the level gets dialled in before doors rather than
      // discovered during a ballad. It is levelled along with everything else,
      // which is the point: it stands in for how loud the effects will be.
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = 1000;
      osc
        .connect(
          envelope(ctx, { attack: 0.01, hold: 1, release: 0.15, peak: 1 })
        )
        .connect(ctx.destination);
      osc.start(0);
    },
  },
};

export const SOUND_LIST: {
  id: SoundId;
  label: string;
  bed: boolean;
}[] = (Object.keys(SOUNDS) as SoundId[]).map((id) => ({
  id,
  label: SOUNDS[id].label,
  bed: SOUNDS[id].bed === true,
}));

// Which of the app's existing reaction types make a noise.
//
// Four of the eight, and the gaps are the interesting part. 'smile' is the
// collapsed quick-tap and by far the most common write of the night, so it is
// silent by design. 'heart' and 'wow' are affection, not punctuation, and have
// no sound that wouldn't wear out. Meanwhile 'shhh' and the sleigh bells map
// onto no emote at all, which is the clearest evidence that the sound menu
// wants to be its own short, deliberate, probably paid list rather than a
// second job for an emoji bar built to be mashed.
// Ids a fan is allowed to fire. Everything in the catalogue except the
// reference tone, which exists for whoever is setting the gain and would be a
// strange thing for a room to be able to trigger. Also the gate that stops an
// unknown or crafted `sound` value reaching play().
const FAN_PLAYABLE: ReadonlySet<string> = new Set(
  (Object.keys(SOUNDS) as SoundId[]).filter((id) => id !== "test")
);

export const isFanSoundId = (value: unknown): value is SoundId =>
  typeof value === "string" && FAN_PLAYABLE.has(value);

export const SOUND_FOR_REACTION: Record<string, SoundId | undefined> = {
  bang: "thunder",
  booyah: "applause",
  fire: "fog-horn",
  hundred: "cheers",
};

// Scale a rendered buffer in place. See TARGET_RMS above for why RMS leads and
// the peak only clamps.
const level = (buffer: AudioBuffer) => {
  let sumSquares = 0;
  let peak = 0;
  let count = 0;
  for (let c = 0; c < buffer.numberOfChannels; c += 1) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < data.length; i += 1) {
      const v = data[i];
      sumSquares += v * v;
      const abs = v < 0 ? -v : v;
      if (abs > peak) peak = abs;
      count += 1;
    }
  }
  if (!count || peak === 0) return;
  const rms = Math.sqrt(sumSquares / count);
  let gain = rms > 0 ? TARGET_RMS / rms : 1;
  if (peak * gain > PEAK_CEILING) gain = PEAK_CEILING / peak;
  if (gain === 1) return;
  for (let c = 0; c < buffer.numberOfChannels; c += 1) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < data.length; i += 1) data[i] *= gain;
  }
};

export interface SoundBoard {
  // Must be called from a user gesture the first time. Resolves to whether
  // the board can actually make a noise.
  unlock: () => Promise<boolean>;
  // Returns whether the sound actually fired, so a caller can tell a governed
  // drop from a play.
  //
  // `playing` answers "is a song on right now?" for the when-gate and must be
  // allowed to be null — see resolvePlaying. A caller that omits it gets the
  // honest unknown, which never blocks.
  play: (
    id: SoundId,
    opts?: { force?: boolean; playing?: SoundPlaying }
  ) => boolean;
  // Why the last drop happened, for the operator panel. A room that goes quiet
  // should be explicable at the desk rather than looking broken.
  lastDecision: () => SoundDecision | null;
  // Would this fire right now? Does not consume any budget.
  check: (id: SoundId, playing?: SoundPlaying) => SoundDecision;
  // Tonight's rule set. A dueling-pianos show and a listening room want
  // opposite amounts of governance from the same catalogue.
  setPreset: (preset: SoundPresetId) => void;
  // New show: clear every clock and per-show counter.
  resetGovernor: () => void;
  isReady: () => boolean;
  close: () => void;
}

export const createSoundBoard = (options?: {
  volume?: number;
  preset?: SoundPresetId;
}): SoundBoard => {
  const volume = options?.volume ?? 0.9;

  // The single global cooldown this used to carry has been replaced by the
  // governor, which knows what KIND each sound is. That is a deliberate
  // loosening as much as a tightening: one cooldown for everything had to be
  // set for the worst case, so it throttled applause — the one sound whose
  // degenerate case is the desired case — to protect the room from airhorns.
  const governor: RoomGovernor = createRoomGovernor(
    options?.preset ?? DEFAULT_PRESET
  );
  let lastDecision: SoundDecision | null = null;

  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let ready = false;
  let rendering: Promise<void> | null = null;
  // The bed currently running. A new bed replaces it rather than layering on
  // top — see SoundSpec.bed for why a time-based cooldown cannot do this job.
  let activeBed: { gain: GainNode; source: AudioBufferSourceNode } | null =
    null;
  const buffers = new Map<SoundId, AudioBuffer>();

  const renderAll = async (live: AudioContext) => {
    const Offline =
      window.OfflineAudioContext ??
      (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext })
        .webkitOfflineAudioContext;
    if (!Offline) return;

    // Rendered up front, at unlock, so that play() is a buffer hand-off with
    // no decode or network in the path. The whole set is a few hundred
    // milliseconds of audio.
    await Promise.all(
      (Object.keys(SOUNDS) as SoundId[]).map(async (id) => {
        const spec = SOUNDS[id];
        if (spec.url) {
          try {
            const res = await fetch(spec.url);
            const bytes = await res.arrayBuffer();
            const decoded = await live.decodeAudioData(bytes);
            level(decoded);
            buffers.set(id, decoded);
            return;
          } catch {
            // Fall through to the synth rather than leaving a silent slot.
          }
        }
        if (!spec.render) return;
        const offline = new Offline(
          1,
          Math.ceil(spec.seconds * SAMPLE_RATE),
          SAMPLE_RATE
        );
        spec.render(offline);
        const rendered = await offline.startRendering();
        level(rendered);
        buffers.set(id, rendered);
      })
    );
  };

  const unlock = async () => {
    if (typeof window === "undefined") return false;
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return false;

    if (!ctx) {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = volume;
      master.connect(ctx.destination);
    }

    // A context built outside a gesture starts suspended, and resume() only
    // succeeds from inside one — so this is called speculatively on mount (a
    // kiosk or autoplay-allowed browser lets it through and the venue never
    // sees a prompt) and again from the enable button when it doesn't.
    try {
      await ctx.resume();
    } catch {
      return false;
    }
    if (ctx.state !== "running") return false;

    if (!buffers.size) {
      // Guard against a second press landing mid-render and starting over.
      rendering = rendering ?? renderAll(ctx);
      await rendering;
    }
    ready = buffers.size > 0;
    return ready;
  };

  const stopBed = (at: number) => {
    if (!activeBed) return;
    const { gain, source } = activeBed;
    activeBed = null;
    try {
      // Faded rather than cut: stopping thirty seconds of surf dead puts a
      // click through the PA.
      gain.gain.cancelScheduledValues(at);
      gain.gain.setValueAtTime(gain.gain.value, at);
      gain.gain.linearRampToValueAtTime(0.0001, at + BED_FADE_S);
      source.stop(at + BED_FADE_S);
    } catch {
      // Already finished on its own.
    }
  };

  const play: SoundBoard["play"] = (id, opts) => {
    if (!ready || !ctx || !master) return false;
    const buffer = buffers.get(id);
    if (!buffer) return false;
    const spec = SOUNDS[id];

    // A drop, not a queue. See the header — a queue only moves the pile-up
    // into the next song.
    //
    // A forced play is an operator action — the engineer setting a level, or
    // the tone that confirms the board just armed — so it is neither governed
    // nor RECORDED. Letting it record cost the room the first real reaction
    // after arming every time, and would have muted the crowd after each
    // press while someone auditioned the panel.
    if (!opts?.force) {
      const decision = governor.tryPlay(id, {
        nowMs: Date.now(),
        playing: opts?.playing ?? null,
      });
      lastDecision = decision;
      if (!decision.ok) return false;
    }

    const at = ctx.currentTime;
    if (spec.bed) stopBed(at);

    // Its own gain node, so a bed can be trimmed under the one-shots and
    // faded out when the next one replaces it.
    const gain = ctx.createGain();
    gain.gain.value = spec.trim ?? 1;
    gain.connect(master);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(gain);
    source.start();

    if (spec.bed) {
      const entry = { gain, source };
      activeBed = entry;
      // Only clear if this is still the current bed — a replacement will have
      // already taken the slot, and its own onended must not wipe it.
      source.onended = () => {
        if (activeBed === entry) activeBed = null;
      };
    }
    return true;
  };

  return {
    unlock,
    play,
    lastDecision: () => lastDecision,
    check: (id, playing) =>
      governor.check(id, { nowMs: Date.now(), playing: playing ?? null }),
    setPreset: governor.setPreset,
    resetGovernor: governor.reset,
    isReady: () => ready,
    close: () => {
      ready = false;
      activeBed = null;
      buffers.clear();
      ctx?.close().catch(() => {});
      ctx = null;
      master = null;
    },
  };
};
