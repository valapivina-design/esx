import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const OG_SIZE = { width: 1200, height: 630 };

const NAVY = "#080f24";
const GOLD = "#c9a467";

// The brand photos are 896x1200 portraits. They are drawn slightly wider than
// the panel and shifted vertically to choose which band of the photo shows.
const PHOTO_PANEL_WIDTH = 520;
const PHOTO_WIDTH = 570;
const PHOTO_HEIGHT = Math.round((PHOTO_WIDTH * 1200) / 896);

type OgImageOptions = {
  eyebrow: string;
  title: string;
  subtitle: string;
  /** JPEG file name inside `public/images`, e.g. "home-hero.jpg". */
  photo: string;
  /** 0 shows the top of the photo, 1 the bottom. Defaults to the middle. */
  photoFocusY?: number;
};

// Each path is scoped to a fixed subfolder so the bundler traces only that
// folder instead of the whole project.
const readImage = (name: string) => readFile(join(process.cwd(), "public/images", name));
// Satori cannot parse the variable-weight PlayfairDisplay.ttf used by
// next/font, so the share card loads static instances of the same family.
const readFont = (name: string) => readFile(join(process.cwd(), "src/app/fonts", name));

/** Renders the shared 1200x630 share card used by every `opengraph-image` route. */
export async function renderOgImage({
  eyebrow,
  title,
  subtitle,
  photo,
  photoFocusY = 0.5,
}: OgImageOptions) {
  const [regular, bold, photoData] = await Promise.all([
    readFont("PlayfairDisplay-Regular.woff"),
    readFont("PlayfairDisplay-Bold.woff"),
    readImage(photo),
  ]);
  const photoSrc = `data:image/jpeg;base64,${photoData.toString("base64")}`;
  const photoTop = -Math.round((PHOTO_HEIGHT - OG_SIZE.height) * photoFocusY);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          position: "relative",
          width: "100%",
          height: "100%",
          backgroundColor: NAVY,
          fontFamily: "Playfair Display",
        }}
      >
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 0,
            right: 0,
            width: PHOTO_PANEL_WIDTH,
            height: OG_SIZE.height,
            overflow: "hidden",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- rendered by Satori, not the browser */}
          <img
            src={photoSrc}
            alt=""
            width={PHOTO_WIDTH}
            height={PHOTO_HEIGHT}
            style={{ position: "absolute", top: photoTop, left: (PHOTO_PANEL_WIDTH - PHOTO_WIDTH) / 2 }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundImage: `linear-gradient(to right, ${NAVY} 0%, rgba(8, 15, 36, 0.55) 30%, rgba(8, 15, 36, 0) 65%)`,
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: 760,
            height: "100%",
            padding: "56px 0 64px 72px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: 3,
                textTransform: "uppercase",
                color: GOLD,
              }}
            >
              101 Escrow Services
            </div>
            <div
              style={{
                marginTop: 10,
                width: 280,
                height: 2,
                backgroundColor: GOLD,
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                borderLeft: `3px solid ${GOLD}`,
                paddingLeft: 16,
                fontSize: 22,
                letterSpacing: 4,
                textTransform: "uppercase",
                color: GOLD,
              }}
            >
              {eyebrow}
            </div>
            <div
              style={{
                marginTop: 24,
                maxWidth: 640,
                fontSize: 56,
                fontWeight: 700,
                lineHeight: 1.14,
                color: "#ffffff",
                textWrap: "balance",
              }}
            >
              {title}
            </div>
            <div
              style={{
                marginTop: 24,
                maxWidth: 600,
                fontSize: 27,
                lineHeight: 1.4,
                color: "rgba(255, 255, 255, 0.74)",
                textWrap: "balance",
              }}
            >
              {subtitle}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Playfair Display", data: regular, weight: 400, style: "normal" },
        { name: "Playfair Display", data: bold, weight: 700, style: "normal" },
      ],
    }
  );
}
