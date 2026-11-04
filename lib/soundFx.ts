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

export type SoundId =
  | "explosion"
  | "applause"
  | "airhorn"
  | "bells"
  | "shhh"
  | "test";

// One sound every few seconds for the whole room. Long enough that two taps
// can't overlap into mush, short enough that a crowd still feels it responds
// to them.
export const DEFAULT_COOLDOWN_MS = 2500;

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
  seconds: number;
  // Synthesized by default. A spec carrying `url` prefers the recording and
  // falls back to the synth if the fetch fails, so a missing file degrades to
  // a placeholder instead of to silence.
  render?: (ctx: RenderCtx) => void;
  url?: string;
}

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

const SOUNDS: Record<SoundId, SoundSpec> = {
  explosion: {
    label: "Explosion",
    seconds: 1.9,
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

  airhorn: {
    label: "Airhorn",
    seconds: 1.5,
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

  bells: {
    label: "Sleigh bells",
    seconds: 2.2,
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

  shhh: {
    label: "Shhhhh",
    seconds: 1.5,
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

export const SOUND_LIST: { id: SoundId; label: string }[] = (
  Object.keys(SOUNDS) as SoundId[]
).map((id) => ({ id, label: SOUNDS[id].label }));

// Which of the app's existing reaction types make a noise.
//
// Four of the eight, and the gaps are the interesting part. 'smile' is the
// collapsed quick-tap and by far the most common write of the night, so it is
// silent by design. 'heart' and 'wow' are affection, not punctuation, and have
// no sound that wouldn't wear out. Meanwhile 'shhh' and the sleigh bells map
// onto no emote at all, which is the clearest evidence that the sound menu
// wants to be its own short, deliberate, probably paid list rather than a
// second job for an emoji bar built to be mashed.
export const SOUND_FOR_REACTION: Record<string, SoundId | undefined> = {
  bang: "explosion",
  booyah: "applause",
  fire: "airhorn",
  hundred: "bells",
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
  // Returns whether the sound actually fired, so a caller can tell a cooldown
  // drop from a play.
  play: (id: SoundId, opts?: { force?: boolean }) => boolean;
  isReady: () => boolean;
  close: () => void;
}

export const createSoundBoard = (options?: {
  cooldownMs?: number;
  volume?: number;
}): SoundBoard => {
  const cooldownMs = options?.cooldownMs ?? DEFAULT_COOLDOWN_MS;
  const volume = options?.volume ?? 0.9;

  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let ready = false;
  let lastPlayedAt = 0;
  let rendering: Promise<void> | null = null;
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

  const play: SoundBoard["play"] = (id, opts) => {
    if (!ready || !ctx || !master) return false;
    const buffer = buffers.get(id);
    if (!buffer) return false;

    // Global and a drop, not a queue. See the header.
    //
    // A forced play is an operator action — the engineer setting a level, or
    // the tone that confirms the board just armed — so it neither waits for
    // the cooldown nor STARTS one. Letting it start one cost the room the
    // first real reaction after arming every time, and would have muted the
    // crowd for 2.5s after each press while someone auditioned the panel.
    if (!opts?.force) {
      const now = Date.now();
      if (now - lastPlayedAt < cooldownMs) return false;
      lastPlayedAt = now;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(master);
    source.start();
    return true;
  };

  return {
    unlock,
    play,
    isReady: () => ready,
    close: () => {
      ready = false;
      buffers.clear();
      ctx?.close().catch(() => {});
      ctx = null;
      master = null;
    },
  };
};
