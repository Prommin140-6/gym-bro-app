import React from "react";
import { View, Text } from "react-native";
import { COLORS } from "../theme/colors";
import { RADIUS } from "../theme/radius";

type Props = {
  step: number;
  total: number;
};

export function WizardProgress({ step, total }: Props) {
  const progress = step / total;

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
      {/* label */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <Text
          style={{
            color: COLORS.text, // ✅ ขาว
            fontWeight: "800",
            fontSize: 14,
          }}
        >
          Step {step} of {total}
        </Text>

        <Text
          style={{
            color: COLORS.text, // ✅ ขาว
            fontWeight: "800",
            fontSize: 14,
          }}
        >
          {Math.round(progress * 100)}%
        </Text>
      </View>

      {/* progress track */}
      <View
        style={{
          height: 8,
          backgroundColor: COLORS.surface2, // 🔹 ตัดกับ bg ชัดขึ้น
          borderRadius: RADIUS.sm,
          overflow: "hidden",
        }}
      >
        {/* progress bar */}
        <View
          style={{
            height: "100%",
            width: `${progress * 100}%`,
            backgroundColor: COLORS.primary, // ✅ primary
            borderRadius: RADIUS.sm,
          }}
        />
      </View>
    </View>
  );
}
