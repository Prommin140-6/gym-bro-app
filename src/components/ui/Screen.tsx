import React from "react";
import { View } from "react-native";
import { COLORS } from "../../theme/colors";

export function Screen({ children }: { children: React.ReactNode }) {
  return <View style={{ flex: 1, backgroundColor: COLORS.bg }}>{children}</View>;
}
