import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { imageUrl } from "../images";
import { formatPrice } from "../format";

const PROJECT_ROOT = join(process.cwd());

describe("Requirement 1: Complete removal of Admin entry from Visitor UI", () => {
  it("ensures no admin links or buttons exist in visitor pages and components", () => {
    const visitorFiles = [
      "src/app/page.tsx",
      "src/app/c/[id]/page.tsx",
      "src/app/s/[id]/page.tsx",
      "src/components/site/CategoryCard.tsx",
      "src/components/site/ProductGrid.tsx",
      "src/components/site/ProductViewer.tsx",
      "src/components/site/SiteHeader.tsx",
      "src/components/site/FastCatalog.tsx",
    ];

    for (const relPath of visitorFiles) {
      const fullPath = join(PROJECT_ROOT, relPath);
      expect(existsSync(fullPath), `File should exist: ${relPath}`).toBe(true);

      const content = readFileSync(fullPath, "utf-8");
      // Must not have link to /admin or /admin/login
      expect(content).not.toMatch(/href=["']\/admin["']/);
      expect(content).not.toMatch(/href=["']\/admin\/login["']/);
      expect(content).not.toMatch(/href=["']https:\/\/khanomcenter\.vercel\.app\/admin/);
    }
  });

  it("ensures WhatsApp inquiry button is completely removed from ProductViewer", () => {
    const viewerContent = readFileSync(
      join(PROJECT_ROOT, "src/components/site/ProductViewer.tsx"),
      "utf-8"
    );
    expect(viewerContent).not.toContain("https://wa.me");
    expect(viewerContent).not.toContain("طلب واستفسار عبر واتساب");
  });
});

describe("Requirement 2: Dynamic OG Images for Home and Categories", () => {
  it("ensures Cairo-Bold font is present locally and in public", () => {
    const assetFont = join(PROJECT_ROOT, "src/assets/fonts/Cairo-Bold.ttf");
    const publicFont = join(PROJECT_ROOT, "public/fonts/Cairo-Bold.ttf");
    expect(existsSync(assetFont)).toBe(true);
    expect(existsSync(publicFont)).toBe(true);
  });

  it("verifies home page OG configuration contains 'انقر هنا لمشاهدة جميع المنتجات'", () => {
    const homeContent = readFileSync(join(PROJECT_ROOT, "src/app/page.tsx"), "utf-8");
    expect(homeContent).toContain("انقر هنا لمشاهدة جميع المنتجات");
    expect(homeContent).toContain("/api/og?title=");
  });

  it("verifies category page OG configuration contains dynamic category title", () => {
    const catContent = readFileSync(join(PROJECT_ROOT, "src/app/c/[id]/page.tsx"), "utf-8");
    expect(catContent).toContain("انقر هنا لمشاهدة ${category.name}");
    expect(catContent).toContain("/api/og?title=");
  });

  it("verifies subcategory page OG configuration contains dynamic subcategory title when ?p= is absent", () => {
    const subcatContent = readFileSync(join(PROJECT_ROOT, "src/app/s/[id]/page.tsx"), "utf-8");
    expect(subcatContent).toContain("انقر هنا لمشاهدة ${category.name}");
    expect(subcatContent).toContain("/api/og?title=");
  });
});

describe("Requirement 3: Dynamic OG for Shared Single Product Link (?p=...)", () => {
  it("verifies that sharing a product (?p=...) uses the direct full-resolution image from R2", () => {
    const sampleProduct = {
      id: 1,
      image_key: "products/dress-123",
      price: 35000,
      description: "فستان سهرة أنيق",
    };

    const fullImageUrl = imageUrl(sampleProduct.image_key, "full");
    expect(fullImageUrl).toContain("pub-57b2de64f9154f7bbe89467ccbc4dedd.r2.dev");
    expect(fullImageUrl).toBe(
      "https://pub-57b2de64f9154f7bbe89467ccbc4dedd.r2.dev/products/dress-123/f"
    );
    expect(formatPrice(sampleProduct.price)).toBe("35,000 د.ع");

    const subcatContent = readFileSync(join(PROJECT_ROOT, "src/app/s/[id]/page.tsx"), "utf-8");
    // Verifies logic exists in s/[id]/page.tsx
    expect(subcatContent).toContain("imageUrl(product.image_key, \"full\")");
    expect(subcatContent).toContain("searchParams");
    expect(subcatContent).toContain("productParam");
  });
});
