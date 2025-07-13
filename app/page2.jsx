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

export const Home = () => (
  <main className="bg-bg-dark text-white text-base">
    <Header />
    <Hero />
  </main>
);

export default Home;
