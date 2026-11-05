// The short host for the venue board. Kept as a constant because it appears
// in both a rewrite and a redirect, and a typo in one of them is a 404 at a
// gig rather than a build error.
const TV_HOST = "tv.tellmewhat2play.com";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    loader: "imgix", // or use 'cloudinary', 'akamai', or other supported loaders
    path: "", // or specify a custom path if needed,
    unoptimized: true, // Disables the default behavior of optimizing images with the next/image component
    // disableStaticImages: true, // Disable the default image optimization
  },
  // Dynamic (SSR) mode — runs on Vercel; artist pages render per-request with live data.
  reactStrictMode: true,

  // tv.tellmewhat2play.com/ABC-123 serves the board that lives at /tv/ABC-123
  // on the main host.
  //
  // Worth the indirection because of WHO types this URL: someone on a
  // borrowed laptop, in a dark bar, minutes before going on. That is 30
  // characters against 38, and no /tv/ segment to get wrong.
  //
  // The www path is NOT retired. getTvBoardCode has already handed it out and
  // some artists have it written down, so both hosts serve the same board
  // forever — this is an alias, not a move.
  async rewrites() {
    return {
      // beforeFiles, so the code is claimed before /[webRoute] can read it as
      // an artist page. That only matters on this host; www is untouched.
      beforeFiles: [
        {
          // Six alphanumerics, with or without the separator — the same shapes
          // normalizeBoardCode already forgives. The page re-canonicalises and
          // redirects, so a sloppy hand-typed code still lands.
          source: "/:code([A-Za-z0-9-]{6,8})",
          has: [{ type: "host", value: TV_HOST }],
          destination: "/tv/:code",
        },
      ],
    };
  },

  async redirects() {
    return [
      {
        // A bare tv.* has no code to show, and would otherwise fall through to
        // /[webRoute] and render a not-found page for an artist called "".
        source: "/",
        has: [{ type: "host", value: TV_HOST }],
        destination: "https://www.tellmewhat2play.com/",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
// module.exports = nextConfig;
