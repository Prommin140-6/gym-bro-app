export type FoodRefType = "public" | "custom";

export type FoodCategory =
  | "rice"
  | "noodle"
  | "salad"
  | "soup"
  | "dessert"
  | "drink"
  | "snack"
  | "other";

export type FoodBase = {
  id: string;
  refType: FoodRefType;
  name: string;
  calories_per_serving: number;
  carbs_g: number;
  protein_g: number;
  fat_g: number;
  imageUrl?: string | null;
  category?: FoodCategory;
};
