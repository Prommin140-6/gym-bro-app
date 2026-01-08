import React from "react";
import { View, Text } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { COLORS } from "../theme/colors";

function clamp01(n: number) {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

export function ProgressRing(props: {
  progress: number; // 0..1
  centerValue: string;
  labelTop: string;
  labelBottom: string;
  size?: number;
  stroke?: number;
}) {
  const size = props.size ?? 190;
  const stroke = props.stroke ?? 16;

  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = clamp01(props.progress);
  const dashOffset = c * (1 - p);

  const gradId = "gradProgress";

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={COLORS.primary} />
            <Stop offset="1" stopColor={COLORS.accent} />
          </LinearGradient>
        </Defs>

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
          stroke={`url(#${gradId})`}
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

      <View style={{ position: "absolute", alignItems: "center", gap: 2 }}>
        <Text style={{ fontSize: 12, color: COLORS.subtext, fontWeight: "800" }}>
          {props.labelTop}
        </Text>
        <Text style={{ fontSize: 38, fontWeight: "900", color: COLORS.text }}>
          {props.centerValue}
        </Text>
        <Text style={{ fontSize: 12, color: COLORS.subtext, fontWeight: "800" }}>
          {props.labelBottom}
        </Text>
      </View>
    </View>
  );
}
