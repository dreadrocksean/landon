"use client";

import React, { FC } from "react";

import { DEMO_FIELD_LABEL, DemoField } from "@/lib/placeholders";

type Props = {
  demo: DemoField[];
};

// Says out loud which parts of the page are standing in.
//
// It is here for two different readers at once. For a fan who followed a link
// here, it is the difference between a page that lies to them and a page that
// is honestly half-built. For the artist, it is the nudge — the page now
// looks like something worth finishing, and this says exactly what is left.
//
// Pinned to the BOTTOM of the viewport rather than sitting at the top of the
// document. The header is `fixed top-0`, so a bar in the normal flow is
// simply covered by the nav — and pushing the nav down to make room would
// mean teaching a fixed header about a bar that is usually not there. From
// the bottom it is unmissable on every screenful without touching anyone
// else's layout.
const DemoNotice: FC<Props> = ({ demo }) => {
  if (!demo.length) return null;

  const labels = demo.map((field) => DEMO_FIELD_LABEL[field]);
  const listed =
    labels.length > 1
      ? `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`
      : labels[0];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] bg-rose/95 px-6 py-3 text-center backdrop-blur-sm">
      <p className="mx-auto max-w-4xl text-sm font-medium leading-snug text-white sm:text-base">
        <span className="font-bold uppercase tracking-wide">
          Page under construction
        </span>
        <span className="mx-2 opacity-60">—</span>
        {`${listed} ${
          labels.length > 1 ? "are" : "is"
        } sample content. Open the app to add your own.`}
      </p>
    </div>
  );
};

export default DemoNotice;
