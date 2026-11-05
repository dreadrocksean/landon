// lib/soundVisuals.ts
// What the room SEES when it hears something.
//
// Five sounds carry a picture: thunder flashes, rain falls, explosions blow
// the screen white, cheers throw confetti and the sleigh goes past. The rest
// stay invisible on purpose — a board where every sound painted something
// would be a screensaver, and the ones that do fire land harder for being
// the exception.
//
// A visual is raised only where the SOUND actually played, never where the
// write landed. A picture with no noise behind it reads as a glitch, and the
// governor drops plenty on a busy night.

import type { SoundId } from "./soundFx";

export type VisualKind =
  | "lightning"
  | "rain"
  | "flash"
  | "confetti"
  | "santa";

export const VISUAL_FOR_SOUND: Partial<Record<SoundId, VisualKind>> = {
  thunder: "lightning",
  rain: "rain",
  explosion: "flash",
  cheers: "confetti",
  "xmas-bells": "santa",
};

// How long each one is on screen. Roughly the length of the sound it rides,
// except the two bright ones: lightning and the explosion flash are over in
// about a second because the sound keeps going and a strobe that lasts as
// long as a twelve-second explosion is an assault.
export const VISUAL_MS: Record<VisualKind, number> = {
  lightning: 1400,
  rain: 20000,
  flash: 1000,
  confetti: 5600,
  santa: 6500,
};

// The smallest gap between two of the same visual.
//
// This is a LEGIBILITY throttle, not a safety rail. Thunder is a `hit` and
// forty phones can reach for it at once; with no gap at all the screen
// strobes into mush and stops reading as lightning, which costs the effect
// the thing that made it worth having. A second and a half is enough for one
// flash to land as an event before the next.
//
// Set these to 0 to let the audio governor's own spacing be the only limit.
// (It is also true that full-screen flashing is a seizure trigger above
// roughly three a second, so a gap here is not purely cosmetic — but the
// number below is chosen for how it LOOKS.)
export const VISUAL_GAP_MS: Record<VisualKind, number> = {
  lightning: 1500,
  flash: 1500,
  rain: 20000,
  confetti: 7000,
  santa: 8000,
};

// The two that change the whole screen's brightness. They share ONE clock
// rather than getting a gap each, because the eye does not care which sound
// caused a flash — thunder and an explosion 200ms apart just looks like the
// screen glitched, so the throttle has to count them together to do its job.
export const BRIGHT_VISUALS: ReadonlySet<VisualKind> = new Set([
  "lightning",
  "flash",
]);

export const visualFor = (id: SoundId): VisualKind | undefined =>
  VISUAL_FOR_SOUND[id];
