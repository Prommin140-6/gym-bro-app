import React, { useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RegisterWizardParamList } from "../../navigation/RegisterWizardStack";

import { WizardProgress } from "../../components/WizardProgress";
import { Screen } from "../../components/ui/Screen";
import { Card } from "../../components/ui/Card";
import { PrimaryButton } from "../../components/ui/PrimaryButton";

import { useOnboarding } from "../../services/OnboardingContext";
import { useAuth } from "../../services/AuthContext";
import { db } from "../../services/firebase";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import {
  activityMultiplier,
  calcBMR,
  calcBMI,
  calcTDEE,
  recommendedCalories,
  healthAdvice,
} from "../../utils/healthCalc";
import { COLORS } from "../../theme/colors";

type Props = NativeStackScreenProps<RegisterWizardParamList, "Step6Summary">;

function mapFirebaseError(code?: string) {
  switch (code) {
    case "auth/email-already-in-use":
      return "Email already in use";
    case "auth/invalid-email":
      return "Invalid email";
    case "auth/weak-password":
      return "Password is too weak";
    case "auth/network-request-failed":
      return "Network error. Please try again.";
    default:
      return "Registration failed. Please try again.";
  }
}

export default function Step6Summary({ navigation }: Props) {
  const { draft, reset } = useOnboarding();
  const { register } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const summary = useMemo(() => {
    const sex = draft.sex!;
    const heightCm = Number(draft.heightCm);
    const weightKg = Number(draft.weightKg);
    const age = Number(draft.age);

    const bmi = calcBMI(heightCm, weightKg);
    const bmr = calcBMR(sex, heightCm, weightKg, age);
    const mult = activityMultiplier(draft.exerciseStyle!);
    const tdee = calcTDEE(bmr, mult);
    const cal = recommendedCalories(tdee, draft.goal!);
    const advice = healthAdvice({
      bmi,
      goal: draft.goal!,
      exerciseStyle: draft.exerciseStyle!,
    });


    return {
      bmi,
      bmr,
      tdee,
      cal,
      advice,
      mult,
    };
  }, [draft]);

  const onFinish = async () => {
    setSubmitting(true);
    setError(null);

    try {
      // 1) Register auth user
      await register(draft.email.trim(), draft.password);

      const { getAuth } = await import("firebase/auth");
      const { app } = await import("../../services/firebase");
      const user = getAuth(app).currentUser;
      if (!user) throw new Error("NO_USER");

      // 2) Save profile
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),

        sex: draft.sex,
        heightCm: Number(draft.heightCm),
        weightKg: Number(draft.weightKg),
        age: Number(draft.age),
        bodyFatPercent: draft.bodyFatPercent,

        exerciseStyle: draft.exerciseStyle,
        activityMultiplier: summary.mult,
        goal: draft.goal,

        bmi: summary.bmi,
        bmr: summary.bmr,
        tdee: summary.tdee,
        caloriesRecommended: summary.cal,

        onboardingCompleted: true,
      });

      reset();
      // RootNavigator จะพาเข้า MainTabs อัตโนมัติ
    } catch (e: any) {
      if (e?.message === "NO_USER") {
        setError("Account created but user not found. Please login again.");
      } else {
        setError(mapFirebaseError(e?.code));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <View style={{ flex: 1 }}>
        <WizardProgress step={6} total={6} />

        <ScrollView
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 24,
            gap: 14,
          }}
        >
          {/* Header */}
          <View style={{ gap: 4 }}>
            <Text style={{ color: COLORS.text, fontSize: 26, fontWeight: "900" }}>
              Summary
            </Text>
            <Text style={{ color: COLORS.subtext, fontWeight: "700" }}>
              Review your calculated results
            </Text>
          </View>

          {/* Key numbers */}
          <Card style={{ gap: 12 }}>
            <Stat label="BMI" value={`${summary.bmi}`} />
            <Stat label="BMR" value={`${summary.bmr} kcal / day`} />
            <Stat label="TDEE" value={`${summary.tdee} kcal / day`} />

            <View
              style={{
                marginTop: 6,
                padding: 14,
                borderRadius: 14,
                backgroundColor: COLORS.surface2,
                borderWidth: 1,
                borderColor: COLORS.primary,
              }}
            >
              <Text style={{ color: COLORS.subtext, fontWeight: "800" }}>
                Recommended calories
              </Text>
              <Text
                style={{
                  color: COLORS.text,
                  fontSize: 28,
                  fontWeight: "900",
                  marginTop: 4,
                }}
              >
                {summary.cal} kcal / day
              </Text>
            </View>
          </Card>

          {/* Advice */}
          <Card style={{ gap: 8 }}>
            <Text style={{ color: COLORS.text, fontWeight: "900", fontSize: 16 }}>
              Health advice
            </Text>
            <Text style={{ color: COLORS.subtext, lineHeight: 20 }}>
              {summary.advice}
            </Text>
          </Card>

          {error ? (
            <Text style={{ color: COLORS.danger, fontWeight: "800" }}>
              {error}
            </Text>
          ) : null}

          {/* Actions */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable
              onPress={() => navigation.goBack()}
              disabled={submitting}
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: COLORS.border,
                backgroundColor: "transparent",
                paddingVertical: 14,
                borderRadius: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ color: COLORS.text, fontWeight: "900" }}>
                Back
              </Text>
            </Pressable>

            <View style={{ flex: 1 }}>
              <PrimaryButton
                title={submitting ? "Creating..." : "Finish"}
                onPress={onFinish}
                disabled={submitting}
              />
            </View>
          </View>

          {submitting ? (
            <View style={{ alignItems: "center", marginTop: 6 }}>
              <ActivityIndicator />
            </View>
          ) : null}
        </ScrollView>
      </View>
    </Screen>
  );
}

/* ---------- small components ---------- */

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Text style={{ color: COLORS.subtext, fontWeight: "800" }}>{label}</Text>
      <Text style={{ color: COLORS.text, fontWeight: "900", fontSize: 18 }}>
        {value}
      </Text>
    </View>
  );
}
