// What an artist's page shows before they have filled anything in.
//
// The problem this solves is motivational, not technical. A new artist gets a
// web route, opens it, and sees a blank purple screen: an empty hero with no
// name on it, an empty bio section, no shows, no gallery. It looks broken
// rather than unfinished, and nothing about it suggests what the page could
// be — so it does not make anyone want to go and fill it in.
//
// Of the fourteen artists with a web route today, ten have no hero title,
// eleven have no bio header, twelve have no video and NONE have a gallery.
// This is the normal state of an artist page, not an edge case.
//
// Two rules hold the whole thing together:
//
//  1. REAL CONTENT ALWAYS WINS, field by field. An artist with a bio and a
//     hero image but no gallery gets their own bio, their own image, and
//     demo photos — never a demo bio sitting on top of one they wrote.
//
//  2. ANYTHING SUBSTITUTED IS DECLARED. These pages are public at a real
//     URL, and a stranger's photo presented as this band's, with lorem
//     ipsum under it, is a lie told to whoever lands there. Marked, the same
//     page reads as a page under construction — which is both honest and a
//     better prod to the artist than silence.
//
// The CALENDAR is the one section where "empty means unconfigured" is not a
// safe inference, and so it is the one section with a switch. Every other
// field here is one an artist either has or has not got round to; a working
// artist can quite reasonably have no gigs on the books this month, and that
// is not the same thing as never having set the page up. Inferring from
// emptiness would leave them showing sample dates forever with no way to
// say "this is real, I am just quiet in January".
//
// So shows stand in until the artist takes the calendar live, and from that
// moment the section reads their actual gigs — including when there are
// none. It is also the one placeholder that can put a real person outside a
// real door on a night when nothing is happening, which is why the demo
// dates say so on the section itself and not only in the page notice.

import type { ClientArtist, ClientShow, ClientWebpage } from "@/lib/schema";

// Stock photography from Pexels (free to use, no attribution required),
// stored in the repo rather than hot-linked so every unconfigured page is
// served the same assets off our own CDN and nothing breaks if the source
// moves. The hero is silhouettes on a smoke-filled stage — chosen because
// nobody in it is identifiable, which is the right property for an image
// standing in for a band that is not the band in the photo.
export const DEMO_HERO_BG = "/img/demo/hero.jpg";
export const DEMO_VIDEO = "/img/demo/set.mp4";
export const DEMO_GALLERY = [
  "/img/demo/gallery-1.jpg",
  "/img/demo/gallery-2.jpg",
  "/img/demo/gallery-3.jpg",
  "/img/demo/gallery-4.jpg",
  "/img/demo/gallery-5.jpg",
  // Six, not five: the grid is four across on a wide screen and three on a
  // tablet, and five leaves an orphan on both.
  "/img/demo/gallery-6.jpg",
];

// Latin, and obviously so. A plausible-sounding English placeholder bio is
// worse than lorem ipsum here: it reads as something the artist wrote, which
// is exactly the impression this must not give.
export const DEMO_BIO = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer vitae",
  "libero ac risus egestas placerat. Nulla facilisi. Vestibulum ante ipsum",
  "primis in faucibus orci luctus et ultrices posuere cubilia curae; Donec",
  "velit neque, auctor sit amet aliquam vel, ullamcorper sit amet ligula.",
  "Curabitur arcu erat, accumsan id imperdiet et, porttitor at sem.",
  "",
  "Praesent sapien massa, convallis a pellentesque nec, egestas non nisi.",
  "Quisque velit nisi, pretium ut lacinia in, elementum id enim. Sed",
  "porttitor lectus nibh. Donec rutrum congue leo eget malesuada. Mauris",
  "blandit aliquet elit, eget tincidunt nibh pulvinar a.",
].join(" ");

// Not marked as demo: true for every artist on the platform, and a heading
// that says "About" is not a claim about anybody.
const FALLBACK_BIO_HEADER = "ABOUT THE MUSIC";

// Which fields on the rendered page came from the demo set rather than from
// the artist. Drives the notice, and is worth having as data rather than a
// boolean so the notice can name what is standing in.
export type DemoField = "heroBg" | "bio" | "video" | "gallery" | "shows";

export const DEMO_FIELD_LABEL: Record<DemoField, string> = {
  heroBg: "the cover photo",
  bio: "the bio",
  video: "the video",
  gallery: "the gallery photos",
  shows: "the show dates",
};

