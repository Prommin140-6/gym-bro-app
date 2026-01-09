import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../../theme/colors";

export function Screen({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: COLORS.bg }}
    >
      {children}
    </SafeAreaView>
  );
}
