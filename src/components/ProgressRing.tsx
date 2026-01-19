// src/components/ProgressRing.tsx
import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
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
  if (!/^#?[0-9a-fA-F]{6}$/.test(h)) return hex;
  const clean = h.startsWith("#") ? h.slice(1) : h;

  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);

  const clamp255 = (x: number) => Math.max(0, Math.min(255, x));
  const mix = (c: number) => {
    const target = amount >= 0 ? 255 : 0;
    return clamp255(Math.round(c + (target - c) * Math.min(1, Math.abs(amount))));
  };

  const rr = mix(r).toString(16).padStart(2, "0");
  const gg = mix(g).toString(16).padStart(2, "0");
  const bb = mix(b).toString(16).padStart(2, "0");
  return `#${rr}${gg}${bb}`;
}

export type ProgressRingProps = {
  /** 0..1+ (will be clamped to 0..1 for rendering) */
  progress: number;

  /** (legacy) outside labels */
  labelTop?: string;
  labelBottom?: string;

  /** center big number */
  centerValue?: string;

  /** ✅ NEW: texts inside the ring (top + bottom inside circle) */
  insideTop?: string;
  insideBottom?: string;

  /** ring size in px */
  size?: number;
  /** ring thickness */
  strokeWidth?: number;

  /** base ring color when not danger */
  color?: string;

  /**
   * ✅ Danger rule: if value >= target + dangerOverBy -> ring turns COLORS.danger
   * - optional for backward compatibility
   */
  value?: number;
  target?: number;
  dangerOverBy?: number; // default 100
};

export function ProgressRing({
  progress,
  labelTop,
  labelBottom,
  centerValue,
  insideTop,
  insideBottom,
  size = 172,
  strokeWidth = 14,
  color = COLORS.primary,
  value,
  target,
  dangerOverBy = 100,
}: ProgressRingProps) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;

  const p = clamp01(progress);
  const dashOffset = c * (1 - p);

  const isDanger = useMemo(() => {
    const v = Number(value);
    const t = Number(target);
    if (!Number.isFinite(v) || !Number.isFinite(t) || t <= 0) return false;
    return v >= t + Number(dangerOverBy ?? 100);
  }, [value, target, dangerOverBy]);

  const base = isDanger ? COLORS.danger : color;

  // Gradient (subtle premium look) — unique id per mount
  const gradId = useMemo(() => `prg_${Math.random().toString(36).slice(2, 9)}`, []);
  const gradA = shiftHex(base, 0.35);
  const gradB = shiftHex(base, -0.1);

  return (
    <View style={styles.wrap}>
      {/* outside top label (optional) */}
      {labelTop ? (
        <Text style={styles.labelTop} numberOfLines={1}>
          {labelTop}
        </Text>
      ) : null}

      <View style={[styles.ringBox, { width: size, height: size }]}>
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
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* progress */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={isDanger ? COLORS.danger : `url(#${gradId})`}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${c} ${c}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            rotation="-90"
            originX={size / 2}
            originY={size / 2}
          />
        </Svg>

        {/* ✅ Inside texts (always centered correctly) */}
        <View pointerEvents="none" style={styles.centerOverlay}>
          {insideTop ? (
            <Text style={styles.insideTop} numberOfLines={1}>
              {insideTop}
            </Text>
          ) : null}

          {centerValue ? (
            <Text style={styles.centerValue} numberOfLines={1} adjustsFontSizeToFit>
              {centerValue}
            </Text>
          ) : null}

          {insideBottom ? (
            <Text style={styles.insideBottom} numberOfLines={1}>
              {insideBottom}
            </Text>
          ) : null}
        </View>
      </View>

      {/* outside bottom label (optional) */}
      {labelBottom ? (
        <Text style={styles.labelBottom} numberOfLines={1}>
          {labelBottom}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  ringBox: {
    alignItems: "center",
    justifyContent: "center",
  },
  centerOverlay: {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  insideTop: {
    color: COLORS.subtext,
    fontWeight: "900",
    fontSize: 12,
    marginBottom: 8,
    textAlign: "center",
  },
  centerValue: {
    color: COLORS.text,
    fontSize: 44,
    fontWeight: "900",
    textAlign: "center",
  },
  insideBottom: {
    color: COLORS.subtext,
    fontWeight: "900",
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
  },
  labelTop: {
    color: COLORS.subtext,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 10,
  },
  labelBottom: {
    color: COLORS.subtext,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 10,
  },
});
