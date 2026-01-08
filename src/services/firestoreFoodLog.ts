import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { getDateKey } from "../utils/dateKey";
import type { FoodRefType } from "../types/food";

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export async function addFoodToTodayLog(params: {
  uid: string;
  foodRefType: FoodRefType;
  foodId: string;

  name: string;
  calories_per_serving: number;
  carbs_g: number;
  protein_g: number;
  fat_g: number;

  servings: number;
}) {
  const dateKey = getDateKey();

  const totalCalories = Math.round(params.calories_per_serving * params.servings);
  const totalCarbs = round1(params.carbs_g * params.servings);
  const totalProtein = round1(params.protein_g * params.servings);
  const totalFat = round1(params.fat_g * params.servings);

  await addDoc(collection(db, "users", params.uid, "dailyLogs", dateKey, "foods"), {
    foodRefType: params.foodRefType,
    foodId: params.foodId,

    // ✅ snapshot fields
    name_snapshot: params.name,
    calories_snapshot: params.calories_per_serving,
    carbs_g_snapshot: params.carbs_g,
    protein_g_snapshot: params.protein_g,
    fat_g_snapshot: params.fat_g,

    servings: params.servings,

    totals: {
      totalCalories,
      totalCarbs,
      totalProtein,
      totalFat,
    },

    createdAt: serverTimestamp(),
  });
}
