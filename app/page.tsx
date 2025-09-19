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
import { Artist, NavigationLink, Show, User, Webpage } from "@/lib/schema";
import { storage } from "@/lib/gcp/client";

const getURL = async (path: string, artistId: string) => {
  const imageRef = ref(storage, `artists/${artistId}/imageGallery/${path}`);
  return await getDownloadURL(imageRef);
};

interface HomeProps {
  artist: Artist;
  webpage: Webpage;
  imageGallery: string[];
  shows?: Show[];
  user: User;
  navigationLinks: NavigationLink[];
}

const Home: FC<HomeProps> = async ({
  artist,
  webpage,
  imageGallery,
  shows,
  user,
  navigationLinks,
}: HomeProps) => {
  // console.log("🚀 ~ Home ~ imageGallery:", imageGallery);
  const imageUrls = webpage?.imageGallery?.length
    ? await Promise.all(
        webpage?.imageGallery?.map(async (path: string) =>
          getURL(path, artist.id)
        )
      )
    : [];

  return artist ? (
    <main className="bg-bg-dark text-white text-base">
      <Header image={artist.imageURL} navigationLinks={navigationLinks} />
      <Hero
        artistName={webpage.heroTitle}
        title={artist.bioTitle || "Bio"}
        image={webpage.heroBg}
      />
      <Featured
        header={webpage.bioHeader}
        bio={artist.bio || ""}
        name={webpage.heroTitle}
        videoUrl={webpage.featuredVideoUrl}
      />
      <UpcomingShows shows={shows} />
      <FeaturedGrid images={imageGallery} />
      <Footer tel={webpage.tel} email={webpage.email} fname={user.fname} />
    </main>
  ) : (
    <h2>Artist not found</h2>
  );
};

export default Home;
