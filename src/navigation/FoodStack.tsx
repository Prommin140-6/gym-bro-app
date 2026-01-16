import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { FoodStackParamList } from "../types/navigation";

import FoodListScreen from "../screens/FoodListScreen";
import FoodDetailScreen from "../screens/FoodDetailScreen";
import AddFoodScreen from "../screens/AddFoodScreen";

const Stack = createNativeStackNavigator<FoodStackParamList>();

export default function FoodStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="FoodList" component={FoodListScreen} />
      <Stack.Screen name="FoodDetail" component={FoodDetailScreen} />
      <Stack.Screen name="AddFood" component={AddFoodScreen} />
    </Stack.Navigator>
  );
}
