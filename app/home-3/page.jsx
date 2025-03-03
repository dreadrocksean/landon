import Featured from "@/components/featured";
import FeaturedAlbums from "@/components/featured-albums";
import FeaturedGrid from "@/components/featured-grid";
import Footer from "@/components/footer";
import Header from "@/components/header";

import LatestBlogs from "@/components/latest-blogs";
import Members from "@/components/members";
import NewestAlbums from "@/components/newest-albums";
import Testimonials from "@/components/testimonials";
import UpcomingShows from "@/components/upcoming-shows";
import Hero from "./_components/Hero";

const page = () => {
  return (
    <main className="bg-bg-dark text-white text-base">
      <Header />
      <Hero />
      <Featured />
      <NewestAlbums />
      <UpcomingShows />
      <FeaturedGrid />
      <FeaturedAlbums />
      <Members />
      <Testimonials />
      <LatestBlogs />
      <Footer />
    </main>
  );
};
export default page;
