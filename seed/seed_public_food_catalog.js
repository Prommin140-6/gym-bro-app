// seed_public_food_catalog.js
const admin = require("firebase-admin");
const Papa = require("papaparse");

// Node 18+ มี fetch ในตัว แต่กันไว้:
const fetchFn = global.fetch || ((...args) => import("node-fetch").then(({ default: f }) => f(...args)));

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// ✅ ลิงก์ CSV ของ MM-Food-100K (จาก HuggingFace dataset)
const CSV_URL = "https://huggingface.co/datasets/Codatta/MM-Food-100K/resolve/main/MM-Food-100K.csv?download=true";

function toNumber(n) {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

function pickNutrition(row) {
  // dataset มีคอลัมน์ nutritional_profile (มักเป็น JSON string)
  // บางแถวอาจชื่อคีย์ต่างกันนิดหน่อย → พยายาม parse ให้ได้
  const raw = row.nutritional_profile || row.nutrition || row.nutrients;
  if (!raw) return null;

  try {
    const obj = typeof raw === "string" ? JSON.parse(raw) : raw;
    const calories = toNumber(obj.calories_kcal ?? obj.calories ?? obj.kcal);
    const protein = toNumber(obj.protein_g ?? obj.protein);
    const fat = toNumber(obj.fat_g ?? obj.fat);
    const carbs = toNumber(obj.carbohydrate_g ?? obj.carbs_g ?? obj.carbohydrate ?? obj.carbs);
    if (calories <= 0) return null;
    return { calories, protein, fat, carbs };
  } catch {
    return null;
  }
}

function inferCategory(name) {
  const s = String(name || "").toLowerCase();

  // rice
  if (/(rice|fried rice|omelette rice|khao|krapao|pad kra pao|curry rice)/i.test(s)) return "rice";

  // noodle / pasta
  if (/(noodle|ramen|udon|pho|vermicelli|spaghetti|pasta|carbonara|pad thai)/i.test(s)) return "noodle";

  // dessert
  if (/(dessert|cake|ice cream|cookie|brownie|pudding|sweet)/i.test(s)) return "dessert";

  // drink
  if (/(drink|coffee|latte|tea|milk|juice|smoothie|cola|soda)/i.test(s)) return "drink";

  // salad
  if (/(salad)/i.test(s)) return "salad";

  // soup
  if (/(soup|tom yum|broth)/i.test(s)) return "soup";

  return "other";
}

async function main() {
  console.log("Downloading CSV:", CSV_URL);
  const res = await fetchFn(CSV_URL);
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${res.statusText}`);

  const csvText = await res.text();
  console.log("CSV downloaded. Parsing...");

  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  if (parsed.errors?.length) {
    console.warn("Parse warnings:", parsed.errors.slice(0, 3));
  }

  const rows = parsed.data || [];
  console.log("Total rows:", rows.length);

  // ✅ เลือก 100 รายการแรกที่:
  // - มีชื่ออาหาร
  // - มี image_url
  // - มี nutrition parse ได้ และมี calories > 0
  const items = [];
  for (const r of rows) {
    if (items.length >= 100) break;

    const name = (r.dish_name || r.name || "").trim();
    const imageUrl = (r.image_url || r.imageUrl || "").trim();

    if (!name) continue;
    if (!imageUrl) continue;

    const n = pickNutrition(r);
    if (!n) continue;

    items.push({
      name,
      calories_per_serving: Math.round(n.calories),
      carbs_g: Math.round(n.carbs * 10) / 10,
      protein_g: Math.round(n.protein * 10) / 10,
      fat_g: Math.round(n.fat * 10) / 10,
      imageUrl,
      category: inferCategory(name),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  console.log("Picked items:", items.length);
  if (items.length < 50) {
    console.log("⚠️ ได้รายการน้อยผิดปกติ อาจเพราะ schema ใน CSV ไม่ตรงหรือ JSON parse ไม่ได้");
  }

  // ✅ เขียนเข้า Firestore แบบ batch (500 ต่อ batch)
  const col = db.collection("public_food_catalog");
  let batch = db.batch();
  let countInBatch = 0;
  let total = 0;

  for (const item of items) {
    const ref = col.doc(); // auto id
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
}

main().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});
