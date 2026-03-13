import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import {
  getSdkStatus,
  initialize,
  openHealthConnectSettings,
  requestPermission,
  readRecords,
  SdkAvailabilityStatus,
} from "react-native-health-connect";

import { Screen } from "../components/ui/Screen";
import { Card } from "../components/ui/Card";
import { ProgressRing } from "../components/ProgressRing";
import { ActivityWeekView } from "../components/activity/ActivityWeekView";
import { ActivityMonthView } from "../components/activity/ActivityMonthView";
import type { DayItem } from "../hooks/useActivityPeriod";
import type { DailySummaryDoc } from "../services/firestoreDailySummary";
import { COLORS } from "../theme/colors";

const STEPS_RECORD_TYPE = "Steps" as const;
const STEP_GOAL = 10000;

const formatSteps = (value: number) => value.toLocaleString();

const toDayKey = (date: Date) => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};

const getDayLabel = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, { weekday: "short", day: "numeric" });
};

const formatFullDate = (key: string) => {
  const date = new Date(key);
  // Match Activity screen format: YYYY-MM-DD
  return date.toISOString().slice(0, 10);
};

const getTodayRange = () => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return {
    startTime: start.toISOString(),
    endTime: now.toISOString(),
  };
};

const getDayRange = (key: string) => {
  // Parse YYYY-MM-DD as local date rather than UTC.
  const [year, month, day] = key.split("-").map(Number);
  const start = new Date(year, month - 1, day, 0, 0, 0, 0);
  const end = new Date(year, month - 1, day, 23, 59, 59, 999);
  return {
    startTime: start.toISOString(),
    endTime: end.toISOString(),
  };
};

const getRange = (days: number) => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  return {
    startTime: start.toISOString(),
    endTime: now.toISOString(),
  };
};

const getMonthRange = (base: Date) => {
  const now = new Date();
  const start = new Date(base);
  start.setHours(0, 0, 0, 0);
  start.setDate(1);

  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  // If we're in the current month, cap to now
  if (start.getFullYear() === now.getFullYear() && start.getMonth() === now.getMonth()) {
    return {
      startTime: start.toISOString(),
      endTime: now.toISOString(),
    };
  }

  // end is the first moment of the next month; subtract 1ms for inclusive range
  end.setMilliseconds(end.getMilliseconds() - 1);

  return {
    startTime: start.toISOString(),
    endTime: end.toISOString(),
  };
};

const formatMonthTitle = (date: Date) => {
  return date.toLocaleString(undefined, { month: "long", year: "numeric" });
};

type TabKey = "day" | "week" | "month";

