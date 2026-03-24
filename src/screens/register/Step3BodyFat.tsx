import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, Image, FlatList } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RegisterWizardParamList } from "../../navigation/RegisterWizardStack";

import { WizardProgress } from "../../components/WizardProgress";
import { Screen } from "../../components/ui/Screen";
import { Card } from "../../components/ui/Card";
import { PrimaryButton } from "../../components/ui/PrimaryButton";

import { useOnboarding } from "../../services/OnboardingContext";
import { COLORS } from "../../theme/colors";

type Props = NativeStackScreenProps<RegisterWizardParamList, "Step3BodyFat">;

type BodyFatOption = {
  key: "bf10" | "bf20" | "bf25" | "bf30" | "bf40plus";
  label: string;
  value: number;
  image: any;
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

  // ✅ Add spacer if odd number of items to keep [40%+] on left side
  const optionsWithSpacer = OPTIONS.length % 2 === 1 
    ? [...OPTIONS, { key: "spacer", label: "", value: null, image: null, isSpacer: true } as any]
    : OPTIONS;

  const onNext = () => {
    if (draft.bodyFatPercent == null) {
      setError("Please select one option");
      return;
    }
    setError(null);
    navigation.navigate("Step4ExerciseStyle");
  };

  return (
    <Screen>
      <View style={{ flex: 1 }}>
        <WizardProgress step={3} total={6} />

        <ScrollView
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 24,
            gap: 14,
          }}
        >
          <View style={{ gap: 4 }}>
            <Text style={{ color: COLORS.text, fontSize: 26, fontWeight: "900" }}>
              Body Fat
            </Text>
            <Text style={{ color: COLORS.subtext, fontWeight: "700" }}>
              Choose the closest match
            </Text>
          </View>

          <Card style={{ gap: 12 }}>
            <FlatList
              scrollEnabled={false}
              data={optionsWithSpacer}
              numColumns={2}
              columnWrapperStyle={{ gap: 12, justifyContent: "flex-start" }}
              renderItem={({ item: o }) => {
                // ✅ Render empty spacer if this is the spacer item
                if ((o as any).isSpacer) {
                  return <View style={{ flex: 1 }} />;
                }

                const selected = draft.bodyFatPercent === o.value;

                return (
                  <Pressable
                    key={o.key}
                    onPress={() => setDraft((d) => ({ ...d, bodyFatPercent: o.value }))}
                    style={{
                      flex: 1,
                      borderWidth: 2,
                      borderColor: selected ? COLORS.primary : COLORS.border, // ✅ กรอบ primary ตอนเลือก
                      backgroundColor: COLORS.surface2,
                      borderRadius: 16,
                      padding: 10,
                      gap: 10,
                    }}
                  >
                    <View style={{ borderRadius: 14, overflow: "hidden" }}>
                      <Image source={o.image} style={{ width: "100%", height: 140 }} resizeMode="cover" />
                    </View>

                    {/* ✅ label ใต้รูป ตรงกลาง */}
                    <Text
                      style={{
                        color: COLORS.text,
                        fontWeight: "900",
                        fontSize: 16,
                        textAlign: "center",
                      }}
                    >
                      {o.label}
                    </Text>
                  </Pressable>
                );
              }}
              keyExtractor={(item) => item.key}
            />

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
        </ScrollView>
      </View>
    </Screen>
  );
}
