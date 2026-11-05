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

// The smallest gap between two of the same visual, and the reason this file
// has a rate limit at all.
//
// PHOTOSENSITIVITY. Full-screen luminance flashes above about three per
// second are a recognised seizure trigger (WCAG 2.3.1), and both flashing
// sounds are mashable — thunder is a `hit` and forty phones can reach for it
// at once. The audio governor already thins that out, but it is tuned for
// what a room can stand hearing, not for what a screen can safely show, so
// the limit is enforced here as well and set far below the threshold. The
// keyframes themselves stay under it too: two flashes in lightning, one in
// the explosion.
//
// The rest are gapped only so they do not stack into mush.
export const VISUAL_GAP_MS: Record<VisualKind, number> = {
  lightning: 5000,
  flash: 5000,
  rain: 20000,
  confetti: 7000,
  santa: 8000,
};

// The two that change the whole screen's brightness. They share ONE clock
// rather than getting a gap each, because the eye does not care which sound
// caused a flash — two different bright visuals 300ms apart is still two
// flashes, and the limit has to count them together to mean anything.
export const BRIGHT_VISUALS: ReadonlySet<VisualKind> = new Set([
  "lightning",
  "flash",
]);

export const visualFor = (id: SoundId): VisualKind | undefined =>
  VISUAL_FOR_SOUND[id];
