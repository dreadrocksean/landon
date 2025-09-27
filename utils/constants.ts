// utils/constants.ts

import { NavigationLink } from "@/lib/schema";

export const getNavigationLinks = (webRoute: string): NavigationLink[] => [
  { id: 1, title: "Home", route: `/${webRoute}` },
  { id: 2, title: "about", route: `/${webRoute}#featured_music` },
  // { id: 3, title: "albums", route: `/${webRoute}#albums` },
  { id: 5, title: "gallery", route: `/${webRoute}#gallery` },
  { id: 7, title: "Shows", route: `/${webRoute}#shows` },
  // { id: 8, title: "BLOG", route: `#blog` },
  { id: 9, title: "Calendar", auth: true, route: `/${webRoute}/calendar` },
  { id: 10, title: "Login", auth: false, route: `/${webRoute}/login` },
  { id: 11, title: "Logout", auth: true, route: `/${webRoute}/logout` },
];
