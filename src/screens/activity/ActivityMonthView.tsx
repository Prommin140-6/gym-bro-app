import React, { useMemo } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../theme/colors";

type Props = {
  baseDate: Date;
  loading: boolean;
  monthDocs: any[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDay: (dateKey: string) => void;

  // ✅ เพิ่ม prop นี้ เพื่อให้ ActivityScreen ส่ง todayKey ได้
  todayKey: string;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function monthTitle(d: Date) {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function startOfMonthGrid(baseDate: Date, weekStartsOnMonday = true) {
  const first = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const day = first.getDay(); // 0 Sun ... 6 Sat
  const offset = weekStartsOnMonday ? (day === 0 ? 6 : day - 1) : day;
  return new Date(first.getFullYear(), first.getMonth(), first.getDate() - offset);
}

function extractDateKeyFromDoc(doc: any): string | null {
  const k =
    doc?.dateKey ??
    doc?.date_key ??
    doc?.dayKey ??
    doc?.day_key ??
    doc?.id ??
    doc?.key ??
    null;

  return typeof k === "string" ? k : null;
}

export function ActivityMonthView(props: Props) {
  const weekStartsOnMonday = true;

  const docMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const doc of props.monthDocs ?? []) {
      const key = extractDateKeyFromDoc(doc);
      if (key) map.set(key, doc);
    }
    return map;
  }, [props.monthDocs]);

  const gridStart = useMemo(
    () => startOfMonthGrid(props.baseDate, weekStartsOnMonday),
    [props.baseDate]
  );

  const cells = useMemo(() => {
    const out: { date: Date; dateKey: string; inMonth: boolean }[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
      out.push({
        date: d,
        dateKey: toDateKey(d),
        inMonth: d.getMonth() === props.baseDate.getMonth(),
      });
    }
    return out;
  }, [gridStart, props.baseDate]);

  const weekLabels = weekStartsOnMonday
    ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <View
      style={{
        backgroundColor: COLORS.surface2,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 18,
        padding: 14,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <Pressable
          onPress={props.onPrevMonth}
          style={{
            width: 40,
            height: 40,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: COLORS.surface,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <Ionicons name="chevron-back" size={18} color={COLORS.text} />
        </Pressable>

        <View style={{ alignItems: "center" }}>
          <Text style={{ color: COLORS.text, fontWeight: "900", fontSize: 16 }}>
            {monthTitle(props.baseDate)}
          </Text>
          <Text style={{ color: COLORS.subtext, fontWeight: "700", fontSize: 12, marginTop: 2 }}>
            Today is highlighted
          </Text>
        </View>

        <Pressable
          onPress={props.onNextMonth}
          style={{
            width: 40,
            height: 40,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: COLORS.surface,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <Ionicons name="chevron-forward" size={18} color={COLORS.text} />
        </Pressable>
      </View>

      {/* Weekday labels */}
      <View style={{ flexDirection: "row", marginBottom: 8 }}>
        {weekLabels.map((w) => (
          <View key={w} style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ color: COLORS.subtext, fontWeight: "900", fontSize: 11 }}>
              {w}
            </Text>
          </View>
        ))}
      </View>

      {props.loading ? (
        <View style={{ paddingVertical: 22, alignItems: "center" }}>
          <ActivityIndicator />
        </View>
      ) : (
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {cells.map(({ date, dateKey, inMonth }) => {
            const isToday = dateKey === props.todayKey;
            const doc = docMap.get(dateKey);

            const success = Boolean(doc?.success ?? doc?.isSuccess ?? doc?.done ?? false);
            const restDay = Boolean(doc?.restDay ?? doc?.isRestDay ?? false);
            const hasAnyLog = doc != null;

            return (
              <View key={dateKey} style={{ width: `${100 / 7}%`, paddingVertical: 10 }}>
                <Pressable onPress={() => props.onSelectDay(dateKey)} style={{ alignItems: "center" }}>
                  {/* Day capsule */}
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 14,
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: inMonth ? 1 : 0.35,

                      // ✅ Today highlight: Ring
                      borderWidth: isToday ? 2 : 1,
                      borderColor: isToday ? COLORS.primary : "transparent",
                      backgroundColor: COLORS.surface,
                    }}
                  >
                    <Text style={{ color: COLORS.text, fontWeight: "900", fontSize: 13 }}>
                      {date.getDate()}
                    </Text>
                  </View>

                  {/* ✅ Today dot */}
                  {isToday ? (
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 99,
                        marginTop: 6,
                        backgroundColor: COLORS.primary,
                        opacity: 0.95,
                      }}
                    />
                  ) : (
                    <View style={{ height: 12 }} />
                  )}

                  {/* Optional status indicator */}
                  {hasAnyLog ? (
                    <View
                      style={{
                        width: 18,
                        height: 4,
                        borderRadius: 99,
                        marginTop: 6,
                        opacity: inMonth ? 1 : 0.6,
                        backgroundColor: restDay
                          ? COLORS.border
                          : success
                          ? COLORS.primary
                          : COLORS.subtext,
                      }}
                    />
                  ) : (
                    <View style={{ height: 10 }} />
                  )}
                </Pressable>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
