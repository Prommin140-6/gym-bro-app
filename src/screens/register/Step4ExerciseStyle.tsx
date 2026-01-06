import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RegisterWizardParamList } from "../../navigation/RegisterWizardStack";
import { WizardProgress } from "../../components/WizardProgress";
import { useOnboarding } from "../../services/OnboardingContext";

type Props = NativeStackScreenProps<RegisterWizardParamList, "Step4ExerciseStyle">;

const OPTIONS = [
  { key: "exercise_everyday", label: "ออกกำลังกายทุกวัน" },
  { key: "exercise_3_5_days_week", label: "ออกกำลังกาย 3–5 วัน/สัปดาห์" },
  { key: "exercise_1_2_days_week", label: "ออกกำลังกาย 1–2 วัน/สัปดาห์" },
  { key: "not_exercise", label: "ไม่ค่อยออกกำลังกาย" },
] as const;

export default function Step4ExerciseStyle({ navigation }: Props) {
  const { draft, setDraft } = useOnboarding();
  const [error, setError] = useState<string | null>(null);

  const next = () => {
    if (!draft.exerciseStyle) return setError("กรุณาเลือกอย่างน้อย 1 ตัวเลือก");
    setError(null);
    navigation.navigate("Step5Goal");
  };

  return (
    <View style={{ flex: 1, padding: 16, justifyContent: "center", gap: 12 }}>
      <WizardProgress step={4} total={6} />
      <Text style={{ fontSize: 24, fontWeight: "800" }}>Exercise Style</Text>

      {OPTIONS.map((o) => {
        const selected = draft.exerciseStyle === o.key;
        return (
          <Pressable
            key={o.key}
            onPress={() => setDraft((d) => ({ ...d, exerciseStyle: o.key }))}
            style={{
              borderWidth: 2,
              borderColor: selected ? "#111" : "#ccc",
              borderRadius: 14,
              padding: 14,
            }}
          >
            <Text style={{ fontWeight: "700" }}>{o.label}</Text>
          </Pressable>
        );
      })}

      {error ? <Text style={{ color: "#d00" }}>{error}</Text> : null}

      <View style={{ flexDirection: "row", gap: 10 }}>
        <Pressable onPress={() => navigation.goBack()} style={[btn, ghost]}>
          <Text style={[btnText, { color: "#111" }]}>Back</Text>
        </Pressable>
        <Pressable onPress={next} style={btn}>
          <Text style={btnText}>Next</Text>
        </Pressable>
      </View>
    </View>
  );
}

const btn = { flex: 1, backgroundColor: "#111", padding: 14, borderRadius: 12, alignItems: "center" } as const;
const ghost = { backgroundColor: "transparent", borderWidth: 1, borderColor: "#111" } as const;
const btnText = { color: "white", fontWeight: "700" } as const;
