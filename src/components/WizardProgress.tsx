import React from "react";
import { View, Text } from "react-native";

export function WizardProgress({ step, total }: { step: number; total: number }) {
  const pct = Math.round((step / total) * 100);
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 12, gap: 8 }}>
      <Text style={{ fontWeight: "700" }}>
        Step {step}/{total} ({pct}%)
      </Text>
      <View style={{ height: 8, backgroundColor: "#ddd", borderRadius: 999 }}>
        <View
          style={{
            height: 8,
            width: `${pct}%`,
            backgroundColor: "#111",
            borderRadius: 999,
          }}
        />
      </View>
    </View>
  );
}
