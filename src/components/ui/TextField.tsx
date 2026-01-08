import React from "react";
import { View, Text, TextInput } from "react-native";
import { COLORS } from "../../theme/colors";
import { RADIUS } from "../../theme/radius";

export function TextField(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "email-address" | "numeric";
  secureTextEntry?: boolean;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: COLORS.text, fontWeight: "900" }}>{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChange}
        placeholder={props.placeholder}
        placeholderTextColor={COLORS.subtext}
        keyboardType={props.keyboardType ?? "default"}
        secureTextEntry={props.secureTextEntry}
        style={{
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: RADIUS.md,
          padding: 12,
          backgroundColor: COLORS.surface2,
          color: COLORS.text,
          fontWeight: "800",
        }}
      />
    </View>
  );
}
