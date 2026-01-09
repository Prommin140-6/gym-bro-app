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

type Props = NativeStackScreenProps<RegisterWizardParamList, "Step5Goal">;

const OPTIONS = [
  {
    key: "lose_weight",
    title: "Lose weight",
    desc: "Reduce body fat gradually",
  },
  {
    key: "gain_weight",
    title: "Gain weight",
    desc: "Increase body weight & calories",
  },
  {
    key: "maintain_weight",
    title: "Maintain weight",
    desc: "Keep current body weight",
  },
  {
    key: "maintain_muscle",
    title: "Maintain muscle",
    desc: "Preserve muscle mass & strength",
  },
] as const;

export default function Step5Goal({ navigation }: Props) {
  const { draft, setDraft } = useOnboarding();
  const [error, setError] = useState<string | null>(null);

  const onNext = () => {
    if (!draft.goal) {
      setError("Please select one goal");
      return;
    }
    setError(null);
    navigation.navigate("Step6Summary");
  };

  return (
    <Screen>
      <View style={{ flex: 1, padding: 16, justifyContent: "center", gap: 14 }}>
        <WizardProgress step={5} total={6} />

        <View style={{ gap: 4 }}>
          <Text style={{ color: COLORS.text, fontSize: 26, fontWeight: "900" }}>
            Your Goal
          </Text>
          <Text style={{ color: COLORS.subtext, fontWeight: "700" }}>
            We’ll adjust calories based on this
          </Text>
        </View>

        <Card style={{ gap: 12 }}>
          {OPTIONS.map((o) => {
            const selected = draft.goal === o.key;

            return (
              <Pressable
                key={o.key}
                onPress={() => setDraft((d) => ({ ...d, goal: o.key }))}
                style={{
                  borderWidth: 2,
                  borderColor: selected ? COLORS.primary : COLORS.border,
                  backgroundColor: COLORS.surface2,
                  borderRadius: 16,
                  padding: 14,
                  gap: 6,
                }}
              >
                <Text
                  style={{
                    color: COLORS.text,
                    fontWeight: "900",
                    fontSize: 16,
                  }}
                >
                  {o.title}
                </Text>
                <Text
                  style={{
                    color: COLORS.subtext,
                    fontWeight: "700",
                  }}
                >
                  {o.desc}
                </Text>
              </Pressable>
            );
          })}

          {error ? (
            <Text style={{ color: COLORS.danger, fontWeight: "800" }}>
              {error}
            </Text>
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
              <Text style={{ color: COLORS.text, fontWeight: "900" }}>
                Back
              </Text>
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
