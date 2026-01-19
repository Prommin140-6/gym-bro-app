import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ProfileScreen from "../screens/ProfileScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import HealthHistoryScreen from "../screens/HealthHistoryScreen";
import HealthHistoryDayScreen from "../screens/HealthHistoryDayScreen";
import type { ProfileStackParamList } from "../types/navigation";

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileHome" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />

      {/* NEW */}
      <Stack.Screen name="HealthHistory" component={HealthHistoryScreen} />
      <Stack.Screen name="HealthHistoryDay" component={HealthHistoryDayScreen} />
    </Stack.Navigator>
  );
}
