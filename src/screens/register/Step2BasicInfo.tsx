import React, { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RegisterWizardParamList } from "../../navigation/RegisterWizardStack";
import { WizardProgress } from "../../components/WizardProgress";
import { useOnboarding } from "../../services/OnboardingContext";

type Props = NativeStackScreenProps<RegisterWizardParamList, "Step2BasicInfo">;

export default function Step2BasicInfo({ navigation }: Props) {
  const { draft, setDraft } = useOnboarding();
  const [error, setError] = useState<string | null>(null);

  const validate = () => {
    if (!draft.sex) return "กรุณาเลือกเพศ";
    const h = Number(draft.heightCm);
    const w = Number(draft.weightKg);
    const a = Number(draft.age);
    if (!h || h < 120 || h > 230) return "ส่วนสูงไม่ถูกต้อง (120–230 cm)";
    if (!w || w < 30 || w > 250) return "น้ำหนักไม่ถูกต้อง (30–250 kg)";
    if (!a || a < 10 || a > 100) return "อายุไม่ถูกต้อง (10–100)";
    return null;
  };

  const next = () => {
    const v = validate();
    if (v) return setError(v);
    setError(null);
    navigation.navigate("Step3BodyFat");
  };

  return (
    <View style={{ flex: 1, padding: 16, justifyContent: "center", gap: 10 }}>
      <WizardProgress step={2} total={6} />
      <Text style={{ fontSize: 24, fontWeight: "800" }}>Basic Info</Text>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <Pressable
          onPress={() => setDraft((d) => ({ ...d, sex: "male" }))}
          style={[pill, draft.sex === "male" && pillActive]}
        >
          <Text style={draft.sex === "male" ? pillTextActive : pillText}>ชาย</Text>
        </Pressable>
        <Pressable
          onPress={() => setDraft((d) => ({ ...d, sex: "female" }))}
          style={[pill, draft.sex === "female" && pillActive]}
        >
          <Text style={draft.sex === "female" ? pillTextActive : pillText}>หญิง</Text>
        </Pressable>
      </View>

      <TextInput
        placeholder="ส่วนสูง (cm)"
        keyboardType="numeric"
        value={draft.heightCm}
        onChangeText={(t) => setDraft((d) => ({ ...d, heightCm: t.replace(/[^\d]/g, "") }))}
        style={input}
      />
      <TextInput
        placeholder="น้ำหนัก (kg)"
        keyboardType="numeric"
        value={draft.weightKg}
        onChangeText={(t) => setDraft((d) => ({ ...d, weightKg: t.replace(/[^\d]/g, "") }))}
        style={input}
      />
      <TextInput
        placeholder="อายุ"
        keyboardType="numeric"
        value={draft.age}
        onChangeText={(t) => setDraft((d) => ({ ...d, age: t.replace(/[^\d]/g, "") }))}
        style={input}
      />

      {error ? <Text style={{ color: "#d00" }}>{error}</Text> : null}

      <View style={{ flexDirection: "row", gap: 10 }}>
        <Pressable onPress={() => navigation.goBack()} style={[btn, btnGhost]}>
          <Text style={[btnText, { color: "#111" }]}>Back</Text>
        </Pressable>
        <Pressable onPress={next} style={[btn, { flex: 1 }]}>
          <Text style={btnText}>Next</Text>
        </Pressable>
      </View>
    </View>
  );
}

const input = { borderWidth: 1, borderColor: "#999", borderRadius: 10, padding: 12, fontSize: 16 } as const;
const btn = { flex: 1, backgroundColor: "#111", padding: 14, borderRadius: 12, alignItems: "center" } as const;
const btnGhost = { backgroundColor: "transparent", borderWidth: 1, borderColor: "#111" } as const;
const btnText = { color: "white", fontWeight: "700" } as const;

const pill = { flex: 1, borderWidth: 1, borderColor: "#111", borderRadius: 999, padding: 12, alignItems: "center" } as const;
const pillActive = { backgroundColor: "#111" } as const;
const pillText = { color: "#111", fontWeight: "700" } as const;
const pillTextActive = { color: "white", fontWeight: "700" } as const;
