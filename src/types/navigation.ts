// src/types/navigation.ts
import type { NavigatorScreenParams } from "@react-navigation/native";

// ---------- Auth Stack ----------
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
};

// ---------- Dashboard Stack ----------
export type DashboardStackParamList = {
  Dashboard: undefined;
  NutritionGoals: undefined;
  EditGoal: {
    key: "calorieTarget" | "carbTarget" | "proteinTarget" | "fatTarget";
    title: string;
    currentValue: number;
  };
};

// ---------- Food Stack ----------
export type FoodStackParamList = {
  FoodList: undefined;
  FoodDetail: { food: any };
  AddFood: undefined;
};

// ---------- Main Tabs ----------
export type MainTabParamList = {
  DashboardTab: NavigatorScreenParams<DashboardStackParamList>;
  FoodTab: NavigatorScreenParams<FoodStackParamList>;
  ActivityTab: undefined;
  StepsTab: undefined;
  ProfileTab: undefined;
};

// ---------- Root Stack ----------
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  MainTabs: NavigatorScreenParams<MainTabParamList>;
};
