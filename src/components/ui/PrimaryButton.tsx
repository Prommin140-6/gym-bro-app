import React from "react";
import { Pressable, Text } from "react-native";
import { COLORS } from "../../theme/colors";
import { RADIUS } from "../../theme/radius";

export function PrimaryButton({
  title,
  onPress,
  disabled,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        borderRadius: RADIUS.md,
        alignItems: "center",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <Text style={{ color: COLORS.text, fontWeight: "900", fontSize: 16 }}>
        {title}
      </Text>
    </Pressable>
  );
}
