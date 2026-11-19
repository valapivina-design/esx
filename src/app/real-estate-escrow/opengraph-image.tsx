import { renderOgImage } from "@/lib/og-image";

export const alt =
  "Real estate escrow by 101 Escrow Services — title, escrow and closing services";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return renderOgImage({
    eyebrow: "Real Estate Escrow",
    title: "Real Estate Closings Made Secure and Simple",
    subtitle: "Title, escrow, and closing services for residential and commercial property.",
    photo: "realestate-hero.jpg",
    photoFocusY: 1,
  });
}
