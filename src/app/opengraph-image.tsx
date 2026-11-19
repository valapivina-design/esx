import { renderOgImage } from "@/lib/og-image";

export const alt = "101 Escrow Services — real estate and cryptocurrency escrow";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return renderOgImage({
    eyebrow: "Licensed · Bonded · Insured",
    title: "Two Escrow Services. One Standard of Trust.",
    subtitle:
      "Real estate closings and cryptocurrency transactions, verified and released under strict review.",
    photo: "home-hero.jpg",
    photoFocusY: 0.6,
  });
}
