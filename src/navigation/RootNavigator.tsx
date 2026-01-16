// src/navigation/RootNavigator.tsx
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

import AuthStack from "./AuthStack";
import MainTabs from "./MainTabs";

import { useAuth } from "../services/AuthContext";

import { useAutoAchievements } from "../hooks/useAutoAchievements";
import { ensureAchievementsInitialized } from "../services/firestoreAchievements";

export default function RootNavigator() {
  const { user, initializing } = useAuth();

  // ✅ ประเมิน/ปลดล็อค achievement อัตโนมัติ (เปิดแอป + หลัง log)
  useAutoAchievements(user?.uid ?? null);

  // ✅ สร้าง docs เริ่มต้นใน Firestore (ยังไม่ปลดล็อค) เพื่อให้เห็น/ทำ UI ได้
  useEffect(() => {
    if (!user?.uid) return;
    ensureAchievementsInitialized(user.uid).catch(() => {});
  }, [user?.uid]);

  if (initializing) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return user ? <MainTabs /> : <AuthStack />;
}
