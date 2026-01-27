const admin = require("firebase-admin");
const Papa = require("papaparse");
const fs = require("fs");
const path = require("path");

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const COLLECTION = (process.env.SEED_COLLECTION || "public_food_catalog_v2").trim();
const LIMIT = Math.max(1, Number(process.env.SEED_LIMIT || 1000));
const CSV_PATH = (process.env.CSV_PATH || "./menus.csv").trim();

// --- helpers ---
function toNumber(n) {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

/**
 * Your menus.csv header has many trailing empty columns (",,,,,").
 * We trim trailing commas ONLY on the header line, so Papa won't create "" keys.
 * Data rows may still have extra fields; Papa will put them into __parsed_extra (fine).
 */
function sanitizeCsvText(csvText) {
  const lines = csvText.split(/\r?\n/);
  if (!lines.length) return csvText;

  // Remove BOM + trim trailing commas on header line
  let header = lines[0].replace(/^\uFEFF/, "");
  header = header.replace(/,+\s*$/, ""); // remove trailing commas
  lines[0] = header;

  return lines.join("\n");
}

function normalizeName(row) {
  return String(row.dish_name || row.name || "").trim();
}

function normalizeImageUrl(row) {
  return String(row.image_url || row.imageUrl || "").trim();
}

function normalizeFoodType(row) {
  return String(row.food_type || row.type || row.category || "").trim();
}

function pickNutrition(row) {
  const raw = row.nutritional_profile || row.nutrition || row.nutrients;
  if (!raw) return null;

  try {
    const obj = typeof raw === "string" ? JSON.parse(raw) : raw;

    const calories = toNumber(obj.calories_kcal ?? obj.calories ?? obj.kcal);
    const protein = toNumber(obj.protein_g ?? obj.protein);
    const fat = toNumber(obj.fat_g ?? obj.fat);
    const carbs = toNumber(
      obj.carbohydrate_g ?? obj.carbs_g ?? obj.carbohydrate ?? obj.carbs
    );

    if (calories <= 0) return null;
    return { calories, protein, fat, carbs };
  } catch {
    return null;
  }
}

function inferCategoryFromFoodType(foodType) {
  const ft = String(foodType || "").toLowerCase();

  // Fruits
  if (ft.includes("fruit") || ft.includes("ผลไม้")) return "fruits";

  // Buckets that match your UI
  if (ft.includes("rice")) return "rice";
  if (ft.includes("noodle")) return "noodle";
  if (ft.includes("dessert") || ft.includes("sweet")) return "dessert";
  if (ft.includes("drink") || ft.includes("beverage")) return "drink";
  if (ft.includes("salad")) return "salad";
  if (ft.includes("soup") || ft.includes("boiled") || ft.includes("curry")) return "soup";

  return "";
}

function inferCategoryFromName(name) {
  const s = String(name || "").toLowerCase();

  // Fruits (fallback)
  if (
    /(ส้ม|แอปเปิ้ล|แก้วมังกร|องุ่น|สตรอเบอรี่|สตอเบอรี่|ฝรั่ง|สับปะรด|แตงโม|มะม่วง|กล้วย|มะละกอ|ลำไย|ลิ้นจี่|ทุเรียน|เงาะ|มังคุด|ผลไม้)/i.test(
      name || ""
    )
  ) return "fruits";

  if (/(rice|khao|ข้าว|กะเพรา|ผัดกะเพรา)/i.test(s)) return "rice";
  if (/(noodle|pad thai|ก๋วยเตี๋ยว|เส้น|บะหมี่|ราเมน|อุด้ง|สปาเกตตี้|พาสต้า)/i.test(s))
    return "noodle";
  if (/(dessert|cake|ice cream|cookie|brownie|pudding|sweet|ขนม|เค้ก|ไอศกรีม)/i.test(s))
    return "dessert";
  if (/(drink|coffee|latte|tea|milk|juice|smoothie|น้ำ|กาแฟ|ชา|นม|น้ำผลไม้|สมูทตี้)/i.test(s))
    return "drink";
  if (/(salad|สลัด)/i.test(s)) return "salad";
  if (/(soup|tom yum|broth|แกง|ต้ม|ซุป)/i.test(s)) return "soup";

  return "other";
}

function inferCategory(row, name) {
  const ft = normalizeFoodType(row);
  const byType = inferCategoryFromFoodType(ft);
  if (byType) return byType;
  return inferCategoryFromName(name);
}

async function wipeCollection(colRef) {
  console.log(`\n🧹 Wiping collection: ${colRef.path}`);
  let deletedTotal = 0;

  while (true) {
    const snap = await colRef.limit(450).get();
    if (snap.empty) break;

    const batch = db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();

    deletedTotal += snap.size;
    console.log(`Deleted: ${deletedTotal}`);
  }

  console.log(`✅ Wipe done. Deleted total: ${deletedTotal}\n`);
}

async function main() {
  const resolvedPath = path.resolve(CSV_PATH);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`CSV file not found: ${resolvedPath}`);
  }

  console.log("Reading CSV from file:", resolvedPath);
  let csvText = fs.readFileSync(resolvedPath, "utf8");
  csvText = sanitizeCsvText(csvText);

  console.log("Parsing CSV...");
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    // multiline is enabled automatically when quotes contain newlines
  });

  if (parsed.errors?.length) {
    console.warn("Parse warnings (first 5):", parsed.errors.slice(0, 5));
  }

  const rows = parsed.data || [];
  console.log("Total rows parsed:", rows.length);

  const col = db.collection(COLLECTION);

  // 1) Wipe old docs
  await wipeCollection(col);

  // 2) Build items
  const items = [];
  let skippedNoName = 0;
  let skippedNoImage = 0;
  let skippedNoNutrition = 0;

  for (const r of rows) {
    if (items.length >= LIMIT) break;

    const name = normalizeName(r);
    const imageUrl = normalizeImageUrl(r);

    if (!name) {
      skippedNoName++;
      continue;
    }
    if (!imageUrl) {
      skippedNoImage++;
      continue;
    }

    const n = pickNutrition(r);
    if (!n) {
      skippedNoNutrition++;
      continue;
    }

    items.push({
      name,
      calories_per_serving: Math.round(n.calories),
      carbs_g: Math.round(n.carbs * 10) / 10,
      protein_g: Math.round(n.protein * 10) / 10,
      fat_g: Math.round(n.fat * 10) / 10,
      imageUrl,
      category: inferCategory(r, name),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  console.log("Picked items:", items.length, `(limit=${LIMIT})`);
  console.log("Skipped (no name):", skippedNoName);
  console.log("Skipped (no image):", skippedNoImage);
  console.log("Skipped (no nutrition):", skippedNoNutrition);

  // 3) Write in batches (<= 450 per commit)
  let batch = db.batch();
  let countInBatch = 0;
  let total = 0;

  for (const item of items) {
    const ref = col.doc();
    batch.set(ref, item);
    countInBatch++;
    total++;

    if (countInBatch >= 450) {
      await batch.commit();
      console.log("Committed batch. Total:", total);
      batch = db.batch();
      countInBatch = 0;
    }
  }

  if (countInBatch > 0) {
    await batch.commit();
    console.log("Committed final batch. Total:", total);
  }

  console.log("✅ Seeding done!");
  console.log("Collection:", COLLECTION);
}

main().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});
