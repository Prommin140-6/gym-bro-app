import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import type { FoodBase, FoodCategory } from "../types/food";

export function subscribeCustomFoods(uid: string, cb: (foods: FoodBase[]) => void) {
  const q = query(collection(db, "users", uid, "custom_foods"), orderBy("createdAt", "desc"));

  return onSnapshot(q, (snap) => {
    const foods: FoodBase[] = snap.docs.map((d) => {
      const data = d.data() as any;
      return {
        id: d.id,
        refType: "custom",
        name: String(data.name ?? ""),
        calories_per_serving: Number(data.calories_per_serving ?? 0),
        carbs_g: Number(data.carbs_g ?? 0),
        protein_g: Number(data.protein_g ?? 0),
        fat_g: Number(data.fat_g ?? 0),
        imageUrl: data.imageUrl ?? null,

        // ✅ new
        category: (data.category as FoodCategory) ?? "Other",
      };
    });
    cb(foods);
  });
}

export async function addCustomFood(
  uid: string,
  food: {
    name: string;
    calories_per_serving: number;
    carbs_g: number;
    protein_g: number;
    fat_g: number;
    imageUrl?: string | null;

    // ✅ new
    category?: FoodCategory;
  }
) {
  await addDoc(collection(db, "users", uid, "custom_foods"), {
    ...food,
    category: food.category ?? "Other",
    createdAt: serverTimestamp(),
  });
}
