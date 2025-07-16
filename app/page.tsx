import Header from "@/components/header";
import Hero from "@/components/hero";
import Featured from "@/components/featured";
import UpcomingShows from "@/components/upcoming-shows";
// import NewestAlbums from "@/components/newest-albums";
import FeaturedGrid from "@/components/featured-grid";
// import FeaturedAlbums from "@/components/featured-albums";
// import Members from "@/components/members";
// import Testimonials from "@/components/testimonials";
// import LatestBlogs from "@/components/latest-blogs";
import Footer from "@/components/footer";
import type { FC } from "react";

export const Home: FC = () => (
  <main className="bg-bg-dark text-white text-base">
    <Header />
    <Hero />
    <Featured />
    {/* <NewestAlbums /> */}
    <UpcomingShows />
    <FeaturedGrid />
    {/* <FeaturedAlbums /> */}
    {/* <Members /> */}
    {/* <Testimonials /> */}
    {/* <LatestBlogs /> */}
    <Footer />
  </main>
);

export default Home;
