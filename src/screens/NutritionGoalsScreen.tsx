import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { useAuth } from "../services/AuthContext";
import { defaultGoals, subscribeGoals, upsertGoals, type GoalsDoc } from "../services/firestoreGoals";

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

  const validate = () => {
    if (parsed.calorie < 800 || parsed.calorie > 6000) return "Calorie target should be 800–6000 kcal.";
    if (parsed.carb < 0 || parsed.carb > 1000) return "Carbohydrate target is invalid.";
    if (parsed.protein < 0 || parsed.protein > 500) return "Protein target is invalid.";
    if (parsed.fat < 0 || parsed.fat > 300) return "Fat target is invalid.";
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

  if (loading) {
    return (
      <Screen>
        <View style={{ flex: 1, padding: 16, justifyContent: "center" }}>
          <Text style={{ color: COLORS.subtext, fontWeight: "800" }}>Loading goals...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ flex: 1, padding: 16, gap: 14 }}>
        <View style={{ gap: 4 }}>
          <Text style={{ color: COLORS.text, fontSize: 22, fontWeight: "900" }}>
            Nutrition goals
          </Text>
          <Text style={{ color: COLORS.subtext, fontWeight: "700" }}>
            Adjust targets and Dashboard will update in realtime.
          </Text>
        </View>

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

          <Text style={{ color: COLORS.subtext, fontSize: 12, fontWeight: "700", lineHeight: 18 }}>
            Tip: These are MVP defaults. You can auto-calculate targets later based on TDEE and goal.
          </Text>
        </Card>

        <PrimaryButton title={saving ? "Saving..." : "Save"} onPress={onSave} disabled={saving} />
      </View>
    </Screen>
  );
}
