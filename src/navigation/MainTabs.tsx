import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { MainTabParamList } from "../types/navigation";

import DashboardStack from "./DashboardStack";
import FoodStack from "./FoodStack";
import ActivityStack from "./ActivityStack";

import StepsScreen from "../screens/StepsScreen";
import ProfileScreen from "../screens/ProfileScreen";

import { useAuth } from "../services/AuthContext";
import { useAutoDailySummary } from "../hooks/useAutoDailySummary";

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabs() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  // ✅ Step1 check: ต้องเห็น log นี้ทุกครั้งที่ MainTabs render
  console.log("[MainTabs] render uid =", uid);

  // ✅ Auto upsert daily_summary (ทำงานทั้งแอป ไม่ต้องเข้า Activity)
  useAutoDailySummary(uid);

  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="DashboardTab"
        component={DashboardStack}
        options={{ title: "Dashboard" }}
      />

      <Tab.Screen
        name="FoodTab"
        component={FoodStack}
        options={{ title: "Food" }}
      />

      <Tab.Screen
        name="ActivityTab"
        component={ActivityStack}
        options={{ title: "Activity" }}
      />

      <Tab.Screen
        name="StepsTab"
        component={StepsScreen}
        options={{ title: "Steps" }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: "Profile" }}
      />
    </Tab.Navigator>
  );
}
