import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, Image } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RegisterWizardParamList } from "../../navigation/RegisterWizardStack";
import { WizardProgress } from "../../components/WizardProgress";
import { useOnboarding } from "../../services/OnboardingContext";

type Props = NativeStackScreenProps<RegisterWizardParamList, "Step3BodyFat">;

type BodyFatOption = {
  key: "bf10" | "bf20" | "bf25" | "bf30" | "bf40plus";
  label: string;          // แสดงใต้รูป เช่น "10%" หรือ "40%+"
  value: number;          // ค่าเก็บจริง (เราจะเก็บ 40 สำหรับ 40%+)
  image: any;             // require(...)
};

const OPTIONS: BodyFatOption[] = [
  { key: "bf10", label: "10%", value: 10, image: require("../../../assets/bodyfat/bf10.png") },
  { key: "bf20", label: "20%", value: 20, image: require("../../../assets/bodyfat/bf20.png") },
  { key: "bf25", label: "25%", value: 25, image: require("../../../assets/bodyfat/bf25.png") },
  { key: "bf30", label: "30%", value: 30, image: require("../../../assets/bodyfat/bf30.png") },
  { key: "bf40plus", label: "40%+", value: 40, image: require("../../../assets/bodyfat/bf40plus.png") },
];

export default function Step3BodyFat({ navigation }: Props) {
  const { draft, setDraft } = useOnboarding();
  const [error, setError] = useState<string | null>(null);

  const next = () => {
    if (draft.bodyFatPercent == null) return setError("กรุณาเลือก body fat 1 ค่า");
    setError(null);
    navigation.navigate("Step4ExerciseStyle");
  };

  return (
    <View style={{ flex: 1 }}>
      <WizardProgress step={3} total={6} />

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text style={{ fontSize: 24, fontWeight: "800" }}>Body Fat</Text>
        <Text>เลือก 1 ค่า</Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {OPTIONS.map((o) => {
            const selected = draft.bodyFatPercent === o.value;

            return (
              <Pressable
                key={o.key}
                onPress={() => setDraft((d) => ({ ...d, bodyFatPercent: o.value }))}
                style={{
                  width: "48%",
                  borderWidth: 2,
                  borderColor: selected ? "#111" : "#ddd",
                  borderRadius: 14,
                  padding: 10,
                  gap: 8,
                  backgroundColor: "white",
                }}
              >
                <Image
                  source={o.image}
                  style={{ width: "100%", height: 140, borderRadius: 12 }}
                  resizeMode="cover"
                />

                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ fontWeight: "800", fontSize: 16 }}>{o.label}</Text>
                  {selected ? (
                    <View
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 999,
                        backgroundColor: "#111",
                      }}
                    >
                      <Text style={{ color: "white", fontWeight: "800", fontSize: 12 }}>Selected</Text>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        {error ? <Text style={{ color: "#d00" }}>{error}</Text> : null}

        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable onPress={() => navigation.goBack()} style={[btn, ghost]}>
            <Text style={[btnText, { color: "#111" }]}>Back</Text>
          </Pressable>
          <Pressable onPress={next} style={btn}>
            <Text style={btnText}>Next</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const btn = { flex: 1, backgroundColor: "#111", padding: 14, borderRadius: 12, alignItems: "center" } as const;
const ghost = { backgroundColor: "transparent", borderWidth: 1, borderColor: "#111" } as const;
const btnText = { color: "white", fontWeight: "700" } as const;
