import type { NavigatorScreenParams } from "@react-navigation/native";
import type { ActivityKey } from "../utils/met";
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
  ActivityHome: undefined;
  ExercisePosture: undefined;
  ExerciseCollection: { activityKey: ActivityKey };
  ActivityDayDetail: { dateKey: string };
  Achievements: undefined;
};

// ---------- Profile Stack ----------
export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: undefined;
  HealthHistory: undefined;
  HealthHistoryDay: { dateKey: string };
};

// ---------- Main Tabs ----------
export type MainTabParamList = {
  DashboardTab: NavigatorScreenParams<DashboardStackParamList>;
  FoodTab: NavigatorScreenParams<FoodStackParamList>;
  ActivityTab: NavigatorScreenParams<ActivityStackParamList>;
  StepsTab: undefined;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

// ---------- Root ----------
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  MainTabs: NavigatorScreenParams<MainTabParamList>;
};
