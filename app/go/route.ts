// app/go/route.ts
// One QR destination for every phone. Venue TV boards and print material can
// carry a single code instead of the two-up iPhone/Android card, which matters
// on a wall display where a bigger code scans from further back.
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const APP_STORE = "https://apps.apple.com/app/id1645821069";
const PLAY_STORE =
  "https://play.google.com/store/apps/details?id=com.dreadrocksoftware.tellmewhattoplay";
// A desktop visitor sent to a store just gets a "we'll email you a link"
// page, so show them the marketing site instead.
const MARKETING = "https://info.tellmewhat2play.com/";

export const GET = (request: NextRequest) => {
  const ua = request.headers.get("user-agent") || "";
  if (/iPhone|iPad|iPod/i.test(ua)) return NextResponse.redirect(APP_STORE, 302);
  if (/Android/i.test(ua)) return NextResponse.redirect(PLAY_STORE, 302);
  return NextResponse.redirect(MARKETING, 302);
};
