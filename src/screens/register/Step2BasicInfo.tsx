import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RegisterWizardParamList } from "../../navigation/RegisterWizardStack";

import { WizardProgress } from "../../components/WizardProgress";
import { Screen } from "../../components/ui/Screen";
import { Card } from "../../components/ui/Card";
import { TextField } from "../../components/ui/TextField";
import { PrimaryButton } from "../../components/ui/PrimaryButton";

import { useOnboarding } from "../../services/OnboardingContext";
import { COLORS } from "../../theme/colors";

type Props = NativeStackScreenProps<RegisterWizardParamList, "Step2BasicInfo">;

function onlyDigits(s: string) {
  return s.replace(/[^\d]/g, "");
}

export default function Step2BasicInfo({ navigation }: Props) {
  const { draft, setDraft } = useOnboarding();
  const [error, setError] = useState<string | null>(null);

  const validate = () => {
    if (!draft.sex) return "Please select sex";
    const h = Number(draft.heightCm);
    const w = Number(draft.weightKg);
    const a = Number(draft.age);

    if (!h || h < 120 || h > 230) return "Height must be 120–230 cm";
    if (!w || w < 30 || w > 250) return "Weight must be 30–250 kg";
    if (!a || a < 10 || a > 100) return "Age must be 10–100";
    return null;
  };

  const onNext = () => {
    const v = validate();
    if (v) return setError(v);
    setError(null);
    navigation.navigate("Step3BodyFat");
  };

  return (
    <Screen>
      <View style={{ flex: 1, padding: 16, justifyContent: "center", gap: 14 }}>
        <WizardProgress step={2} total={6} />

        <View style={{ gap: 4 }}>
          <Text style={{ color: COLORS.text, fontSize: 26, fontWeight: "900" }}>
            Basic Info
          </Text>
          <Text style={{ color: COLORS.subtext, fontWeight: "700" }}>
            Tell us about your body
          </Text>
        </View>

        <Card style={{ gap: 12 }}>
          {/* Sex pills */}
          <View style={{ gap: 8 }}>
            <Text style={{ color: COLORS.text, fontWeight: "900" }}>Sex</Text>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                onPress={() => setDraft((d) => ({ ...d, sex: "male" }))}
                style={[
                  pill,
                  { borderColor: COLORS.border, backgroundColor: COLORS.surface2 },
                  draft.sex === "male" && pillActive,
                ]}
              >
                <Text
                  style={[
                    pillText,
                    { color: draft.sex === "male" ? COLORS.text : COLORS.subtext },
                  ]}
                >
                  Male
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setDraft((d) => ({ ...d, sex: "female" }))}
                style={[
                  pill,
                  { borderColor: COLORS.border, backgroundColor: COLORS.surface2 },
                  draft.sex === "female" && pillActive,
                ]}
              >
                <Text
                  style={[
                    pillText,
                    { color: draft.sex === "female" ? COLORS.text : COLORS.subtext },
                  ]}
                >
                  Female
                </Text>
              </Pressable>
            </View>
          </View>

          <TextField
            label="Height (cm)"
            value={draft.heightCm}
            onChange={(t) => setDraft((d) => ({ ...d, heightCm: onlyDigits(t) }))}
            placeholder="e.g. 174"
            keyboardType="numeric"
          />

          <TextField
            label="Weight (kg)"
            value={draft.weightKg}
            onChange={(t) => setDraft((d) => ({ ...d, weightKg: onlyDigits(t) }))}
            placeholder="e.g. 66"
            keyboardType="numeric"
          />

          <TextField
            label="Age"
            value={draft.age}
            onChange={(t) => setDraft((d) => ({ ...d, age: onlyDigits(t) }))}
            placeholder="e.g. 22"
            keyboardType="numeric"
          />

          {error ? (
            <Text style={{ color: COLORS.danger, fontWeight: "800" }}>{error}</Text>
          ) : null}

          {/* buttons */}
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

const pill = {
  flex: 1,
  borderWidth: 1,
  borderRadius: 999,
  paddingVertical: 12,
  alignItems: "center",
} as const;

const pillActive = {
  backgroundColor: COLORS.primary,
  borderColor: COLORS.primary,
} as const;

const pillText = {
  fontWeight: "900",
  fontSize: 14,
} as const;
