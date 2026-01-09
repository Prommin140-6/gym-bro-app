import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RegisterWizardParamList } from "../../navigation/RegisterWizardStack";

import { WizardProgress } from "../../components/WizardProgress";
import { Screen } from "../../components/ui/Screen";
import { Card } from "../../components/ui/Card";
import { PrimaryButton } from "../../components/ui/PrimaryButton";

import { useOnboarding } from "../../services/OnboardingContext";
import { COLORS } from "../../theme/colors";

type Props = NativeStackScreenProps<RegisterWizardParamList, "Step4ExerciseStyle">;

const OPTIONS = [
  {
    key: "exercise_everyday",
    title: "Very active",
    desc: "Workout almost every day",
  },
  {
    key: "exercise_3_5_days_week",
    title: "Active",
    desc: "Workout 3–5 days / week",
  },
  {
    key: "exercise_1_2_days_week",
    title: "Lightly active",
    desc: "Workout 1–2 days / week",
  },
  {
    key: "not_exercise",
    title: "Sedentary",
    desc: "Little or no exercise",
  },
] as const;

export default function Step4ExerciseStyle({ navigation }: Props) {
  const { draft, setDraft } = useOnboarding();
  const [error, setError] = useState<string | null>(null);

  const onNext = () => {
    if (!draft.exerciseStyle) {
      setError("Please select one option");
      return;
    }
    setError(null);
    navigation.navigate("Step5Goal");
  };

  return (
    <Screen>
      <View style={{ flex: 1, padding: 16, justifyContent: "center", gap: 14 }}>
        <WizardProgress step={4} total={6} />

        <View style={{ gap: 4 }}>
          <Text style={{ color: COLORS.text, fontSize: 26, fontWeight: "900" }}>
            Activity Level
          </Text>
          <Text style={{ color: COLORS.subtext, fontWeight: "700" }}>
            This helps calculate your TDEE
          </Text>
        </View>

        <Card style={{ gap: 12 }}>
          {OPTIONS.map((o) => {
            const selected = draft.exerciseStyle === o.key;

            return (
              <Pressable
                key={o.key}
                onPress={() => setDraft((d) => ({ ...d, exerciseStyle: o.key }))}
                style={{
                  borderWidth: 2,
                  borderColor: selected ? COLORS.primary : COLORS.border, // ✅ เลือกแล้วเป็นกรอบ primary
                  backgroundColor: COLORS.surface2,
                  borderRadius: 16,
                  padding: 14,
                  gap: 6,
                }}
              >
                <Text style={{ color: COLORS.text, fontWeight: "900", fontSize: 16 }}>
                  {o.title}
                </Text>
                <Text style={{ color: COLORS.subtext, fontWeight: "700" }}>
                  {o.desc}
                </Text>
              </Pressable>
            );
          })}

          {error ? (
            <Text style={{ color: COLORS.danger, fontWeight: "800" }}>{error}</Text>
          ) : null}

          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable
              onPress={() => navigation.goBack()}
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
              <Text style={{ color: COLORS.text, fontWeight: "900" }}>Back</Text>
            </Pressable>

            <View style={{ flex: 1 }}>
              <PrimaryButton title="Next" onPress={onNext} />
            </View>
          </View>
        </Card>
      </View>
    </Screen>
  );
}
