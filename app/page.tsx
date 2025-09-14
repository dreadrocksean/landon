import React, { FC, use } from "react";
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
import { ref, getDownloadURL } from "firebase/storage";
import { Artist, Show, Webpage } from "@/lib/schema";
import { storage } from "@/lib/gcp/client";

const getURL = async (path: string, artistId: string) => {
  const imageRef = ref(storage, `artists/${artistId}/imageGallery/${path}`);
  return await getDownloadURL(imageRef);
};

interface HomeProps {
  artist: Artist;
  webpage: Webpage;
  shows?: Show[];
}

const Home: FC<HomeProps> = async ({ artist, webpage, shows }: HomeProps) => {
  const imageUrls = await Promise.all(
    webpage?.imageGallery?.map(async (path: string) => getURL(path, artist.id))
  );

  return (
    <main className="bg-bg-dark text-white text-base">
      <Header image={artist.imageURL} />
      <Hero
        artistName={webpage.heroTitle}
        title={artist.bioTitle || "Bio"}
        image={artist.imageURL}
      />
      <Featured
        header={webpage.bioHeader}
        bio={artist.bio || ""}
        name={webpage.heroTitle}
      />
      <UpcomingShows shows={shows} />
      <FeaturedGrid images={imageUrls} />
      <Footer />
    </main>
  );
};

export default Home;
