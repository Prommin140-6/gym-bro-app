import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { db } from "./firebase";
import type { FoodBase, FoodCategory } from "../types/food";

const ALLOWED: FoodCategory[] = [
  "rice",
  "noodle",
  "salad",
  "soup",
  "dessert",
  "drink",
  "snack",
  "other",
];

function asCategory(v: any): FoodCategory {
  const s = String(v ?? "").toLowerCase();
  return ALLOWED.includes(s as FoodCategory) ? (s as FoodCategory) : "other";
}

export async function fetchPublicCatalog(limitCount = 100): Promise<FoodBase[]> {
  const q = query(
    collection(db, "public_food_catalog"),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );

  const snap = await getDocs(q);

  return snap.docs.map((d) => {
    const data = d.data() as any;
    return {
      id: d.id,
      refType: "public",
      name: String(data.name ?? ""),
      calories_per_serving: Number(data.calories_per_serving ?? 0),
      carbs_g: Number(data.carbs_g ?? 0),
      protein_g: Number(data.protein_g ?? 0),
      fat_g: Number(data.fat_g ?? 0),
      imageUrl: data.imageUrl ?? null,
      category: asCategory(data.category),
    };
  });
}
