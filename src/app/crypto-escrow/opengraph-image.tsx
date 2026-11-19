import { renderOgImage } from "@/lib/og-image";

export const alt =
  "Crypto escrow by 101 Escrow Services — funds held in cold storage and released manually";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return renderOgImage({
    eyebrow: "Crypto Escrow",
    title: "Secure Cryptocurrency Escrow, Built on Decades of Trust",
    subtitle:
      "Funds held in multi-signature cold storage, reviewed by our team, and released manually.",
    photo: "crypto-hero.jpg",
  });
}
