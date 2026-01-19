// seed_public_food_catalog.js
// Wipe & re-seed Firestore collection from MM-Food-100K CSV.
//
// Run:
//   node seed_public_food_catalog.js
//   SEED_LIMIT=2000 node seed_public_food_catalog.js
//   SEED_COLLECTION=public_food_catalog node seed_public_food_catalog.js

const admin = require("firebase-admin");
const Papa = require("papaparse");

if (!global.fetch) {
  throw new Error("This script requires Node 18+ (global.fetch is missing).");
}

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const CSV_URL =
  "https://huggingface.co/datasets/Codatta/MM-Food-100K/resolve/main/MM-Food-100K.csv?download=true";

const COLLECTION = process.env.SEED_COLLECTION || "public_food_catalog";
const LIMIT = Math.max(1, Number(process.env.SEED_LIMIT || 1000));

function toNumber(n) {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
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

function inferCategory(name) {
  const s = String(name || "").toLowerCase();
  if (/(rice|fried rice|omelette rice|khao|krapao|pad kra pao|curry rice)/i.test(s))
    return "rice";
  if (/(noodle|ramen|udon|pho|vermicelli|spaghetti|pasta|carbonara|pad thai)/i.test(s))
    return "noodle";
  if (/(dessert|cake|ice cream|cookie|brownie|pudding|sweet)/i.test(s))
    return "dessert";
  if (/(drink|coffee|latte|tea|milk|juice|smoothie|cola|soda)/i.test(s))
    return "drink";
  if (/(salad)/i.test(s)) return "salad";
  if (/(soup|tom yum|broth)/i.test(s)) return "soup";
  return "other";
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
  console.log("Downloading CSV:", CSV_URL);
  const res = await fetch(CSV_URL);
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${res.statusText}`);

  const csvText = await res.text();
  console.log("CSV downloaded. Parsing...");

  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  if (parsed.errors?.length) {
    console.warn("Parse warnings:", parsed.errors.slice(0, 3));
  }

  const rows = parsed.data || [];
  console.log("Total rows:", rows.length);

  const col = db.collection(COLLECTION);

  // 1) Wipe old docs
  await wipeCollection(col);

  // 2) Pick items
  const items = [];
  for (const r of rows) {
    if (items.length >= LIMIT) break;

    const name = (r.dish_name || r.name || "").trim();
    const imageUrl = (r.image_url || r.imageUrl || "").trim();
    if (!name || !imageUrl) continue;

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

  console.log("Picked items:", items.length, `(limit=${LIMIT})`);
  if (items.length < 50) {
    console.log(
      "⚠️ Picked unusually few items. CSV schema may not match or nutrition JSON parse failed."
    );
  }

  // 3) Write in batches (<= 450 per commit)
  let batch = db.batch();
  let countInBatch = 0;
  let total = 0;

  for (const item of items) {
    const ref = col.doc(); // new docs (fresh re-seed)
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
