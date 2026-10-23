import { describe, it, expect } from "vitest";
import { formatPrice } from "../format";
import { imageUrl, newImageKey, isValidImageKey } from "../images";
import { checkCredentials, createSessionToken, verifySessionToken } from "../auth";
import { loginSchema, categorySchema, sizeSchema, productSchema } from "../validation";

describe("formatPrice", () => {
  it("formats integer prices in Iraqi Dinars with commas", () => {
    expect(formatPrice(25000)).toBe("25,000 د.ع");
    expect(formatPrice(5000)).toBe("5,000 د.ع");
    expect(formatPrice(0)).toBe("0 د.ع");
  });

  it("handles negative or falsy numbers gracefully", () => {
    expect(formatPrice(-100)).toBe("0 د.ع");
    expect(formatPrice(NaN)).toBe("0 د.ع");
  });
});

describe("images", () => {
  const base = "https://pub-57b2de64f9154f7bbe89467ccbc4dedd.r2.dev";

  it("generates correct public image URLs for thumb and full variants", () => {
    const key = "products/item-123";
    expect(imageUrl(key, "thumb", base)).toBe(`${base}/products/item-123/t`);
    expect(imageUrl(key, "full", base)).toBe(`${base}/products/item-123/f`);
  });

  it("validates safe image keys", () => {
    expect(isValidImageKey("products/abc-123")).toBe(true);
    expect(isValidImageKey("categories/cat-1")).toBe(true);
    expect(isValidImageKey("../escape")).toBe(false);
    expect(isValidImageKey("/absolute")).toBe(false);
    expect(isValidImageKey("")).toBe(false);
  });

  it("generates new unique image keys", () => {
    const k1 = newImageKey("products");
    const k2 = newImageKey("products");
    expect(k1.startsWith("products/")).toBe(true);
    expect(k1).not.toBe(k2);
  });
});

describe("auth", () => {
  it("checks credentials against provided admin config", () => {
    expect(checkCredentials("ALBEJAWE", "10468416", "ALBEJAWE", "10468416")).toBe(true);
    expect(checkCredentials("albejawe", "10468416", "ALBEJAWE", "10468416")).toBe(true); // case-insensitive username
    expect(checkCredentials("admin", "wrong", "ALBEJAWE", "10468416")).toBe(false);
  });

  it("creates and verifies signed JWT session tokens", async () => {
    const secret = "test-secret-key-that-is-at-least-32-chars-long";
    const token = await createSessionToken({ username: "ALBEJAWE" }, secret);
    expect(typeof token).toBe("string");

    const payload = await verifySessionToken(token, secret);
    expect(payload?.username).toBe("ALBEJAWE");

    const invalid = await verifySessionToken("tampered.token.here", secret);
    expect(invalid).toBeNull();
  });
});

describe("validation", () => {
  it("validates login schema", () => {
    expect(loginSchema.safeParse({ username: "ALBEJAWE", password: "10468416" }).success).toBe(true);
    expect(loginSchema.safeParse({ username: "", password: "" }).success).toBe(false);
  });

  it("validates category schema", () => {
    expect(categorySchema.safeParse({ name: "ملابس نسائية", parentId: null, sortOrder: 0 }).success).toBe(true);
    expect(categorySchema.safeParse({ name: "", parentId: null }).success).toBe(false);
  });

  it("validates size schema", () => {
    expect(sizeSchema.safeParse({ name: "XL", sortOrder: 1 }).success).toBe(true);
    expect(sizeSchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("validates product schema", () => {
    expect(productSchema.safeParse({
      categoryId: 1,
      price: 15000,
      description: "فستان صيفي",
      imageKey: "products/123",
      sizeIds: [1, 2],
    }).success).toBe(true);

    expect(productSchema.safeParse({
      categoryId: 0,
      price: -10,
      imageKey: "",
      sizeIds: [],
    }).success).toBe(false);
  });
});
