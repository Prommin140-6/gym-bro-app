import React from "react";
import { View, Text, Image, ImageSourcePropType } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { COLORS } from "../theme/colors";

function clamp01(n: number) {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

/** Lighten/Darken a hex color (#RRGGBB) by amount (-1..1) */
function shiftHex(hex: string, amount: number) {
  const h = (hex || "").trim();
  if (!/^#?[0-9a-fA-F]{6}$/.test(h)) return hex; // if not hex, just return as-is
  const clean = h.startsWith("#") ? h.slice(1) : h;

  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);

  const clamp255 = (x: number) => Math.max(0, Math.min(255, x));
  const mix = (c: number) => {
    // amount > 0 => toward 255, amount < 0 => toward 0
    const target = amount >= 0 ? 255 : 0;
    return clamp255(Math.round(c + (target - c) * Math.min(1, Math.abs(amount))));
  };

  const rr = mix(r).toString(16).padStart(2, "0");
  const gg = mix(g).toString(16).padStart(2, "0");
  const bb = mix(b).toString(16).padStart(2, "0");
  return `#${rr}${gg}${bb}`;
}

export function MacroRing(props: {
  title: string;
  valueText: string;
  progress: number; // 0..1+
  size?: number;
  strokeWidth?: number;
  icon?: ImageSourcePropType;
  color?: string; // สี base ของวง
}) {
  const size = props.size ?? 78;
  const stroke = props.strokeWidth ?? 12;

  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = clamp01(props.progress);
  const dashOffset = c * (1 - p);

  const base = props.color ?? COLORS.primary;

  // ✅ ทำไล่เฉดอัตโนมัติจาก base (ให้ใกล้ feeling เดียวกับ CalToday)
  const gradA = shiftHex(base, 0.35); // สว่างขึ้น
  const gradB = shiftHex(base, -0.10); // เข้มลงนิดนึง

  // ✅ gradient id ต้องไม่ซ้ำกันในหน้าเดียวกัน
  const gradId = `macroRingGrad_${String(props.title || "x")
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")}`;

  return (
    <View style={{ alignItems: "center", width: size + 12 }}>
      <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
        <Svg width={size} height={size}>
          <Defs>
            <LinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={gradA} stopOpacity={1} />
              <Stop offset="60%" stopColor={base} stopOpacity={1} />
              <Stop offset="100%" stopColor={gradB} stopOpacity={1} />
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

          {/* progress (gradient) */}
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
