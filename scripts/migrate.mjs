import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@libsql/client";

// Read .env.local
const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || "";
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[key] = value.trim();
    }
  }
}

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error("TURSO_DATABASE_URL is missing!");
  process.exit(1);
}

const db = createClient({ url, authToken });

async function runMigration() {
  console.log("Applying schema to Turso...");
  const schemaPath = resolve(process.cwd(), "src/lib/schema.sql");
  const schemaSql = readFileSync(schemaPath, "utf8");

  // Execute statements individually
  const statements = schemaSql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    await db.execute(statement);
  }
  console.log("Schema applied successfully.");

  // Check if categories already exist
  const catCheck = await db.execute("SELECT COUNT(*) as count FROM categories");
  const catCount = Number(catCheck.rows[0].count);

  if (catCount === 0) {
    console.log("Seeding initial categories...");
    // 1. Main categories
    const r1 = await db.execute({
      sql: "INSERT INTO categories (name, parent_id, sort_order) VALUES (?, NULL, ?) RETURNING id",
      args: ["ملابس نسائية", 1],
    });
    const womenId = Number(r1.rows[0].id);

    const r2 = await db.execute({
      sql: "INSERT INTO categories (name, parent_id, sort_order) VALUES (?, NULL, ?) RETURNING id",
      args: ["ملابس أطفال", 2],
    });
    const kidsId = Number(r2.rows[0].id);

    const r3 = await db.execute({
      sql: "INSERT INTO categories (name, parent_id, sort_order) VALUES (?, NULL, ?) RETURNING id",
      args: ["كوزمتكس ومكياج", 3],
    });
    const cosmeticId = Number(r3.rows[0].id);

    // 2. Subcategories
    const subs = [
      { name: "فساتين وسهرة", parentId: womenId, order: 1 },
      { name: "بناطيل وتنانير", parentId: womenId, order: 2 },
      { name: "بلوزات وقمصان", parentId: womenId, order: 3 },
      { name: "شالات وإكسسوارات", parentId: womenId, order: 4 },

      { name: "بناتي", parentId: kidsId, order: 1 },
      { name: "ولادي", parentId: kidsId, order: 2 },
      { name: "بيبي وحديثي الولادة", parentId: kidsId, order: 3 },

      { name: "عناية بالبشرة", parentId: cosmeticId, order: 1 },
      { name: "مكياج ومستحضرات تجميل", parentId: cosmeticId, order: 2 },
      { name: "عطورات ومعطرات", parentId: cosmeticId, order: 3 },
    ];

    for (const sub of subs) {
      await db.execute({
        sql: "INSERT INTO categories (name, parent_id, sort_order) VALUES (?, ?, ?)",
        args: [sub.name, sub.parentId, sub.order],
      });
    }
    console.log("Seeded default main categories and subcategories.");
  } else {
    console.log(`Categories table already has ${catCount} entries.`);
  }

  // Check if sizes already exist
  const sizeCheck = await db.execute("SELECT COUNT(*) as count FROM sizes");
  const sizeCount = Number(sizeCheck.rows[0].count);

  if (sizeCount === 0) {
    console.log("Seeding initial sizes...");
    const defaultSizes = [
      "قياس موحد (Free Size)",
      "S",
      "M",
      "L",
      "XL",
      "XXL",
      "XXXL",
      "0 - 6 أشهر",
      "6 - 12 شهر",
      "سنة - سنتين",
      "3 - 4 سنوات",
      "5 - 6 سنوات",
      "7 - 8 سنوات",
      "9 - 10 سنوات",
      "11 - 12 سنة",
    ];

    for (let i = 0; i < defaultSizes.length; i++) {
      await db.execute({
        sql: "INSERT INTO sizes (name, sort_order) VALUES (?, ?)",
        args: [defaultSizes[i], i + 1],
      });
    }
    console.log("Seeded standard sizes.");
  } else {
    console.log(`Sizes table already has ${sizeCount} entries.`);
  }

  console.log("Migration complete!");
}

runMigration().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
