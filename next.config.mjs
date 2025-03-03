/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    loader: "imgix", // or use 'cloudinary', 'akamai', or other supported loaders
    path: "", // or specify a custom path if needed,
    unoptimized: true, // Disables the default behavior of optimizing images with the next/image component
    // disableStaticImages: true, // Disable the default image optimization
  },
  output: "export",
};

export default nextConfig;
