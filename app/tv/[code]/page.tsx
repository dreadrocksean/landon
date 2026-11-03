// app/tv/[code]/page.tsx
// The venue TV board, opened on a screen in the room at /tv/ABC-123.
//
// Server-rendered so the board is already painted when the screen wakes up
// (no spinner on a wall display), then TvBoard subscribes for live updates.
import { Metadata } from "next";
import { redirect } from "next/navigation";
import QRCode from "qrcode-svg";

import {
  decodeCodeParam,
  formatBoardCode,
  normalizeBoardCode,
} from "@/lib/board";
import { getBoardByCode } from "@/lib/gcp/board";
import BoardNotFound from "./BoardNotFound";
import TvBoard from "./TvBoard";

export const dynamic = "force-dynamic";

const SITE = "https://www.tellmewhat2play.com";

interface TvPageProps {
  params: { code: string };
}

export const generateMetadata = async ({
  params,
}: TvPageProps): Promise<Metadata> => {
  const board = await getBoardByCode(decodeCodeParam(params.code));
  return {
    title: board ? `${board.artistName} — Live Requests` : "Live Requests",
    // A venue's board URL has no business in search results.
    robots: { index: false, follow: false },
  };
};

const TvBoardPage = async ({ params }: TvPageProps) => {
  const code = normalizeBoardCode(decodeCodeParam(params.code));
  // Nothing usable in the URL at all — show the help screen rather than
  // redirecting to an equally empty one.
  if (!code) return <BoardNotFound entered="" />;

  // Settle on one spelling (ABC-123) so a venue that bookmarks the page, or
  // casts it from history, always lands on the same URL.
  const displayCode = formatBoardCode(code);
  if (params.code !== displayCode) redirect(`/tv/${displayCode}`);

  const board = await getBoardByCode(code);
  if (!board) return <BoardNotFound entered={displayCode} />;

  // Generated here rather than fetched from a QR image service: the code is
  // the one thing on this screen that has to work, and a gig is no place to
  // discover a third party is down. svg-viewbox scales to whatever box the
  // layout gives it.
  const qrSvg = new QRCode({
    content: `${SITE}/go`,
    padding: 1,
    width: 512,
    height: 512,
    color: "#06062a",
    background: "#ffffff",
    ecl: "M",
    join: true,
    container: "svg-viewbox",
    xmlDeclaration: false,
  }).svg();

  return (
    <TvBoard
      code={code}
      displayCode={displayCode}
      initial={board}
      qrSvg={qrSvg}
    />
  );
};

export default TvBoardPage;
