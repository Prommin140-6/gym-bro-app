import React from "react";
import { View } from "react-native";
import { COLORS } from "../../theme/colors";
import { RADIUS } from "../../theme/radius";

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: any;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: COLORS.surface,
          borderRadius: RADIUS.lg,
          borderWidth: 1,
          borderColor: COLORS.border,
          padding: 14,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