export default function StepsScreen() {
  const [tab, setTab] = useState<TabKey>("day");
  const [steps, setSteps] = useState<number>(0);
  const [stepsByDay, setStepsByDay] = useState<Record<string, number>>({});
  const [dayDetails, setDayDetails] = useState<Record<string, number>>({});
  const [stepGoal, setStepGoal] = useState<number>(STEP_GOAL);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalDraft, setGoalDraft] = useState(String(STEP_GOAL));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const [monthBase, setMonthBase] = useState(() => new Date());

  const loadRange = useCallback(async (range: { startTime: string; endTime: string }) => {
    const result = await readRecords(STEPS_RECORD_TYPE, {
      timeRangeFilter: {
        operator: "between",
        startTime: range.startTime,
        endTime: range.endTime,
      },
    });

    const grouped: Record<string, number> = {};
    result.records.forEach((record) => {
      const key = toDayKey(new Date(record.startTime));
      grouped[key] = (grouped[key] ?? 0) + (record.count ?? 0);
    });

    return grouped;
  }, []);

  const loadSteps = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const sdkStatus = await getSdkStatus();

      if (sdkStatus !== SdkAvailabilityStatus.SDK_AVAILABLE) {
setError("Health Connect is not installed or ready. Please install/update Health Connect.");
        return;
      }

      const initialized = await initialize();
      if (!initialized) {
        setError("Unable to initialize Health Connect. Please try again.");
        return;
      }

      const granted = await requestPermission([
        { accessType: "read", recordType: STEPS_RECORD_TYPE },
      ]);

      const hasStepsPermission = granted.some(
        (p) => p.recordType === STEPS_RECORD_TYPE && p.accessType === "read",
      );

      if (!hasStepsPermission) {
        setHasPermission(false);
        setError("Please grant permission to read steps from Health Connect.");
        return;
      }

      setHasPermission(true);

      const todayRange = getTodayRange();
      const todayGrouped = await loadRange(todayRange);
      const todaySteps = todayGrouped[toDayKey(new Date())] ?? 0;
      setSteps(todaySteps);
      setStepsByDay(todayGrouped);
      setLastUpdated(new Date());
    } catch (e) {
      const message = e instanceof Error ? e.message : "เกิดข้อผิดพลาดไม่ทราบ";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [loadRange]);

  const loadWeek = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const weekRange = getRange(7);
      const weekly = await loadRange(weekRange);
      setStepsByDay(weekly);
      setLastUpdated(new Date());
    } catch (e) {
      const message = e instanceof Error ? e.message : "เกิดข้อผิดพลาดไม่ทราบ";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [loadRange]);

  const loadMonth = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const monthRange = getMonthRange(monthBase);
      const monthly = await loadRange(monthRange);
      setStepsByDay(monthly);
      setLastUpdated(new Date());
    } catch (e) {
      const message = e instanceof Error ? e.message : "เกิดข้อผิดพลาดไม่ทราบ";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [loadRange, monthBase]);

  const loadDaySteps = useCallback(
    async (dateKey: string) => {
      setError(null);
      setLoading(true);

      try {
        const range = getDayRange(dateKey);
        const grouped = await loadRange(range);
        const stepsForDay = grouped[dateKey] ?? 0;
        setDayDetails((prev) => ({ ...prev, [dateKey]: stepsForDay }));
        return stepsForDay;
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        setError(message);
        return 0;
      } finally {
        setLoading(false);
      }
    },
    [loadRange],
  );

  useEffect(() => {
    if (tab === "day") {
      loadSteps();
    } else if (tab === "week") {
      loadWeek();
    } else {
      loadMonth();
    }
  }, [tab, loadSteps, loadWeek, loadMonth]);

  useEffect(() => {
    if (selectedDateKey && !dayDetails[selectedDateKey]) {
      loadDaySteps(selectedDateKey);
    }
  }, [selectedDateKey, dayDetails, loadDaySteps]);

  const handleOpenHealthConnect = useCallback(() => {
    openHealthConnectSettings();
  }, []);

  const buttonLabel = useMemo(() => {
    if (loading) return "Updating...";
    if (!hasPermission) return "Connect Health Connect";
    return "Refresh";
  }, [hasPermission, loading]);

  const buttonStyle: ViewStyle = {
    ...styles.button,
    backgroundColor: hasPermission ? COLORS.primary : COLORS.accent,
  };

  const progress = Math.min(1, steps / stepGoal);
  const remaining = Math.max(0, stepGoal - steps);

  const todayKey = toDayKey(new Date());

  const weekStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const day = d.getDay(); // 0=Sun
    d.setDate(d.getDate() - day);
    return d;
  }, []);

  const weekDays: DayItem[] = useMemo(() => {
    const out: DayItem[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const key = toDayKey(date);
      out.push({
        dateKey: key,
        date,
        summary: {
          totalBurnedCalories: stepsByDay[key] ?? 0,
          totalDistanceKm: 0,
          burnTarget: STEP_GOAL,
          restDay: false,
          success: (stepsByDay[key] ?? 0) >= STEP_GOAL,
        } as DailySummaryDoc,
      });
    }
    return out;
  }, [stepsByDay, weekStart]);

  const weekTotalSteps = useMemo(() => {
    return weekDays.reduce((sum, d) => sum + (d.summary?.totalBurnedCalories ?? 0), 0);
  }, [weekDays]);

  const monthTitle = useMemo(() => formatMonthTitle(monthBase), [monthBase]);

  const monthDocs: Record<string, DailySummaryDoc> = useMemo(() => {
    const out: Record<string, DailySummaryDoc> = {};
    Object.entries(stepsByDay).forEach(([key, value]) => {
      out[key] = {
        totalBurnedCalories: value,
        totalDistanceKm: 0,
        burnTarget: STEP_GOAL,
        restDay: false,
        success: value >= STEP_GOAL,
      };
    });
    return out;
  }, [stepsByDay]);

  const bottomPad = 140;

  const loadMonthForDate = useCallback(
    async (dateKey: string) => {
      const date = new Date(dateKey);
      const monthRange = getMonthRange(date);
      const monthly = await loadRange(monthRange);
      setStepsByDay((prev) => ({ ...prev, ...monthly }));
    },
    [loadRange],
  );

  const onSelectDay = useCallback(
    (dateKey: string) => {
      setSelectedDateKey(dateKey);
      loadMonthForDate(dateKey).catch(() => {
        /* ignore */
      });
    },
    [loadMonthForDate],
  );

  const nearbyKeys = useMemo(() => {
    if (!selectedDateKey) return [];
    const out: string[] = [];
    const center = new Date(selectedDateKey);
    for (let i = -3; i <= 3; i++) {
      const d = new Date(center);
      d.setDate(center.getDate() + i);
      out.push(toDayKey(d));
    }
    return out;
  }, [selectedDateKey]);

  if (selectedDateKey) {
    const dateSteps = dayDetails[selectedDateKey] ?? stepsByDay[selectedDateKey] ?? 0;
    const dayLabel = selectedDateKey === todayKey ? "Steps today" : "Steps that day";

    return (
      <Screen>
        <View style={{ flex: 1, padding: 16 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <Pressable
              onPress={() => setSelectedDateKey(null)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 999,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: COLORS.surface2,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            >
              <Ionicons name="chevron-back" size={18} color={COLORS.text} />
            </Pressable>

            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ color: COLORS.text, fontSize: 22, fontWeight: "900" }}>
                {formatFullDate(selectedDateKey)}
              </Text>
              <Text style={{ color: COLORS.subtext, marginTop: 4, fontWeight: "700" }}>
                Day details
              </Text>
            </View>

            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: bottomPad }}>
            <Card style={{ alignItems: "center", gap: 12, marginBottom: 14 }}>
              <ProgressRing
                progress={Math.min(1, dateSteps / stepGoal)}
                centerValue={formatSteps(dateSteps)}
                insideTop={dayLabel}
                insideBottom={`Goal ${formatSteps(stepGoal)}`}
                value={dateSteps}
                target={stepGoal}
              />

              <View style={{ flexDirection: "row", width: "100%", justifyContent: "space-between" }}>
                <Text style={{ color: COLORS.subtext, fontWeight: "900" }}>
                  Distance {Math.round(dateSteps * 0.0008 * 100) / 100} km
                </Text>
                <Text style={{ color: COLORS.subtext, fontWeight: "900" }}>
                  Remaining {formatSteps(Math.max(0, stepGoal - dateSteps))}
                </Text>
              </View>
            </Card>
          </ScrollView>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ flex: 1, padding: 16 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <View>
            <Text style={{ color: COLORS.text, fontSize: 26, fontWeight: "900" }}>Steps</Text>
            <Text style={{ color: COLORS.subtext, fontWeight: "700", marginTop: 2 }}>
              Steps today
            </Text>
          </View>

          <Pressable
            style={{
              padding: 10,
              borderRadius: 999,
              backgroundColor: COLORS.surface2,
              borderWidth: 1,
              borderColor: COLORS.border,
              alignItems: "center",
              justifyContent: "center",
            }}
            onPress={() => (tab === "day" ? loadSteps() : tab === "week" ? loadWeek() : loadMonth())}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.text} />
            ) : (
              <Ionicons name="refresh" size={20} color={COLORS.text} />
            )}
          </Pressable>
        </View>

        <View style={styles.tabs}>
          {(["day", "week", "month"] as TabKey[]).map((k) => {
            const active = k === tab;
            return (
              <Pressable
                key={k}
                onPress={() => setTab(k)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 12,
                  alignItems: "center",
                  backgroundColor: active ? COLORS.primary : "transparent",
                }}
              >
                <Text
                  style={{
                    color: active ? "white" : COLORS.subtext,
                    fontWeight: "900",
                    fontSize: 12,
                  }}
                >
                  {k.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {tab === "day" && (
          <ScrollView contentContainerStyle={{ paddingBottom: bottomPad }} showsVerticalScrollIndicator={false}>
            <Card style={{ alignItems: "center", gap: 12, marginBottom: 14, position: "relative" }}>
              {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 20 }} />
              ) : (
                <>
                  <Pressable
                    onPress={() => {
                      setGoalDraft(String(stepGoal));
                      setGoalModalOpen(true);
                    }}
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      width: 38,
                      height: 38,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      backgroundColor: COLORS.surface2,
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 50,
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Edit step goal"
                  >
                    <Ionicons name="create-outline" size={18} color={COLORS.text} />
                  </Pressable>

                  <ProgressRing
                    progress={progress}
                    centerValue={formatSteps(steps)}
                    insideTop="Steps today"
                    insideBottom={`Goal ${formatSteps(stepGoal)}`}
                    value={steps}
                    target={stepGoal}
                  />
                </>
              )}

              <View style={{ flexDirection: "row", width: "100%", justifyContent: "space-between" }}>
                <Text style={{ color: COLORS.subtext, fontWeight: "900" }}>
                  Remaining {formatSteps(remaining)}
                </Text>
                <Text style={{ color: COLORS.subtext, fontWeight: "900" }}>
                  {Math.round(progress * 100)}%
                </Text>
              </View>
            </Card>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {lastUpdated ? (
              <Text style={styles.updatedText}>
                Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>
            ) : null}
          </ScrollView>
        )}

        <Modal visible={goalModalOpen} transparent animationType="fade" onRequestClose={() => setGoalModalOpen(false)}>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.35)",
              alignItems: "center",
              justifyContent: "center",
              padding: 22,
            }}
          >
            <View style={{ width: "100%", gap: 12, backgroundColor: COLORS.surface, borderRadius: 20, padding: 20 }}>
              <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: "900" }}>
                Edit step goal
              </Text>
              <Text style={{ color: COLORS.subtext, marginBottom: 8 }}>
                Enter your daily step goal.
              </Text>
              <TextInput
                value={goalDraft}
                onChangeText={(t) => setGoalDraft(t.replace(/[^\d]/g, ""))}
                keyboardType="numeric"
                placeholder="10000"
                placeholderTextColor={COLORS.subtext}
                style={{
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  borderRadius: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  color: COLORS.text,
                  fontWeight: "900",
                  backgroundColor: COLORS.surface2,
                }}
              />

              <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <Pressable
                  onPress={() => setGoalModalOpen(false)}
                  style={{ paddingVertical: 10, paddingHorizontal: 14 }}
                >
                  <Text style={{ color: COLORS.subtext, fontWeight: "700" }}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    const v = Number(goalDraft);
                    if (Number.isFinite(v) && v > 0) {
                      setStepGoal(v);
                    }
                    setGoalModalOpen(false);
                  }}
                  style={{ paddingVertical: 10, paddingHorizontal: 14 }}
                >
                  <Text style={{ color: COLORS.primary, fontWeight: "700" }}>Save</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {tab === "week" && (
          <ScrollView contentContainerStyle={{ paddingBottom: bottomPad }} showsVerticalScrollIndicator={false}>
            <ActivityWeekView
              weekDays={weekDays}
              weekTotalBurned={weekTotalSteps}
              streak={0}
              now={new Date()}
              unit="steps"
              metricLabel="steps"
              onSelectDay={onSelectDay}
            />
          </ScrollView>
        )}

        {tab === "month" && (
          <ScrollView contentContainerStyle={{ paddingBottom: bottomPad }} showsVerticalScrollIndicator={false}>
            <ActivityMonthView
              baseDate={monthBase}
              loading={loading}
              monthDocs={monthDocs}
              now={new Date()}
              unit="steps"
              metricLabel="steps"
              onPrevMonth={() => setMonthBase((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
              onNextMonth={() => setMonthBase((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
              onSelectDay={onSelectDay}
            />
          </ScrollView>
        )}

        {error && error.includes("Health Connect") ? (
          <Pressable style={styles.secondaryButton} onPress={handleOpenHealthConnect}>
            <Text style={styles.secondaryButtonText}>Open Health Connect</Text>
          </Pressable>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.text,
  },
  subtitle: {
    color: COLORS.subtext,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    padding: 10,
    borderRadius: 999,
    backgroundColor: COLORS.surface2,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: COLORS.surface2,
    borderRadius: 16,
    padding: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  tabText: {
    fontWeight: "900",
    fontSize: 12,
  },
  card: {
    width: "100%",
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
    minHeight: 260,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.subtext,
    marginBottom: 12,
  },
  steps: {
    fontSize: 56,
    fontWeight: "900",
    color: COLORS.text,
  },
  loader: {
    marginVertical: 20,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    gap: 10,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
  },
  progressBarFill: {
    height: 8,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  weekGraph: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 4,
    height: 170,
  },
  weekBarContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  weekBar: {
    width: 18,
    height: 130,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  weekBarFill: {
    width: "100%",
    backgroundColor: COLORS.primary,
  },
  weekDayLabel: {
    marginTop: 8,
    color: COLORS.subtext,
    fontWeight: "900",
    fontSize: 12,
  },
  weekDayLabelToday: {
    color: COLORS.primary,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 10,
  },
  calendarCell: {
    width: "14.2857%",
    alignItems: "center",
    marginBottom: 12,
  },
  calendarRing: {
    width: 46,
    height: 46,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: COLORS.surface2,
  },
  calendarRingToday: {
    borderColor: COLORS.primary,
  },
  calendarFill: {
    width: "100%",
    backgroundColor: COLORS.primary,
  },
  calendarDayText: {
    marginTop: 6,
    color: COLORS.subtext,
    fontWeight: "900",
    fontSize: 12,
  },
  calendarDayTextToday: {
    color: COLORS.primary,
  },
  progressText: {
    color: COLORS.subtext,
    fontWeight: "700",
    width: 50,
    textAlign: "right",
  },
  goalText: {
    marginTop: 10,
    color: COLORS.subtext,
    fontSize: 13,
  },
  updatedText: {
    marginTop: 6,
    color: COLORS.subtext,
    fontSize: 12,
  },
  dayRow: {
    marginBottom: 12,
  },
  dayLabel: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  dayLabelText: {
    color: COLORS.subtext,
    fontWeight: "700",
  },
  daySteps: {
    color: COLORS.text,
    fontWeight: "900",
  },
  dayBarBg: {
    height: 8,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
  },
  dayBarFill: {
    height: 8,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  emptyText: {
    marginTop: 10,
    textAlign: "center",
    color: COLORS.subtext,
    fontSize: 14,
  },
  errorText: {
    marginTop: 14,
    color: "#F472B6",
    textAlign: "center",
    fontSize: 14,
  },
  button: {
    marginTop: 26,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignSelf: "center",
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  hintText: {
    marginTop: 18,
    textAlign: "center",
    color: COLORS.subtext,
    fontSize: 13,
    maxWidth: 380,
    alignSelf: "center",
  },
});