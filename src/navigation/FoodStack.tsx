import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { FoodStackParamList } from "../types/navigation";

import FoodListScreen from "../screens/FoodListScreen";
// เดี๋ยว Step ถัดไปเราจะสร้างไฟล์นี้
import FoodDetailScreen from "../screens/FoodDetailScreen";
// เดี๋ยว Step ถัดไปเราจะสร้างไฟล์นี้
import AddFoodScreen from "../screens/AddFoodScreen";

const Stack = createNativeStackNavigator<FoodStackParamList>();

export default function FoodStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="FoodList" component={FoodListScreen} options={{ title: "Menus" }} />
      <Stack.Screen name="FoodDetail" component={FoodDetailScreen} options={{ title: "Food detail" }} />
      <Stack.Screen name="AddFood" component={AddFoodScreen} options={{ title: "Add new" }} />
    </Stack.Navigator>
  );
}
