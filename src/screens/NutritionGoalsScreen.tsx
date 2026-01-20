import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Alert, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

import { useAuth } from "../services/AuthContext";
import { useUserProfile } from "../hooks/useUserProfile";
import {
  defaultGoals,
  subscribeGoals,
  upsertGoals,
  type GoalsDoc,
} from "../services/firestoreGoals";
import { calcTargets } from "../utils/targets";

import { Screen } from "../components/ui/Screen";
import { Card } from "../components/ui/Card";
import { TextField } from "../components/ui/TextField";
import { PrimaryButton } from "../components/ui/PrimaryButton";
import { COLORS } from "../theme/colors";

function toInt(v: string) {
  const n = parseInt(v.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

export default function NutritionGoalsScreen() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const navigation = useNavigation<any>();
  const tabBarHeight = useBottomTabBarHeight();

  // ✅ Fetch user profile สำหรับคำนวณ recommendation
  const { profile } = useUserProfile(uid);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [calorieTarget, setCalorieTarget] = useState("2300");
  const [carbTarget, setCarbTarget] = useState("300");
  const [proteinTarget, setProteinTarget] = useState("150");
  const [fatTarget, setFatTarget] = useState("70");

  useEffect(() => {
    if (!uid) return;

    const unsub = subscribeGoals(uid, (g: GoalsDoc) => {
      setCalorieTarget(String(g.calorieTarget ?? defaultGoals.calorieTarget));
      setCarbTarget(String(g.carbTarget ?? defaultGoals.carbTarget));
      setProteinTarget(String(g.proteinTarget ?? defaultGoals.proteinTarget));
      setFatTarget(String(g.fatTarget ?? defaultGoals.fatTarget));
      setLoading(false);
    });

    return unsub;
  }, [uid]);

  const parsed = useMemo(() => {
    return {
      calorie: toInt(calorieTarget),
      carb: toInt(carbTarget),
      protein: toInt(proteinTarget),
      fat: toInt(fatTarget),
    };
  }, [calorieTarget, carbTarget, proteinTarget, fatTarget]);

  // ✅ Calculate recommended targets from profile
  const recommended = useMemo(() => {
    if (!profile.sex || !profile.age) return null;

    const sex = (profile.sex ?? "male") as any;
    const age = Number(profile.age ?? 22);
    const heightCm = Number(profile.heightCm ?? profile.height_cm ?? 170);
    const weightKg = Number(profile.weightKg ?? profile.weight_kg ?? 66);
    const exerciseStyle = ((profile as any).exerciseStyle ?? (profile as any).exercise_style ?? "not_exercise") as any;
    const goalType =
      ((profile as any).goalType ?? (profile as any).goal ?? "maintain_weight") as any;

    try {
      const targets = calcTargets({
        sex,
        age,
        heightCm,
        weightKg,
        exerciseStyle,
        goal: goalType,
      });

      return {
        calorieTarget: targets.calorieTarget,
        carbTarget: targets.carbTarget,
        proteinTarget: targets.proteinTarget,
        fatTarget: targets.fatTarget,
      };
    } catch (e) {
      console.warn("[NutritionGoalsScreen] Calculate targets failed:", e);
      return null;
    }
  }, [profile.sex, profile.age, profile.heightCm, profile.height_cm, profile.weightKg, profile.weight_kg, profile.exerciseStyle, profile.exercise_style, (profile as any).goalType, (profile as any).goal]);

  const validate = () => {
    if (parsed.calorie < 800 || parsed.calorie > 6000)
      return "Calorie target should be 800–6000 kcal.";
    if (parsed.carb < 0 || parsed.carb > 1000)
      return "Carbohydrate target is invalid.";
    if (parsed.protein < 0 || parsed.protein > 500)
      return "Protein target is invalid.";
    if (parsed.fat < 0 || parsed.fat > 300)
      return "Fat target is invalid.";
    return null;
  };

  const onSave = async () => {
    if (!uid) return Alert.alert("Error", "Not logged in");

    const err = validate();
    if (err) return Alert.alert("Invalid input", err);

    setSaving(true);
    try {
      await upsertGoals(uid, {
        calorieTarget: parsed.calorie,
        carbTarget: parsed.carb,
        proteinTarget: parsed.protein,
        fatTarget: parsed.fat,
        customized: true,
      });

      Alert.alert("Updated", "Nutrition goals updated.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // ✅ Apply recommended targets
  const onApplyRecommended = () => {
    if (!recommended) return;

    Alert.alert(
      "Use recommended",
      `Calorie: ${recommended.calorieTarget} kcal\nCarbs: ${recommended.carbTarget}g\nProtein: ${recommended.proteinTarget}g\nFat: ${recommended.fatTarget}g`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Apply",
          onPress: () => {
            setCalorieTarget(String(recommended.calorieTarget));
            setCarbTarget(String(recommended.carbTarget));
            setProteinTarget(String(recommended.proteinTarget));
            setFatTarget(String(recommended.fatTarget));
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <Screen>
        <View style={{ flex: 1, padding: 16, justifyContent: "center" }}>
          <Text style={{ color: COLORS.subtext, fontWeight: "800" }}>
            Loading goals...
          </Text>
        </View>
      </Screen>
    );
  }
  return (
    <Screen>
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, padding: 16, gap: 14, paddingBottom: tabBarHeight + 150 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 🔙 Back header */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 999,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: COLORS.surface2,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </Pressable>

          <Text style={{ color: COLORS.text, fontSize: 22, fontWeight: "900" }}>
            Nutrition goals
          </Text>
        </View>

        <Text style={{ color: COLORS.subtext, fontWeight: "700" }}>
          Adjust targets and Dashboard will update in realtime.
        </Text>

        {/* ✅ Recommendation card */}
        {recommended && (
          <Card style={{ gap: 12, borderWidth: 1, borderColor: COLORS.success, backgroundColor: "rgba(43,228,167,0.08)" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="bulb-outline" size={20} color={COLORS.success} />
              <Text style={{ color: COLORS.success, fontWeight: "900", fontSize: 14 }}>
                Recommended
              </Text>
            </View>

            <View
              style={{
                backgroundColor: "rgba(43,228,167,0.1)",
                padding: 12,
                borderRadius: 12,
                gap: 6,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: COLORS.subtext, fontWeight: "700" }}>
                  Calorie target:
                </Text>
                <Text style={{ color: COLORS.success, fontWeight: "900" }}>
                  {recommended.calorieTarget} kcal
                </Text>
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: COLORS.subtext, fontWeight: "700" }}>
                  Carbs:
                </Text>
                <Text style={{ color: COLORS.success, fontWeight: "900" }}>
                  {recommended.carbTarget}g
                </Text>
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: COLORS.subtext, fontWeight: "700" }}>
                  Protein:
                </Text>
                <Text style={{ color: COLORS.success, fontWeight: "900" }}>
                  {recommended.proteinTarget}g
                </Text>
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: COLORS.subtext, fontWeight: "700" }}>
                  Fat:
                </Text>
                <Text style={{ color: COLORS.success, fontWeight: "900" }}>
                  {recommended.fatTarget}g
                </Text>
              </View>
            </View>

            <Pressable
              onPress={onApplyRecommended}
              style={{
                paddingVertical: 12,
                borderRadius: 10,
                backgroundColor: COLORS.success,
                alignItems: "center",
              }}
            >
              <Text style={{ color: COLORS.bg, fontWeight: "900", fontSize: 14 }}>
                Use Recommended
              </Text>
            </Pressable>
          </Card>
        )}

        <Card style={{ gap: 12 }}>
          <TextField
            label="Calorie target (kcal/day)"
            value={calorieTarget}
            onChange={(v) => setCalorieTarget(v.replace(/[^\d]/g, ""))}
            keyboardType="numeric"
            placeholder="0"
          />
          <TextField
            label="Carbohydrate target (g/day)"
            value={carbTarget}
            onChange={(v) => setCarbTarget(v.replace(/[^\d]/g, ""))}
            keyboardType="numeric"
            placeholder="0"
          />
          <TextField
            label="Protein target (g/day)"
            value={proteinTarget}
            onChange={(v) => setProteinTarget(v.replace(/[^\d]/g, ""))}
            keyboardType="numeric"
            placeholder="0"
          />
          <TextField
            label="Fat target (g/day)"
            value={fatTarget}
            onChange={(v) => setFatTarget(v.replace(/[^\d]/g, ""))}
            keyboardType="numeric"
            placeholder="0"
          />

          <Text
            style={{
              color: COLORS.subtext,
              fontSize: 12,
              fontWeight: "700",
              lineHeight: 18,
            }}
          >
            Tip: These are MVP defaults. You can auto-calculate targets later
            based on TDEE and goal.
          </Text>
        </Card>

        <PrimaryButton
          title={saving ? "Saving..." : "Save"}
          onPress={onSave}
          disabled={saving}
        />
      </ScrollView>
    </Screen>
  );
}
