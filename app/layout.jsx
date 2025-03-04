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

// Homepage Metadata
export const metadata = {
  title: "Landon Music - Music website",
  description:
    "Landon Music is a great Nextjs Template Music Web designed to accelerate his online presence",
};

export const RootLayout = ({ children }) => (
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
          <div className="layout">
            <Settings />
            {children}
          </div>
        </LayoutProvider>
      </AnimationProvider>
    </body>
  </html>
);

export default RootLayout;
