import React from "react";
import { ActivityIndicator, View } from "react-native";
import AuthStack from "./AuthStack";
import MainTabs from "./MainTabs";
import { useAuth } from "../services/AuthContext";

export default function RootNavigator() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return user ? <MainTabs /> : <AuthStack />;
}
