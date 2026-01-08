import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { MainTabParamList } from "../types/navigation";

import DashboardStack from "./DashboardStack";
import FoodStack from "./FoodStack";

import ActivityScreen from "../screens/ActivityScreen";
import StepsScreen from "../screens/StepsScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false, 
      }}
    >
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
        component={ActivityScreen}
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
