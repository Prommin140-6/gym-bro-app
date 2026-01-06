import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import type { AuthStackParamList } from "../types/navigation";

import LoginScreen from "../screens/LoginScreen";
import RegisterWizardStack from "./RegisterWizardStack";

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStack() {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen
        name="Register"
        component={RegisterWizardStack}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
