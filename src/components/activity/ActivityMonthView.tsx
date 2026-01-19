import React, { useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";

import { Card } from "../../components/ui/Card";
import { COLORS } from "../../theme/colors";
import type { DailySummaryDoc } from "../../services/firestoreDailySummary";

/** ===== Today highlight color (GREEN) ===== */
const TODAY_GREEN = "#22c55e"; // emerald green

// ✅ threshold: over target by 100 -> danger
const DANGER_OVER_BY = 100;

function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function toDateKey(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function clamp01(n: number) {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

/** ===== Progress Ring ===== */
function DayRing(props: {
  progress: number; // 0..1
  rest?: boolean;
  danger?: boolean; // ✅ NEW
  size?: number;
  stroke?: number;
}) {
  const size = props.size ?? 40;
  const stroke = props.stroke ?? 4;

  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = clamp01(props.progress);
  const dashOffset = c * (1 - p);

  const track = COLORS.border;

  const active = props.rest
    ? "#666666"
    : props.danger
    ? COLORS.danger
    : COLORS.primary;

  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={track}
        strokeWidth={stroke}
        fill="none"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={active}
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
  );
}

export function ActivityMonthView(props: {
  baseDate: Date;
  monthDocs: Record<string, DailySummaryDoc>;
  loading?: boolean;
  now?: Date;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  onSelectDay?: (dateKey: string) => void;
}) {
  const now = props.now ?? new Date();

  const monthStart = useMemo(() => {
    const d = new Date(props.baseDate);
    d.setHours(0, 0, 0, 0);
    d.setDate(1);
    return d;
  }, [props.baseDate]);

  const daysInMonth = useMemo(() => {
    const d = new Date(monthStart);
    d.setMonth(d.getMonth() + 1, 0);
    return d.getDate();
  }, [monthStart]);

  const firstDow = useMemo(() => monthStart.getDay(), [monthStart]); // 0=Sun

  const monthTitle = useMemo(() => {
    return monthStart.toLocaleString("en-US", { month: "long", year: "numeric" });
  }, [monthStart]);

  const cells = useMemo(() => {
    const out: Array<
      | { type: "empty"; key: string }
      | {
          type: "day";
          key: string;
          date: Date;
          dateKey: string;
          day: number;
          summary: DailySummaryDoc | null;
        }
    > = [];

    for (let i = 0; i < firstDow; i++) out.push({ type: "empty", key: `e-${i}` });

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(monthStart);
      date.setDate(day);
      const dateKey = toDateKey(date);
      const summary = props.monthDocs[dateKey] ?? null;
      out.push({ type: "day", key: dateKey, date, dateKey, day, summary });
    }

    return out;
  }, [firstDow, daysInMonth, monthStart, props.monthDocs]);

  const monthTotalBurned = useMemo(() => {
    return Object.values(props.monthDocs ?? {}).reduce((sum, s) => {
      const v = Number((s as any)?.totalBurnedCalories ?? 0);
      return sum + (Number.isFinite(v) ? v : 0);
    }, 0);
  }, [props.monthDocs]);

  return (
    <Card>
      {/* ===== Header ===== */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Pressable
          onPress={props.onPrevMonth}
          hitSlop={10}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: COLORS.surface2,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <Ionicons name="chevron-back" size={18} color={COLORS.text} />
        </Pressable>

        <View style={{ alignItems: "center" }}>
          <Text style={{ color: COLORS.subtext, fontWeight: "800" }}>this month</Text>
          <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: "900", marginTop: 2 }}>
            {monthTitle}
          </Text>
        </View>

        <Pressable
          onPress={props.onNextMonth}
          hitSlop={10}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: COLORS.surface2,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <Ionicons name="chevron-forward" size={18} color={COLORS.text} />
        </Pressable>
      </View>

      <Text style={{ color: COLORS.subtext, marginTop: 10, fontWeight: "800" }}>
        total burned:{" "}
        <Text style={{ color: COLORS.text, fontWeight: "900" }}>
          {Math.round(monthTotalBurned).toLocaleString()} kcal
        </Text>
      </Text>

      {props.loading ? (
        <Text style={{ color: COLORS.subtext, marginTop: 8, fontWeight: "800" }}>
          loading...
        </Text>
      ) : null}

      {/* weekday labels */}
      <View style={{ flexDirection: "row", marginTop: 14, paddingHorizontal: 2 }}>
        {["su", "mo", "tu", "we", "th", "fr", "sa"].map((x) => (
          <Text
            key={x}
            style={{
              flex: 1,
              textAlign: "center",
              color: COLORS.subtext,
              fontWeight: "900",
              fontSize: 12,
            }}
          >
            {x}
          </Text>
        ))}
      </View>

      {/* ===== Grid ===== */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 10 }}>
        {cells.map((c) => {
          if (c.type === "empty") {
            return <View key={c.key} style={{ width: "14.2857%", height: 64 }} />;
          }

          const s = c.summary;
          const burned = Number((s as any)?.totalBurnedCalories ?? 0);
          const target = Number((s as any)?.burnTarget ?? 0);
          const rest = Boolean((s as any)?.restDay ?? false);

          const progress = target > 0 ? Math.min(burned / target, 1) : 0;
          const today = isSameDay(c.date, now);

          const danger = !rest && target > 0 && burned >= target + DANGER_OVER_BY;

          return (
            <Pressable
              key={c.key}
              onPress={() => props.onSelectDay?.(c.dateKey)}
              style={{
                width: "14.2857%",
                height: 64,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View style={{ alignItems: "center" }}>
                {/* ===== Today ring (GREEN) ===== */}
                <View
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 23,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: today ? 2 : 1,
                    borderColor: today ? TODAY_GREEN : COLORS.border,
                  }}
                >
                  {/* Progress ring */}
                  <DayRing progress={progress} rest={rest} danger={danger} size={40} stroke={4} />

                  {/* Day number */}
                  <View style={{ position: "absolute", alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ color: COLORS.text, fontWeight: "900", fontSize: 13 }}>
                      {c.day}
                    </Text>
                  </View>
                </View>

                {/* ===== Today dot (GREEN) ===== */}
                {today ? (
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 99,
                      marginTop: 6,
                      backgroundColor: TODAY_GREEN,
                      opacity: 0.95,
                    }}
                  />
                ) : (
                  <View style={{ height: 12 }} />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      <Text style={{ color: COLORS.subtext, marginTop: 12, lineHeight: 18 }}>
        Tip: tap a day to see its logs & summary.
      </Text>
    </Card>
  );
}
