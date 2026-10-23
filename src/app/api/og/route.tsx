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

/**
 * Reverses word sequence so Satori's LTR layouter outputs natural Arabic RTL order.
 * Example: "انقر هنا لمشاهدة" -> "لمشاهدة هنا انقر" (renders as "انقر" on the right, "لمشاهدة" on the left).
 */
function fixArabicRtl(text: string): string {
  if (!text) return "";
  return text.trim().split(/\s+/).reverse().join(" ");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawTitle = searchParams.get("title") || searchParams.get("cat") || "جميع المنتجات";

  // Clean title: extract category name if prefixed with "انقر هنا لمشاهدة"
  const categoryName = rawTitle.replace(/^انقر هنا لمشاهدة\s*/, "").trim() || "جميع المنتجات";

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

  // Calculate dynamic font size for line 2 based on length
  const isVeryLong = categoryName.length > 28;
  const isLong = categoryName.length > 18;
  const line2Size = isVeryLong ? 60 : isLong ? 72 : 86;

  const line1Rtl = fixArabicRtl("انقر هنا لمشاهدة");
  const line2Rtl = fixArabicRtl(categoryName);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#090d16",
          backgroundImage:
            "radial-gradient(circle at 50% 45%, #172033 0%, #090d16 100%)",
          color: "#ffffff",
          fontFamily: "Cairo",
          border: "14px solid #f59e0b",
          boxSizing: "border-box",
          padding: "40px 60px",
          textAlign: "center",
        }}
      >
        {/* Line 1: انقر هنا لمشاهدة (Bold clear font) */}
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: "#cbd5e1",
            marginBottom: 20,
            letterSpacing: "-0.01em",
            textShadow: "0 2px 10px rgba(0,0,0,0.8)",
          }}
        >
          {line1Rtl}
        </div>

        {/* Line 2: اسم الفئة (Thicker, bigger, high-contrast gold/amber) */}
        <div
          style={{
            fontSize: line2Size,
            fontWeight: 900,
            color: "#f59e0b",
            lineHeight: 1.2,
            maxWidth: "1080px",
            textShadow: "0 4px 28px rgba(245, 158, 11, 0.35)",
          }}
        >
          {line2Rtl}
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
