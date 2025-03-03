import FeaturedGrid from "@/components/featured-grid";
import Featured from "../home-2/_components/featured";
import FeaturedAlbums from "../home-2/_components/featured-albums";
import FeaturedSongs from "../home-2/_components/featured-songs";
import Header from "../home-2/_components/header";

import UpcomingShows from "../home-2/_components/upcoming-shows";
import LatestBlogs from "../home-2/_components/latest-blogs";
import Footer from "../home-2/_components/footer";
import Hero from "./_components/Hero/Hero";
import LatestAlbums from "./_components/latest-albums";

const HomePage4 = () => {
  return (
    <>
      <div className="text-base h-[200vh] text-white">
        <Header />
        <Hero />
        <FeaturedSongs />
        <LatestAlbums />
        <FeaturedAlbums />
        <Featured />
        <FeaturedGrid />
        <UpcomingShows />
        <LatestBlogs />
        <Footer />
      </div>
    </>
  );
};
export default HomePage4;
