import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { OnboardingProvider } from "../services/OnboardingContext";

import Step1Account from "../screens/register/Step1Account";
import Step2BasicInfo from "../screens/register/Step2BasicInfo";
import Step3BodyFat from "../screens/register/Step3BodyFat";
import Step4ExerciseStyle from "../screens/register/Step4ExerciseStyle";
import Step5Goal from "../screens/register/Step5Goal";
import Step6Summary from "../screens/register/Step6Summary";

export type RegisterWizardParamList = {
  Step1Account: undefined;
  Step2BasicInfo: undefined;
  Step3BodyFat: undefined;
  Step4ExerciseStyle: undefined;
  Step5Goal: undefined;
  Step6Summary: undefined;
};

const Stack = createNativeStackNavigator<RegisterWizardParamList>();

export default function RegisterWizardStack() {
  return (
    <OnboardingProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Step1Account" component={Step1Account} />
        <Stack.Screen name="Step2BasicInfo" component={Step2BasicInfo} />
        <Stack.Screen name="Step3BodyFat" component={Step3BodyFat} />
        <Stack.Screen name="Step4ExerciseStyle" component={Step4ExerciseStyle} />
        <Stack.Screen name="Step5Goal" component={Step5Goal} />
        <Stack.Screen name="Step6Summary" component={Step6Summary} />
      </Stack.Navigator>
    </OnboardingProvider>
  );
}
