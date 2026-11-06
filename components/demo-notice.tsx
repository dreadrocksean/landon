"use client";

import React, { FC } from "react";

import useIsOwner from "@/hooks/useIsOwner";
import { DEMO_FIELD_LABEL, DemoField } from "@/lib/placeholders";

type Props = {
  demo: DemoField[];
};

// Says out loud which parts of the page are standing in.
//
// Two people read this bar and they need different sentences. A FAN wants to
// know not to take the photographs for the band — that is all; telling them
// to open the app and add their own is nonsense, because there is nothing
// they could do about it and it reads as if the site has mistaken them for
// somebody else. The ARTIST is the only one who can act, so they are the only
// one who gets told to.
//
// Pinned to the BOTTOM of the viewport rather than sitting at the top of the
// document. The header is `fixed top-0`, so a bar in the normal flow is
// simply covered by the nav — and pushing the nav down to make room would
// mean teaching a fixed header about a bar that is usually not there. From
// the bottom it is unmissable on every screenful without touching anyone
// else's layout.
const DemoNotice: FC<Props> = ({ demo }) => {
  const isOwner = useIsOwner();

  if (!demo.length) return null;

  const labels = demo.map((field) => DEMO_FIELD_LABEL[field]);
  const listed =
    labels.length > 1
      ? `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`
      : labels[0];
  const plural = labels.length > 1;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] bg-rose/95 px-6 py-3 text-center backdrop-blur-sm">
      <p className="mx-auto max-w-4xl text-sm font-medium leading-snug text-white sm:text-base">
        <span className="font-bold uppercase tracking-wide">
          Page under construction
        </span>
        <span className="mx-2 opacity-60">—</span>
        {isOwner
          ? `${listed} ${plural ? "are" : "is"} sample content. Open the app to add your own.`
          : `${listed} ${plural ? "are" : "is"} sample content, not this artist's own.`}
      </p>
    </div>
  );
};

export default DemoNotice;
