// seed/seed_exercise_catalog.js
const admin = require("firebase-admin");

// Node 18+ มี fetch ในตัว แต่กันไว้:
const fetchFn =
  global.fetch ||
  ((...args) => import("node-fetch").then(({ default: f }) => f(...args)));

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// --------------------------
// Source dataset: free-exercise-db
// --------------------------
const EXERCISES_JSON_URL =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";

const IMAGE_PREFIX =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

// Firestore collections
const META_DOC = db.collection("exercise_catalog_meta").doc("main");
const COL = db.collection("exercise_catalog");

// ปรับจำนวนท่าที่จะ seed ได้ (0 = ทั้งหมด)
const LIMIT = 0;

// --------------------------
// Helpers
// --------------------------
function nowISO() {
  return new Date().toISOString();
}

function slugId(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function toStr(x) {
  return String(x || "").trim();
}

// --------------------------
// ✅ Mapping ตามที่คุณกำหนด
// 1) Sit-up / Push-up / Plank → resistance_training
// 2) Barbell/gym equipment → lifting
// 3) Jumping jacks / High knees / Burpees → aerobic_exercise
// 4) Stretch/Yoga → flexibility_exercise, Balance → balance_exercise
// --------------------------
function mapActivityKey(ex) {
  const category = toStr(ex.category).toLowerCase();
  const equipment = toStr(ex.equipment).toLowerCase();
  const name = toStr(ex.name).toLowerCase();

  // 4) Stretch / Yoga -> flexibility
  if (
    category.includes("stretch") ||
    name.includes("stretch") ||
    name.includes("mobility") ||
    name.includes("yoga") ||
    name.includes("downward dog") ||
    name.includes("cobra") ||
    name.includes("child pose")
  ) {
    return "flexibility_exercise";
  }

  // 4) Balance -> balance_exercise
  if (
    name.includes("balance") ||
    name.includes("single-leg") ||
    name.includes("single leg") ||
    name.includes("stability") ||
    name.includes("tree pose")
  ) {
    return "balance_exercise";
  }

  // 3) Cardio bodyweight -> aerobic_exercise
  if (
    category.includes("cardio") ||
    name.includes("jumping jack") ||
    name.includes("high knee") ||
    name.includes("burpee") ||
    name.includes("mountain climber") ||
    name.includes("jump rope") ||
    name.includes("skipping")
  ) {
    return "aerobic_exercise";
  }

  // 2) Gym equipment -> lifting
  const gymEquip = [
    "barbell",
    "cable",
    "machine",
    "leverage machine",
    "smith",
    "trap bar",
    "olympic barbell",
  ];
  const isGym = gymEquip.some((k) => equipment.includes(k));
  if (isGym) return "lifting";

  // 1) Default -> resistance_training (body only / dumbbell / kettlebell etc.)
  return "resistance_training";
}

function shortDesc(ex) {
  const primary = Array.isArray(ex.primaryMuscles)
    ? ex.primaryMuscles.slice(0, 2).join(", ")
    : "";
  const equip = ex.equipment ? String(ex.equipment) : "body";
  const level = ex.level ? String(ex.level) : "all levels";
  const parts = [];
  if (primary) parts.push(`Primary: ${primary}`);
  parts.push(`Equipment: ${equip}`);
  parts.push(`Level: ${level}`);
  return parts.join(" • ");
}

function buildImageUrls(ex) {
  const arr = Array.isArray(ex.images) ? ex.images : [];
  return arr
    .map((p) => String(p || "").trim())
    .filter(Boolean)
    .map((p) => IMAGE_PREFIX + p);
}

async function bumpVersion() {
  const snap = await META_DOC.get();
  const cur = snap.exists ? Number(snap.data().version || 0) : 0;
  const next = cur + 1;

  await META_DOC.set(
    {
      version: next,
      updatedAt: nowISO(),
      source: "free-exercise-db + manual-activities",
    },
    { merge: true }
  );

  return next;
}

// --------------------------
// ✅ Manual cover images (user-provided URLs)
// --------------------------
const MANUAL_COVER = {
  jogging:
    "https://www.verywellfit.com/thmb/amqB1zlXSYMGBn3eED6exNuAtBY=/750x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/difference-between-running-and-jogging-2911122-0993-7194b2f8742b43c288ee111f0f7c8033.jpg",
  treadmill_run: "https://mrtreadmill.com.au/wp-content/uploads/shutterstock_1495412588-1.jpg",
  stair_climbing:
    "https://static.wixstatic.com/media/490a53_d84027f2a1904696b52c4c2387344293~mv2_d_2124_1413_s_2.jpg/v1/fill/w_568,h_378,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/490a53_d84027f2a1904696b52c4c2387344293~mv2_d_2124_1413_s_2.jpg",
  rowing_machine:
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ4GgRvvsBRk2EYzKMbZwl2DdaPwE8evcPR9g&s",
  swim_freestyle:
    "https://i0.wp.com/blog.myswimpro.com/wp-content/uploads/2024/08/What-is-EVF.jpg?fit=1920%2C1080&ssl=1",
  swim_breaststroke:
    "https://images.ctfassets.net/3s5io6mnxfqz/29msXBcLL7Olfy2SBMMzf9/67ecf6076b858af2abb66983dd6f6f71/AdobeStock_55804132_2.jpeg?w=1920",
  swim_backstroke:
    "https://blog.myswimpro.com/wp-content/uploads/2021/06/taylor-backstroke-garmin-myswimpro.jpg",
  cycling_outdoor:
    "https://media.istockphoto.com/id/614649450/photo/woman-cycling-outdoor-exercise-bike-paths.jpg?s=1024x1024&w=is&k=20&c=CiQ0zsnqMd49WitBq2SUZq1m3RBntPShr4X7ZNuWrsY=",
  cycling_indoor:
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRHXT8o-ZbdIfa0jUqr8NfL3Kw-qAPocOFuaw&s",
};

function coverOf(id, fallback) {
  return MANUAL_COVER[id] || fallback;
}

// --------------------------
// ✅ Manual activities for aerobic/swimming/cycling
// เพื่อให้ 3 หมวดนี้มีรายการเหมือนหมวดอื่น
// --------------------------
async function upsertManualActivities(version) {
  const manual = [
    // ---- aerobic (popular cardio) ----
    {
      id: "jogging",
      name: "Jogging",
      desc: "Steady cardio • Outdoor run",
      mappedActivityKey: "aerobic",
      images: [coverOf("jogging", "")],
      primaryMuscles: [],
      secondaryMuscles: [],
      instructions: [
        "Start with a 5-minute warm-up walk.",
        "Run at a steady conversational pace.",
        "Cool down 3–5 minutes.",
      ],
      equipment: "none",
      category: "cardio",
      level: "beginner",
      force: "",
      mechanic: "",
    },
    {
      id: "treadmill_run",
      name: "Treadmill run",
      desc: "Indoor running • Control pace",
      mappedActivityKey: "aerobic",
      images: [coverOf("treadmill_run", "")],
      instructions: [
        "Start at a comfortable walking speed.",
        "Increase speed gradually.",
        "Maintain upright posture and relaxed shoulders.",
      ],
      equipment: "treadmill",
      category: "cardio",
      level: "beginner",
      force: "",
      mechanic: "",
    },
    {
      id: "stair_climbing",
      name: "Stair climbing",
      desc: "Legs + cardio • High burn",
      mappedActivityKey: "aerobic",
      images: [coverOf("stair_climbing", "")],
      instructions: [
        "Step up with full foot contact.",
        "Keep a steady rhythm.",
        "Use the handrail if you need stability.",
      ],
      equipment: "stairs",
      category: "cardio",
      level: "beginner",
      force: "",
      mechanic: "",
    },
    {
      id: "rowing_machine",
      name: "Rowing machine",
      desc: "Full body cardio • Low impact",
      mappedActivityKey: "aerobic",
      images: [coverOf("rowing_machine", "")],
      instructions: [
        "Drive with legs first, then pull with arms.",
        "Keep your back neutral (no rounding).",
        "Return smoothly to the start position.",
      ],
      equipment: "rowing machine",
      category: "cardio",
      level: "beginner",
      force: "",
      mechanic: "",
    },

    // ---- swimming ----
    {
      id: "swim_freestyle",
      name: "Freestyle swimming",
      desc: "Front crawl • Low impact cardio",
      mappedActivityKey: "swimming",
      images: [coverOf("swim_freestyle", "")],
      instructions: [
        "Keep body streamlined and hips up.",
        "Rotate hips/shoulders to reduce drag.",
        "Breathe every 2–3 strokes as comfortable.",
      ],
      equipment: "pool",
      category: "swimming",
      level: "beginner",
      force: "",
      mechanic: "",
      primaryMuscles: [],
      secondaryMuscles: [],
    },
    {
      id: "swim_breaststroke",
      name: "Breaststroke",
      desc: "Controlled pace • Technique focused",
      mappedActivityKey: "swimming",
      images: [coverOf("swim_breaststroke", "")],
      instructions: [
        "Glide briefly after each kick and pull.",
        "Kick then pull in a smooth rhythm.",
        "Keep neck relaxed; lift head minimally.",
      ],
      equipment: "pool",
      category: "swimming",
      level: "beginner",
      force: "",
      mechanic: "",
      primaryMuscles: [],
      secondaryMuscles: [],
    },
    {
      id: "swim_backstroke",
      name: "Backstroke",
      desc: "Back friendly • Endurance",
      mappedActivityKey: "swimming",
      images: [coverOf("swim_backstroke", "")],
      instructions: [
        "Keep hips up and core engaged.",
        "Alternate arm circles with steady flutter kick.",
        "Look upward; keep head still.",
      ],
      equipment: "pool",
      category: "swimming",
      level: "beginner",
      force: "",
      mechanic: "",
      primaryMuscles: [],
      secondaryMuscles: [],
    },

    // ---- cycling ----
    {
      id: "cycling_outdoor",
      name: "Outdoor cycling",
      desc: "Road/park ride • Cardio endurance",
      mappedActivityKey: "cycling",
      images: [coverOf("cycling_outdoor", "")],
      instructions: [
        "Adjust saddle height for comfortable knee angle.",
        "Maintain steady cadence.",
        "Stay hydrated and watch traffic.",
      ],
      equipment: "bicycle",
      category: "cycling",
      level: "beginner",
      force: "",
      mechanic: "",
      primaryMuscles: [],
      secondaryMuscles: [],
    },
    {
      id: "cycling_indoor",
      name: "Indoor bike",
      desc: "Stationary cycling • Controlled intensity",
      mappedActivityKey: "cycling",
      images: [coverOf("cycling_indoor", "")],
      instructions: [
        "Set resistance low to start.",
        "Maintain steady cadence and posture.",
        "Cool down 3–5 minutes at the end.",
      ],
      equipment: "stationary bike",
      category: "cycling",
      level: "beginner",
      force: "",
      mechanic: "",
      primaryMuscles: [],
      secondaryMuscles: [],
    },
  ];

  let batch = db.batch();
  let count = 0;

  for (const item of manual) {
    const ref = COL.doc(item.id);

    batch.set(
      ref,
      {
        ...item,
        sourceId: item.id,
        catalogVersion: version,
        updatedAt: nowISO(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true } // ✅ ทับของเก่า
    );

    count++;
    if (count % 450 === 0) {
      await batch.commit();
      batch = db.batch();
      console.log("Committed manual batch:", count);
    }
  }

  await batch.commit();
  console.log("✅ Manual activities upserted:", manual.length);
}

// --------------------------
// Main
// --------------------------
async function main() {
  console.log("Downloading JSON:", EXERCISES_JSON_URL);
  const res = await fetchFn(EXERCISES_JSON_URL);
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${res.statusText}`);

  const rows = await res.json();
  if (!Array.isArray(rows)) throw new Error("Dataset is not an array");

  console.log("Total rows:", rows.length);

  // ✅ bump version ทุกครั้งเพื่อบังคับให้แอพ sync
  const version = await bumpVersion();
  console.log("Catalog version:", version);

  let total = 0;
  let batch = db.batch();
  let countInBatch = 0;

  for (const ex of rows) {
    if (LIMIT && total >= LIMIT) break;

    const docId = slugId(ex.id || ex.name);
    if (!docId) continue;

    const mappedActivityKey = mapActivityKey(ex);
    const images = buildImageUrls(ex);

    const docData = {
      id: docId,
      sourceId: ex.id || null,
      name: ex.name || "",
      desc: shortDesc(ex),
      instructions: Array.isArray(ex.instructions) ? ex.instructions : [],
      primaryMuscles: Array.isArray(ex.primaryMuscles) ? ex.primaryMuscles : [],
      secondaryMuscles: Array.isArray(ex.secondaryMuscles) ? ex.secondaryMuscles : [],
      equipment: ex.equipment || "",
      category: ex.category || "",
      force: ex.force || "",
      level: ex.level || "",
      mechanic: ex.mechanic || "",
      images,
      mappedActivityKey, // ✅ ตรงกับ ActivityKey ในแอพ
      catalogVersion: version,
      updatedAt: nowISO(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const ref = COL.doc(docId);
    batch.set(ref, docData, { merge: true }); // ✅ ทับของเก่า

    countInBatch++;
    total++;

    if (countInBatch >= 450) {
      await batch.commit();
      console.log("Committed exercise batch. Total:", total);
      batch = db.batch();
      countInBatch = 0;
    }
  }

  if (countInBatch > 0) {
    await batch.commit();
    console.log("Committed final exercise batch. Total:", total);
  }

  // ✅ เติมกิจกรรม Aerobic/Swimming/Cycling ให้หมวดไม่ว่าง
  await upsertManualActivities(version);

  console.log("✅ Seeding done!");
}

main().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});
