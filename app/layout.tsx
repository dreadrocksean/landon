import "./globals.css";
import { twMerge } from "tailwind-merge";
import "aos/dist/aos.css"; // Import AOS CSS file

// Fonts from google fonts
import {
  dMSans,
  kumbhSans,
  spaceGrotesk,
  pacifico,
  poppins,
} from "@/fonts/fonts";

import AnimationProvider from "./AnimationProvider";
import Settings from "@/components/Settings";
import LayoutProvider from "./LayoutProvider";
import "@/styles/layout.css";

// ✅ Required metadata export in App Router
export const metadata = {
  title: "Landon Music - Music website",
  description:
    "Landon Music is a great Nextjs Template Music Web designed to accelerate his online presence",
};

// ✅ Required RootLayout type
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={twMerge(
          spaceGrotesk.className,
          dMSans.variable,
          kumbhSans.variable,
          pacifico.variable,
          poppins.variable
        )}
      >
        <AnimationProvider>
          <LayoutProvider>
            <>
              <Settings />
              {children}
            </>
          </LayoutProvider>
        </AnimationProvider>
      </body>
    </html>
  );
}
