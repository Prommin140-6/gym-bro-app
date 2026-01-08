import React from "react";
import { View, Text, Image, ImageSourcePropType } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { COLORS } from "../theme/colors";

function clamp01(n: number) {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

export function MacroRing(props: {
  title: string;
  valueText: string;
  progress: number; // 0..1+
  size?: number;
  strokeWidth?: number;
  icon?: ImageSourcePropType; // image icon
}) {
  const size = props.size ?? 78;          // ✅ smaller
  const stroke = props.strokeWidth ?? 12; // ✅ thicker

  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = clamp01(props.progress);
  const dashOffset = c * (1 - p);

  return (
    <View style={{ alignItems: "center", width: size + 12 }}>
      <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
        <Svg width={size} height={size}>
          {/* track */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={COLORS.border}
            strokeWidth={stroke}
            fill="none"
          />

          {/* progress */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={COLORS.accent}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${c} ${c}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            rotation="-90"
            originX={size / 2}
            originY={size / 2}
          />
        </Svg>

        {/* icon */}
        {props.icon && (
          <Image
            source={props.icon}
            style={{ position: "absolute", width: 22, height: 22 }}
            resizeMode="contain"
          />
        )}
      </View>

      <Text
        style={{
          marginTop: 6,
          color: COLORS.text,
          fontWeight: "900",
          textTransform: "lowercase",
          fontSize: 12,
        }}
      >
        {props.title}
      </Text>

      <Text style={{ color: COLORS.subtext, fontSize: 11, fontWeight: "800" }}>
        {props.valueText}
      </Text>
    </View>
  );
}