// Sample gigs, dated from whenever the page is rendered so they are always
// in the near future — a sample calendar whose dates have gone by says
// "abandoned", which is the opposite of the job.
const DAY_MS = 86400000;

export const buildDemoShows = (now: number = Date.now()): ClientShow[] =>
  [
    { inDays: 5, venueName: "The Sample Room", city: "Kansas City, MO", hour: 20 },
    { inDays: 12, venueName: "Example Street Tavern", city: "Overland Park, KS", hour: 21 },
    { inDays: 19, venueName: "Placeholder Hall", city: "Lee's Summit, MO", hour: 19 },
  ].map((row, i) => {
    const start = new Date(now + row.inDays * DAY_MS);
    start.setHours(row.hour, 0, 0, 0);
    const stop = new Date(start.getTime() + 3 * 60 * 60 * 1000);
    return {
      id: `demo-show-${i}`,
      venueName: row.venueName,
      showTitle: row.city,
      scheduledStart: start.getTime(),
      scheduledStop: stop.getTime(),
      createdAt: now,
    } as unknown as ClientShow;
  });

export type PageContent = {
  heroTitle: string;
  heroTagline: string;
  heroBg: string;
  bioHeader: string;
  bio: string;
  videoUrl: string;
  gallery: string[];
  shows: ClientShow[];
  /** The artist has taken the calendar live, so `shows` is their real data. */
  showsLive: boolean;
  demo: DemoField[];
  /** Any demo content on the page at all. */
  isDemo: boolean;
};

const trimmed = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

export const buildPageContent = ({
  artist,
  webpage,
  shows,
  gallery,
  now,
}: {
  artist: ClientArtist | null;
  webpage: ClientWebpage | null;
  shows?: ClientShow[] | null;
  gallery?: string[] | null;
  now?: number;
}): PageContent => {
  const demo: DemoField[] = [];

  // The artist's own name, not a placeholder — it is already on the artist
  // doc for everyone. Ten of fourteen pages were rendering a giant empty
  // headline purely because heroTitle happened to live on a different
  // document from the name.
  const heroTitle =
    trimmed(webpage?.heroTitle) || trimmed(artist?.name) || "Live Music";

  // Likewise real: the artist's own instrument and city, when they have
  // them. A line that says what they actually play beats a Latin one.
  const heroTagline =
    trimmed(webpage?.heroText) || describeArtist(artist) || "Live Music";

  const heroBg = trimmed(webpage?.heroBg);
  const bio = trimmed(artist?.bio);
  const videoUrl = trimmed(webpage?.featuredVideoUrl);
  const realGallery = (gallery ?? []).filter((url) => trimmed(url));

  // Explicitly true, not merely truthy: an absent field means an artist who
  // has never seen the switch, and that has to read as not-yet-live.
  const showsLive = webpage?.showsLive === true;

  if (!heroBg) demo.push("heroBg");
  if (!bio) demo.push("bio");
  if (!videoUrl) demo.push("video");
  if (!realGallery.length) demo.push("gallery");
  if (!showsLive) demo.push("shows");

  return {
    heroTitle,
    heroTagline,
    heroBg: heroBg || DEMO_HERO_BG,
    bioHeader: trimmed(webpage?.bioHeader) || FALLBACK_BIO_HEADER,
    bio: bio || DEMO_BIO,
    videoUrl: videoUrl || DEMO_VIDEO,
    gallery: realGallery.length ? realGallery : DEMO_GALLERY,
    // Their real gigs the moment the switch is on, whether or not there are
    // any. Sample dates until then. See the header.
    shows: showsLive ? shows ?? [] : buildDemoShows(now),
    showsLive,
    demo,
    isDemo: demo.length > 0,
  };
};

// "Guitar and vocals in Kansas City" from fields the artist filled in when
// they signed up. Returns "" rather than a half-sentence when there is not
// enough to say something true.
const describeArtist = (artist: ClientArtist | null): string => {
  if (!artist) return "";
  // `instruments` and `city` are written by the app's artist editor but are
  // not on the Webpage-facing Artist type, so they are read defensively
  // rather than added to a schema shared with code that does not want them.
  const extra = artist as { instruments?: string[]; city?: string };
  const parts = (extra.instruments ?? artist.roles ?? [])
    .map((r) => trimmed(r))
    .filter(Boolean);
  const city = trimmed(extra.city);
  const played =
    parts.length > 1
      ? `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`
      : parts[0] ?? "";
  if (played && city) return `${played} in ${city}`;
  if (played) return played;
  if (city) return `Live in ${city}`;
  return "";
};
