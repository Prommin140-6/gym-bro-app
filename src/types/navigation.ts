import type { NavigatorScreenParams } from "@react-navigation/native";
import type { FoodBase } from "./food";

// ---------- Auth Stack ----------
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined; // RegisterWizardStack (nested) แต่ไม่ได้รับ params
};

// ---------- Dashboard Stack ----------
export type DashboardStackParamList = {
  DashboardHome: undefined;
  NutritionGoals: undefined;
};

// ---------- Food Stack ----------
export type FoodStackParamList = {
  FoodList: undefined;
  FoodDetail: { food: FoodBase };
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

// ---------- Root (optional) ----------
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  MainTabs: NavigatorScreenParams<MainTabParamList>;
};