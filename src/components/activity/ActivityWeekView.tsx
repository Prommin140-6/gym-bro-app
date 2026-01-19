import React from "react";
import { View, Text, Pressable } from "react-native";
import { Card } from "../../components/ui/Card";
import { COLORS } from "../../theme/colors";
import type { DayItem } from "../../hooks/useActivityPeriod";
import { Ionicons } from "@expo/vector-icons";

function dayLabel(d: Date) {
  return ["su", "mo", "tu", "we", "th", "fr", "sa"][d.getDay()] ?? "";
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function ActivityWeekView(props: {
  weekDays: DayItem[];
  weekTotalBurned: number;
  streak: number;
  now?: Date;
  onSelectDay?: (dateKey: string) => void;
}) {
  const now = props.now ?? new Date();

  // fixed track height in px
  const MAX_BAR_H = 170;

  // ✅ threshold: over target by 100 -> danger
  const DANGER_OVER_BY = 100;

  return (
    <Card>
      {/* ---------- Header ---------- */}
      <Text style={{ color: COLORS.subtext, fontWeight: "800" }}>this week</Text>
      <Text style={{ color: COLORS.text, fontSize: 34, fontWeight: "900", marginTop: 4 }}>
        {Math.round(props.weekTotalBurned).toLocaleString()}
      </Text>

      {/* ---------- Bar chart ---------- */}
      <View
        style={{
          marginTop: 14,
          paddingTop: 8,
          paddingBottom: 4,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "flex-end", height: 210 }}>
          {props.weekDays.map((d) => {
            const burned = Number(d.summary?.totalBurnedCalories ?? 0);
            const burnTarget = Number(d.summary?.burnTarget ?? 0);

            const rest = Boolean(d.summary?.restDay ?? false);
            const today = isSameDay(d.date, now);

            // progress ratio based on target (cap 100%)
            const ratio = burnTarget > 0 ? Math.min(burned / burnTarget, 1) : 0;
            const h = Math.max(0, Math.round(ratio * MAX_BAR_H)); // allow 0 (no progress)

            const isDanger =
              !rest && burnTarget > 0 && burned >= burnTarget + DANGER_OVER_BY;

            const fillColor = rest ? "#666666" : isDanger ? COLORS.danger : COLORS.primary;

            return (
              <Pressable
                key={d.dateKey}
                onPress={() => props.onSelectDay?.(d.dateKey)}
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "flex-end",
                }}
              >
                {/* value */}
                <Text style={{ color: COLORS.subtext, fontWeight: "900", fontSize: 11 }}>
                  {burned > 0 ? Math.round(burned) : ""}
                </Text>

                {/* bar: track + progress */}
                <View
                  style={{
                    width: 22,
                    height: MAX_BAR_H,
                    borderRadius: 14,
                    marginTop: 6,
                    backgroundColor: "#6f6f6f", // track
                    overflow: "hidden",
                    justifyContent: "flex-end",
                  }}
                >
                  {/* progress fill */}
                  <View
                    style={{
                      width: "100%",
                      height: h,
                      backgroundColor: fillColor,
                      borderRadius: 14,
                    }}
                  />
                </View>

                {/* today dot */}
                <View style={{ height: 16, marginTop: 6, alignItems: "center" }}>
                  {today ? (
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: "#ffffff",
                      }}
                    />
                  ) : null}
                </View>

                {/* label */}
                <Text style={{ color: COLORS.subtext, fontWeight: "900", fontSize: 11 }}>
                  {dayLabel(d.date)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ---------- Bottom stats ---------- */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 14 }}>
        <View style={{ alignItems: "center", flex: 1 }}>
          <Ionicons name="flame-outline" size={20} color={COLORS.subtext} />
          <Text style={{ color: COLORS.text, fontWeight: "900", marginTop: 4 }}>
            {Math.round(props.weekTotalBurned)} kcal
          </Text>
        </View>

        <View style={{ alignItems: "center", flex: 1 }}>
          <Ionicons name="arrow-forward-outline" size={18} color={COLORS.subtext} />
          <Text style={{ color: COLORS.subtext, fontWeight: "900", marginTop: 4 }}>
            coming soon
          </Text>
        </View>

        <View style={{ alignItems: "center", flex: 1 }}>
          <Ionicons name="flame-outline" size={20} color={COLORS.subtext} />
          <Text style={{ color: COLORS.text, fontWeight: "900", marginTop: 4 }}>
            streak {props.streak}
          </Text>
        </View>
      </View>
    </Card>
  );
}
