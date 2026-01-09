import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import type { AuthStackParamList } from "../types/navigation";

import WelcomeScreen from "../screens/WelcomeScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterWizardStack from "./RegisterWizardStack";

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStack() {
  return (
    <Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterWizardStack} />
    </Stack.Navigator>
  );
}
