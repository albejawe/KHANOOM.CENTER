import { ImageResponse } from "next/og";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

let cachedFont: Buffer | null = null;

function getCairoFont(): Buffer | null {
  if (cachedFont) return cachedFont;
  try {
    const fontPath = join(process.cwd(), "public", "fonts", "Cairo-Bold.ttf");
    if (existsSync(/*turbopackIgnore: true*/ fontPath)) {
      cachedFont = readFileSync(/*turbopackIgnore: true*/ fontPath);
      return cachedFont;
    }
  } catch {
    // ignore
  }
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") || "انقر هنا لمشاهدة جميع المنتجات";
  const subtitle = searchParams.get("subtitle") || "مجمع خانم للأزياء والكوزمتكس";

  let fontData = getCairoFont();
  if (!fontData) {
    try {
      const res = await fetch(
        "https://cdn.jsdelivr.net/fontsource/fonts/cairo@latest/arabic-700-normal.ttf"
      );
      if (res.ok) {
        fontData = Buffer.from(await res.arrayBuffer());
        cachedFont = fontData;
      }
    } catch (e) {
      console.error("Font fetch fallback failed:", e);
    }
  }

  // Calculate dynamic font size based on text length
  const isLong = title.length > 30;
  const isVeryLong = title.length > 45;
  const fontSize = isVeryLong ? 46 : isLong ? 54 : 66;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#0b1329",
          backgroundImage:
            "radial-gradient(circle at 50% 30%, #1e293b 0%, #0b1329 100%)",
          color: "#ffffff",
          fontFamily: "Cairo",
          direction: "rtl",
          padding: "50px 60px",
          border: "16px solid #d97706",
          boxSizing: "border-box",
        }}
      >
        {/* Top Header Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            backgroundColor: "rgba(217, 119, 6, 0.15)",
            border: "2px solid rgba(245, 158, 11, 0.4)",
            borderRadius: "30px",
            padding: "10px 28px",
          }}
        >
          <div
            style={{
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              backgroundColor: "#f59e0b",
            }}
          />
          <span
            style={{
              fontSize: 26,
              fontWeight: "bold",
              color: "#fef3c7",
            }}
          >
            {subtitle}
          </span>
        </div>

        {/* Center Main Huge Call to Action */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            maxWidth: "1050px",
            padding: "0 20px",
          }}
        >
          <div
            style={{
              fontSize,
              fontWeight: 900,
              color: "#ffffff",
              lineHeight: 1.25,
              textShadow: "0 4px 20px rgba(0,0,0,0.8)",
            }}
          >
            {title}
          </div>
        </div>

        {/* Bottom Action Pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#d97706",
            borderRadius: "24px",
            padding: "14px 44px",
            boxShadow: "0 10px 30px rgba(217, 119, 6, 0.4)",
          }}
        >
          <span
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: "#0b1329",
            }}
          >
            تصفح المعرض والأسعار الآن 👈
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: fontData
        ? [
            {
              name: "Cairo",
              data: fontData,
              style: "normal",
              weight: 700,
            },
          ]
        : undefined,
      headers: {
        "content-type": "image/png",
        "cache-control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    }
  );
}
