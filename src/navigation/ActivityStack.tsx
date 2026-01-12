import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { ActivityStackParamList } from "../types/navigation";

import ActivityScreen from "../screens/ActivityScreen";
import ExercisePostureScreen from "../screens/activity/ExercisePostureScreen";
import ExerciseCollectionScreen from "../screens/activity/ExerciseCollectionScreen";

import ActivityDayDetailScreen from "../screens/activity/ActivityDayDetailScreen";

const Stack = createNativeStackNavigator<ActivityStackParamList>();

export default function ActivityStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ActivityHome"
        component={ActivityScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="ExercisePosture"
        component={ExercisePostureScreen}
        options={{ title: "Exercise posture" }}
      />

      <Stack.Screen
        name="ExerciseCollection"
        component={ExerciseCollectionScreen}
        options={{ title: "Exercises" }}
      />

      <Stack.Screen
        name="ActivityDayDetail"
        component={ActivityDayDetailScreen}
        options={{ title: "Day detail" }}
      />

    </Stack.Navigator>
  );
}
