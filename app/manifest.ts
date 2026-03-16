import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ceremonia",
    short_name: "Ceremonia",
    description:
      "Create cinematic, personalised event invitations your guests will never forget.",
    start_url: "/",
    display: "standalone",
    background_color: "#0F0A0A",
    theme_color: "#D4AF37",
    orientation: "portrait",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
