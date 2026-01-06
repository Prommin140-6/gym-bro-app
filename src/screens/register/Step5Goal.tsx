import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RegisterWizardParamList } from "../../navigation/RegisterWizardStack";
import { WizardProgress } from "../../components/WizardProgress";
import { useOnboarding } from "../../services/OnboardingContext";

type Props = NativeStackScreenProps<RegisterWizardParamList, "Step5Goal">;

const OPTIONS = [
  { key: "gain_weight", label: "เพิ่มน้ำหนัก" },
  { key: "lose_weight", label: "ลดน้ำหนัก" },
  { key: "maintain_weight", label: "คงน้ำหนัก" },
  { key: "maintain_muscle", label: "คงไว้ซึ่งกล้ามเนื้อ" },
] as const;

export default function Step5Goal({ navigation }: Props) {
  const { draft, setDraft } = useOnboarding();
  const [error, setError] = useState<string | null>(null);

  const next = () => {
    if (!draft.goal) return setError("กรุณาเลือกเป้าหมาย 1 ข้อ");
    setError(null);
    navigation.navigate("Step6Summary");
  };

  return (
    <View style={{ flex: 1, padding: 16, justifyContent: "center", gap: 12 }}>
      <WizardProgress step={5} total={6} />
      <Text style={{ fontSize: 24, fontWeight: "800" }}>Goal</Text>

      {OPTIONS.map((o) => {
        const selected = draft.goal === o.key;
        return (
          <Pressable
            key={o.key}
            onPress={() => setDraft((d) => ({ ...d, goal: o.key }))}
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
