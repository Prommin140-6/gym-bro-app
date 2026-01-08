import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import DashboardScreen from "../screens/DashboardScreen";
import NutritionGoalsScreen from "../screens/NutritionGoalsScreen";

export type DashboardStackParamList = {
  DashboardHome: undefined;
  NutritionGoals: undefined;
};

const Stack = createNativeStackNavigator<DashboardStackParamList>();

export default function DashboardStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="DashboardHome"
        component={DashboardScreen}
        options={{ title: "Dashboard" }}
      />
      <Stack.Screen
        name="NutritionGoals"
        component={NutritionGoalsScreen}
        options={{ title: "Nutrition goals" }}
      />
    </Stack.Navigator>
  );
}
