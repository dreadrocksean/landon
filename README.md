# tmwtp-web

The public web surface of **Tell Me What To Play**. Next.js, deployed on Vercel
as the project `tmwtp-artist-pages`, serving `www.tellmewhat2play.com`.

It was originally one musician's website, which is why its git history and its
old directory were both named `landon`. It is not that any more — it is three
public-facing jobs that happen to share a deploy:

| route | what it is |
|---|---|
| `/[webRoute]` | an artist's public page — bio, photos, upcoming shows, links |
| `/[webRoute]/calendar` | that artist's show calendar, plus login/logout |
| `/tv/[code]` | the **venue board**: live vote standings on a screen in the room |
| `/go` | the smart link — opens the app if installed, else the store |

There is deliberately **no fan web app**. Every web surface funnels to the
store; the fan experience is the native app.

## The venue board

`/tv/[code]` is the one route with hardware attached. It renders the live
request standings for a show and is opened on a laptop at the venue, whose
audio output is patched into the band's PA — which is what makes the
audience sound effects in `lib/soundFx.ts` audible to the whole room.

Two hosts serve it, permanently:

- `tv.tellmewhat2play.com/ABC-123` — the short form, for typing at a venue
- `www.tellmewhat2play.com/tv/ABC-123` — what `getTvBoardCode` hands artists

The URL artists are shown is minted server-side by the `getTvBoardCode` Cloud
Function (`BOARD_BASE_URL` in the client repo's `functions/src/tvBoard.js`),
not built here — so changing it needs no app release.

Add `?fx=1` to show the operator panel, which auditions every sound effect
and bypasses both the governor and the artist's kill switch.

## Sound effects

Sounds live in `public/sfx` and come in **families**: one button, several
takes, picked at random and never the same one twice running.

A family is just a filename with trailing digits removed, so `cheers.mp3`,
`cheers2.mp3` and `cheers3.mp3` are three takes of `cheers`. **To add a take,
drop a file in `public/sfx` named after the button plus a number** — nothing
to register, no count to update. `scripts/buildSfxManifest.mjs` regenerates
`lib/sfxManifest.ts` on `predev`, `prebuild` and `pretest`, so it cannot drift
from the folder. The operator panel shows each family's size (`CHEERS ×4`) so
a drop-in can be confirmed at the desk.

`lib/soundGovernor.ts` mirrors the rules in the client repo's
`src/config/soundFx.ts` and `src/utils/soundGovernor.ts`. The two sides enforce
different halves of the same rules — a phone cannot see what other fans fired,
so the board owns every shared clock, the density budget and per-show caps.
**If you change a number in one, change it in the other**; the test suites on
both sides are what tell you.

## Commands

```bash
npm run dev     # regenerates the sfx manifest, then next dev
npm run build   # same, then next build
npm test        # same, then node --test over lib/*.test.ts
npm run sfx     # just regenerate the manifest and print family sizes
```

Tests use the Node test runner and Node's native TypeScript stripping, so this
repo has a suite without a test dependency — it tracks both
`package-lock.json` and `yarn.lock`, and adding a devDependency would update
one and leave the other to drift.
