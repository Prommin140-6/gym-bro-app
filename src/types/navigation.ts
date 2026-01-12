import type { NavigatorScreenParams } from "@react-navigation/native";
import type { FoodBase } from "./food";

// ---------- Auth Stack ----------
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
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

// ---------- Activity Stack ----------
export type ActivityStackParamList = {
  ActivityHome: undefined;          // container day/week/month
  ExercisePosture: undefined;       // choose plan screen
  ExerciseCollection: {
    activityKey: import("../utils/met").ActivityKey; 
  };
  ActivityDayDetail: { dateKey: string };
};

// ---------- Main Tabs ----------
export type MainTabParamList = {
  DashboardTab: NavigatorScreenParams<DashboardStackParamList>;
  FoodTab: NavigatorScreenParams<FoodStackParamList>;
  ActivityTab: NavigatorScreenParams<ActivityStackParamList>;
  StepsTab: undefined;
  ProfileTab: undefined;
};

// ---------- Root (ถ้าต้องใช้ในอนาคต) ----------
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  MainTabs: NavigatorScreenParams<MainTabParamList>;
};
