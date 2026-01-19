import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, Alert, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

import { Screen } from "../components/ui/Screen";
import { Card } from "../components/ui/Card";
import { COLORS } from "../theme/colors";

import { useAuth } from "../services/AuthContext";
import { useUserProfile } from "../hooks/useUserProfile";
import { useBurnTarget } from "../hooks/useBurnTarget";
import { useActivityToday } from "../hooks/useActivityToday";
import { useTodayNutrition } from "../hooks/useTodayNutrition";

import { upsertTodayDailySummary } from "../services/firestoreDailySummary";
import { deleteTodayActivity } from "../services/firestoreActivity";

import { useActivityPeriod } from "../hooks/useActivityPeriod";
import { useActivityMonth } from "../hooks/useActivityMonth";

import ActivityDayView from "./activity/ActivityDayView";
import { ActivityWeekView } from "../components/activity/ActivityWeekView";
import { ActivityMonthView } from "../components/activity/ActivityMonthView";

import FloatingAddButton from "../components/FloatingAddButton";
import { db } from "../services/firebase";
import { calcTargets } from "../utils/targets";

type TabKey = "day" | "week" | "month";

export default function ActivityScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const [tab, setTab] = useState<TabKey>("day");

  // ===== Profile =====
  const { profile, loading: loadingProfile } = useUserProfile(uid);

  const burnProfile = useMemo(() => {
    if (!profile) return null;

    const sex = (profile.sex ?? "male") as any;
    const age = Number(profile.age ?? 22);
    const heightCm = Number((profile as any).heightCm ?? profile.height_cm ?? 170);
    const weightKg = Number((profile as any).weightKg ?? profile.weight_kg ?? 66);
    const exerciseStyle = ((profile as any).exerciseStyle ?? "not_exercise") as any;
    const goalType =
      ((profile as any).goalType ?? (profile as any).goal ?? "maintain_weight") as any;

    return { sex, age, heightCm, weightKg, exerciseStyle, goalType };
  }, [profile]);

  // ===== Targets =====
  const { burnTarget } = useBurnTarget(uid, burnProfile);

  // ✅ Recommended burn target from profile
  const recommendedBurnTarget = useMemo(() => {
    if (!burnProfile) return 0;

    const out = calcTargets({
      sex: burnProfile.sex,
      age: Number(burnProfile.age),
      heightCm: Number(burnProfile.heightCm),
      weightKg: Number(burnProfile.weightKg),
      exerciseStyle: burnProfile.exerciseStyle,
      goal: burnProfile.goalType,
    });

    return typeof out?.burnTarget === "number" ? out.burnTarget : 0;
  }, [burnProfile]);

  // ===== Today =====
  const { activities, totals, dailySummary, loading } = useActivityToday(uid);
  const { goals: nutritionGoals, totals: nutritionTotals } = useTodayNutrition(uid);

  const restDay = Boolean(dailySummary?.restDay ?? false);

  // ===== Week =====
  const { weekDays, weekTotalBurned, streak } = useActivityPeriod(uid);

  // ===== Month (M3) =====
  const [monthBase, setMonthBase] = useState(() => new Date());
  const { loadingMonth, monthDocs } = useActivityMonth(uid, monthBase);

  // ===== Rest day toggle =====
  const onToggleRestDay = async () => {
    if (!uid) return Alert.alert("Error", "Not logged in");

    const next = !restDay;
    Alert.alert(
      "Rest day",
      next ? "Mark today as a rest day?" : "Remove rest day for today?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: next ? "Confirm" : "Remove",
          style: next ? "default" : "destructive",
          onPress: async () => {
            await upsertTodayDailySummary(uid, { restDay: next });
          },
        },
      ]
    );
  };

  // ===== Delete activity =====
  const onDelete = (id: string) => {
    if (!uid) return;

    Alert.alert("Delete activity", "Are you sure you want to delete this log?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteTodayActivity(uid, id);
        },
      },
    ]);
  };

  // ===== Update burn target (custom) =====
  const onUpdateBurnTarget = async (value: number) => {
    if (!uid) return Alert.alert("Error", "Not logged in");
    if (!Number.isFinite(value) || value <= 0) return;

    try {
      const ref = doc(db, "users", uid, "goals", "targets");
      await setDoc(
        ref,
        {
          burnTarget: Number(value),
          customized: true,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (e) {
      console.warn("[ActivityScreen] update burnTarget failed:", e);
      Alert.alert("Error", "Failed to update goal");
    }
  };

  // ✅ Recommended: update burnTarget immediately + customized=false
  const onUseAutoBurnTarget = async () => {
    if (!uid) return Alert.alert("Error", "Not logged in");

    const rec = Number(recommendedBurnTarget ?? 0);
    if (!rec || rec <= 0) {
      return Alert.alert("Error", "Recommendation not ready (profile missing)");
    }

    try {
      const ref = doc(db, "users", uid, "goals", "targets");
      await setDoc(
        ref,
        {
          customized: false,
          burnTarget: rec,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (e) {
      console.warn("[ActivityScreen] apply recommended failed:", e);
      Alert.alert("Error", "Failed to apply recommended goal");
    }
  };

  // ===== Auto upsert daily summary =====
  const lastSig = useRef<string>("");

  useEffect(() => {
    if (!uid) return;

    const burned = Number(totals.totalBurned ?? 0);
    const distanceKm = Number(totals.totalDistanceKm ?? 0);
    const eatenCalories = Number(nutritionTotals.totalCalories ?? 0);

    const burnT = Number(burnTarget ?? 0);
    const calT = Number(nutritionGoals.calorieTarget ?? 0);

    const OVER_LIMIT = 100;

    const burnSuccess = burned >= burnT && burned <= burnT + OVER_LIMIT;
    const calorieSuccess = eatenCalories >= calT && eatenCalories <= calT + OVER_LIMIT;
    const success = restDay ? false : burnSuccess && calorieSuccess;


    const sig = JSON.stringify({
      burned,
      distanceKm,
      eatenCalories,
      burnT,
      calT,
      restDay,
      burnSuccess,
      calorieSuccess,
      success,
    });

    if (sig === lastSig.current) return;
    lastSig.current = sig;

    upsertTodayDailySummary(uid, {
      totalBurnedCalories: burned,
      totalDistanceKm: distanceKm,
      eatenCalories,
      burnTarget: burnT,
      calorieTarget: calT,
      restDay,
      burnSuccess,
      calorieSuccess,
      success,
    }).catch(() => { });
  }, [
    uid,
    totals.totalBurned,
    totals.totalDistanceKm,
    nutritionTotals.totalCalories,
    nutritionGoals.calorieTarget,
    burnTarget,
    restDay,
  ]);

  const bottomPad = 140;

  return (
    <Screen>
      <View style={{ flex: 1, padding: 16 }}>
        {/* ===== Header ===== */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <View>
            <Text style={{ color: COLORS.text, fontSize: 26, fontWeight: "900" }}>
              Activity
            </Text>
            <Text style={{ color: COLORS.subtext, fontWeight: "700", marginTop: 2 }}>
              Track calories burned
            </Text>
          </View>

          <Pressable
            style={{
              padding: 10,
              borderRadius: 999,
              backgroundColor: COLORS.surface2,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
            onPress={() => navigation.navigate("Achievements")}
          >
            <Ionicons name="trophy-outline" size={20} color={COLORS.text} />
          </Pressable>
        </View>

        {/* ===== Tabs ===== */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: COLORS.surface2,
            borderRadius: 16,
            padding: 4,
            marginBottom: 14,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          {(["day", "week", "month"] as TabKey[]).map((k) => {
            const active = tab === k;
            return (
              <Pressable
                key={k}
                onPress={() => setTab(k)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 12,
                  alignItems: "center",
                  backgroundColor: active ? COLORS.primary : "transparent",
                }}
              >
                <Text
                  style={{
                    color: active ? "white" : COLORS.subtext,
                    fontWeight: "900",
                    fontSize: 12,
                  }}
                >
                  {k.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ===== Content ===== */}
        {tab === "day" && (
          <ScrollView contentContainerStyle={{ paddingBottom: bottomPad }}>
            <ActivityDayView
              loading={loading || loadingProfile}
              burnedToday={Number(totals.totalBurned ?? 0)}
              burnTarget={Number(burnTarget ?? 0)}
              distanceKm={Number(totals.totalDistanceKm ?? 0)}
              activities={activities}
              restDay={restDay}
              onRestDay={onToggleRestDay}
              onDelete={onDelete}
              onUpdateBurnTarget={onUpdateBurnTarget}
              onUseAutoBurnTarget={onUseAutoBurnTarget}
              recommendedBurnTarget={recommendedBurnTarget} // ✅ ส่งเข้าไปเพื่อโชว์ “Recommended • 320 kcal”
            />
          </ScrollView>
        )}

        {tab === "week" && (
          <ScrollView contentContainerStyle={{ paddingBottom: bottomPad }}>
            <ActivityWeekView
              weekDays={weekDays}
              weekTotalBurned={weekTotalBurned}
              streak={streak}
              onSelectDay={(dateKey) => navigation.navigate("ActivityDayDetail", { dateKey })}
            />
          </ScrollView>
        )}

        {tab === "month" && (
          <ScrollView contentContainerStyle={{ paddingBottom: bottomPad }}>
            <ActivityMonthView
              baseDate={monthBase}
              loading={loadingMonth}
              monthDocs={monthDocs}
              onPrevMonth={() => setMonthBase((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
              onNextMonth={() => setMonthBase((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
              onSelectDay={(dateKey) => navigation.navigate("ActivityDayDetail", { dateKey })}
            />
          </ScrollView>
        )}

        {/* ===== FAB ===== */}
        <FloatingAddButton onPress={() => navigation.navigate("ExercisePosture")} />
      </View>
    </Screen>
  );
}
