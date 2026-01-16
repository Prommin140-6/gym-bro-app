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
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // ✅ เอา header ขาวออกทั้งหมด (เหมือน Activity)
      }}
    >
      <Stack.Screen name="DashboardHome" component={DashboardScreen} />
      <Stack.Screen name="NutritionGoals" component={NutritionGoalsScreen} />
    </Stack.Navigator>
  );
}
