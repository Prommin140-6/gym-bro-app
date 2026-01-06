import React from "react";
import { View, Text, Pressable } from "react-native";
import { useAuth } from "../services/AuthContext";

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={{ flex: 1, padding: 16, justifyContent: "center", gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: "700" }}>Profile</Text>
      <Text>{user?.email ?? "-"}</Text>

      <Pressable
        onPress={logout}
        style={{ backgroundColor: "#111", padding: 14, borderRadius: 12, alignItems: "center" }}
      >
        <Text style={{ color: "white", fontWeight: "700" }}>Logout</Text>
      </Pressable>
    </View>
  );
}
