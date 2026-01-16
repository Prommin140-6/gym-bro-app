// src/navigation/ActivityStack.tsx
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { ActivityStackParamList } from "../types/navigation";

import ActivityScreen from "../screens/ActivityScreen";
import ExercisePostureScreen from "../screens/activity/ExercisePostureScreen";
import ExerciseCollectionScreen from "../screens/activity/ExerciseCollectionScreen";
import ActivityDayDetailScreen from "../screens/activity/ActivityDayDetailScreen";
import AchievementsScreen from "../screens/activity/AchievementsScreen";

const Stack = createNativeStackNavigator<ActivityStackParamList>();

export default function ActivityStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ActivityHome"
        component={ActivityScreen}
        options={{ headerShown: false }}
      />

      {/* ✅ ปิด header แถบขาว */}
      <Stack.Screen
        name="ExercisePosture"
        component={ExercisePostureScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="ExerciseCollection"
        component={ExerciseCollectionScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="ActivityDayDetail"
        component={ActivityDayDetailScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="Achievements"
        component={AchievementsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
