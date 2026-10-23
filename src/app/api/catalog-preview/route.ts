import { NextRequest, NextResponse } from "next/server";
import { getPreviewProductPage } from "@/lib/catalog-preview";

export async function GET(request: NextRequest) {
  const categoryText = request.nextUrl.searchParams.get("categoryId") ?? "";
  const afterText = request.nextUrl.searchParams.get("after");
  const categoryId = Number(categoryText);
  const after = afterText === null ? null : Number(afterText);
  if (!/^[1-9]\\d*$/.test(categoryText) ||
      !Number.isSafeInteger(categoryId) ||
      (afterText !== null && (!/^[1-9]\\d*$/.test(afterText) || !Number.isSafeInteger(after)))) {
    return NextResponse.json({ error: "Invalid category or cursor" }, { status: 400 });
  }
  try {
    const page = await getPreviewProductPage(categoryId, after);
    return NextResponse.json(page, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } });
  } catch {
    return NextResponse.json({ error: "تعذر تحميل القطع، حاول مرة ثانية" }, { status: 503 });
  }
}
