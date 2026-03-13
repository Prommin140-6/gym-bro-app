import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
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
import { COLORS } from "../theme/colors";

import { useAuth } from "../services/AuthContext";
import { db } from "../services/firebase";

import {
  defaultDailySummary,
  subscribeDailySummaryByDateKey,
  type DailySummaryDoc,
} from "../services/firestoreDailySummary";

import { subscribeActivitiesByDateKey, type ActivityLog } from "../services/firestoreActivity";

type RouteParams = { dateKey: string };

type Totals = {
  totalCalories: number;
  totalCarbs: number;
  totalProtein: number;
  totalFat: number;
};

function round1(n: number) {
  return Math.round(n * 10) / 10;
}
function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function parseDateKeyToLabel(dateKey: string) {
  try {
    let y = 0,
      m = 0,
      d = 0;

    if (/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      const [yy, mm, dd] = dateKey.split("-").map((x) => Number(x));
      y = yy;
      m = mm;
      d = dd;
    } else if (/^\d{8}$/.test(dateKey)) {
      y = Number(dateKey.slice(0, 4));
      m = Number(dateKey.slice(4, 6));
      d = Number(dateKey.slice(6, 8));
    } else {
      return dateKey;
    }

    const dt = new Date(y, m - 1, d);
    if (Number.isNaN(dt.getTime())) return dateKey;

    const day = dt.getDate();
    const month = dt.toLocaleString("en-US", { month: "long" });
    const year = dt.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return dateKey;
  }
}

const STEPS_RECORD_TYPE = "Steps" as const;

const toDayKey = (date: Date) => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};

const getDayRange = (key: string) => {
  let year = 0;
  let month = 0;
  let day = 0;

  if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
    [year, month, day] = key.split("-").map(Number);
  } else if (/^\d{8}$/.test(key)) {
    year = Number(key.slice(0, 4));
    month = Number(key.slice(4, 6));
    day = Number(key.slice(6, 8));
  }

  const start = new Date(year, month - 1, day, 0, 0, 0, 0);
  const end = new Date(year, month - 1, day, 23, 59, 59, 999);
  return {
    startTime: start.toISOString(),
    endTime: end.toISOString(),
  };
};

function formatInt(n: number) {
  const v = Number.isFinite(n) ? Math.round(n) : 0;
  return v.toLocaleString();
}

function SoftPill({
  text,
  tone = "neutral",
}: {
  text: string;
  tone?: "neutral" | "good" | "warn";
}) {
  const bg =
    tone === "good"
      ? "rgba(34,197,94,0.14)"
      : tone === "warn"
      ? "rgba(245,158,11,0.14)"
      : "rgba(255,255,255,0.08)";

  const bd =
    tone === "good"
      ? "rgba(34,197,94,0.22)"
      : tone === "warn"
      ? "rgba(245,158,11,0.22)"
      : "rgba(255,255,255,0.12)";

  const tx = tone === "good" ? "#9FF2B7" : tone === "warn" ? "#FFD39A" : COLORS.subtext;

  return (
    <View style={[styles.pill, { backgroundColor: bg, borderColor: bd }]}>
      <Text style={[styles.pillText, { color: tx }]} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

function ProgressBarPro({ progress01, color }: { progress01: number; color: string }) {
  const p = clamp01(progress01);

  return (
    <View style={styles.barTrack}>
      <View style={[styles.barFill, { width: `${Math.round(p * 100)}%`, backgroundColor: color }]} />
      <View style={[styles.barGlow, { backgroundColor: color, opacity: p > 0 ? 0.12 : 0 }]} />
    </View>
  );
}

function SectionCard({
  title,
  accent,
  icon,
  valueLeft,
  valueRight,
  open,
  onToggle,
  children,
}: {
  title: string;
  accent: string;
  icon: keyof typeof Ionicons.glyphMap;
  valueLeft: string;
  valueRight: string;
  open: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}) {
  const leftN = Number(valueLeft);
  const rightN = Number(valueRight);
  const ratio = rightN > 0 ? leftN / rightN : 0;

  return (
    <Card style={styles.sectionCard}>
      {/* accent line */}
      <View style={[styles.sectionAccent, { backgroundColor: accent }]} />

      <Pressable onPress={onToggle} style={styles.sectionHeader} hitSlop={8}>
        <View style={[styles.sectionIconWrap, { borderColor: `${accent}33` }]}>
          <Ionicons name={icon} size={18} color={accent} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionSub}>
            {formatInt(leftN)} / {formatInt(rightN)}
          </Text>
        </View>

        <View style={[styles.chevBtn, { borderColor: "rgba(255,255,255,0.10)" }]}>
          <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={COLORS.subtext} />
        </View>
      </Pressable>

      <View style={styles.sectionBarWrap}>
        <ProgressBarPro progress01={ratio} color={accent} />
      </View>

      {open ? <View style={styles.sectionBody}>{children}</View> : null}
    </Card>
  );
}

function MacroRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.macroCard}>
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={styles.macroValue}>{value}</Text>
    </View>
  );
}

function StatTile({
  title,
  value,
  hint,
  icon,
  accent,
}: {
  title: string;
  value: string;
  hint?: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
}) {
  return (
    <View style={styles.statTile}>
      <View style={[styles.statIcon, { backgroundColor: `${accent}1A`, borderColor: `${accent}33` }]}>
        <Ionicons name={icon} size={18} color={accent} />
      </View>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
      {hint ? <Text style={styles.statHint}>{hint}</Text> : null}
    </View>
  );
}

export default function HealthHistoryDayScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { dateKey } = (route.params ?? {}) as RouteParams;

  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const [openKey, setOpenKey] = useState<"cal" | "steps" | "burn" | null>("cal");

  const [stepsToday, setStepsToday] = useState(0);
  const [stepsLoading, setStepsLoading] = useState(false);
  const [stepsError, setStepsError] = useState<string | null>(null);

  // ===== Daily summary =====
  const [summary, setSummary] = useState<DailySummaryDoc>(defaultDailySummary);

  useEffect(() => {
    if (!uid || !dateKey) return;
    return subscribeDailySummaryByDateKey(uid, dateKey, setSummary);
  }, [uid, dateKey]);

  // ===== Activities =====
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  useEffect(() => {
    if (!uid || !dateKey) return;
    return subscribeActivitiesByDateKey(uid, dateKey, setActivities);
  }, [uid, dateKey]);

  // ===== Foods totals (macros) =====
  const [foodTotals, setFoodTotals] = useState<Totals>({
    totalCalories: 0,
    totalCarbs: 0,
    totalProtein: 0,
    totalFat: 0,
  });

  useEffect(() => {
    if (!uid || !dateKey) return;

    const q = query(
      collection(db, "users", uid, "dailyLogs", dateKey, "foods"),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snap) => {
      let cals = 0;
      let carbs = 0;
      let protein = 0;
      let fat = 0;

      snap.docs.forEach((d) => {
        const t = (d.data() as any).totals ?? {};
        cals += Number(t.totalCalories ?? 0);
        carbs += Number(t.totalCarbs ?? 0);
        protein += Number(t.totalProtein ?? 0);
        fat += Number(t.totalFat ?? 0);
      });

      setFoodTotals({
        totalCalories: Math.round(cals),
        totalCarbs: round1(carbs),
        totalProtein: round1(protein),
        totalFat: round1(fat),
      });
    });
  }, [uid, dateKey]);

  useEffect(() => {
    if (!dateKey) return;

    const loadSteps = async () => {
      setStepsError(null);
      setStepsLoading(true);

      try {
        const sdkStatus = await getSdkStatus();

        if (sdkStatus !== SdkAvailabilityStatus.SDK_AVAILABLE) {
          setStepsError("Health Connect is not installed or ready. Please install/update Health Connect.");
          return;
        }

        const initialized = await initialize();
        if (!initialized) {
          setStepsError("Unable to initialize Health Connect. Please try again.");
          return;
        }

        const granted = await requestPermission([
          { accessType: "read", recordType: STEPS_RECORD_TYPE },
        ]);

        const hasStepsPermission = granted.some(
          (p) => p.recordType === STEPS_RECORD_TYPE && p.accessType === "read",
        );

        if (!hasStepsPermission) {
          setStepsError("Please grant permission to read steps from Health Connect.");
          return;
        }

        const range = getDayRange(dateKey);
        const result = await readRecords(STEPS_RECORD_TYPE, {
          timeRangeFilter: {
            operator: "between",
            startTime: range.startTime,
            endTime: range.endTime,
          },
        });

        let totalSteps = 0;
        result.records.forEach((record) => {
          totalSteps += record.count ?? 0;
        });

        setStepsToday(totalSteps);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        setStepsError(message);
      } finally {
        setStepsLoading(false);
      }
    };

    loadSteps();
  }, [dateKey]);

  // values
  const burned = Number(summary.totalBurnedCalories ?? 0);
  const burnTarget = Number(summary.burnTarget ?? 0);

  const eaten = Number(summary.eatenCalories ?? 0);
  const calTarget = Number(summary.calorieTarget ?? 0);

  const distanceKm = Number(summary.totalDistanceKm ?? 0);

  const stepsTarget = 10000;
  const distanceFromStepsKm = Math.round(stepsToday * 0.0008 * 100) / 100;
  const distanceKmToShow = stepsToday > 0 ? distanceFromStepsKm : distanceKm;

  const dateLabel = useMemo(() => parseDateKeyToLabel(String(dateKey ?? "")), [dateKey]);

  // accent colors
  const CAL = "#3B82F6";
  const STEPS = "#60A5FA";
  const BURN = "#22C55E";

  return (
    <Screen>
      <View style={{ flex: 1 }}>
        {/* ===== Header ===== */}
        <View style={styles.headerWrap}>
          <View style={styles.headerTopRow}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
              hitSlop={10}
              android_ripple={{ color: "rgba(255,255,255,0.08)", borderless: true }}
            >
              <Ionicons name="chevron-back" size={22} color={COLORS.text} />
            </Pressable>

            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.headerTitle}>Health History</Text>
              <Text style={styles.headerDate}>{dateLabel}</Text>
            </View>

            <View style={{ width: 44, height: 44 }} />
          </View>

          <View style={styles.headerStatsRow}>
            <StatTile
              title="Calories"
              value={`${formatInt(eaten)} / ${formatInt(calTarget)}`}
              hint={calTarget > 0 ? `${Math.round(clamp01(eaten / calTarget) * 100)}% of goal` : "No goal"}
              icon="flame"
              accent={CAL}
            />
            <StatTile
              title="Burn"
              value={`${formatInt(burned)} / ${formatInt(burnTarget)}`}
              hint={burnTarget > 0 ? `${Math.round(clamp01(burned / burnTarget) * 100)}% of goal` : "No goal"}
              icon="flash"
              accent={BURN}
            />
          </View>
        </View>

        {/* ===== Content ===== */}
        <ScrollView contentContainerStyle={styles.content}>
          <SectionCard
            title="Calories"
            icon="restaurant"
            accent={CAL}
            valueLeft={String(Math.round(eaten))}
            valueRight={String(Math.round(calTarget))}
            open={openKey === "cal"}
            onToggle={() => setOpenKey((k) => (k === "cal" ? null : "cal"))}
          >
            <Text style={styles.bodyHint}>Macro breakdown (from food logs)</Text>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <MacroRow label="Carb" value={`${foodTotals.totalCarbs} g`} />
              <MacroRow label="Protein" value={`${foodTotals.totalProtein} g`} />
              <MacroRow label="Fat" value={`${foodTotals.totalFat} g`} />
            </View>
          </SectionCard>

          <SectionCard
            title="Steps"
            icon="footsteps"
            accent={STEPS}
            valueLeft={String(stepsToday)}
            valueRight={String(stepsTarget)}
            open={openKey === "steps"}
            onToggle={() => setOpenKey((k) => (k === "steps" ? null : "steps"))}
          >
            <View style={{ gap: 10 }}>
              <View style={styles.kpiRow}>
                <View style={styles.kpiBox}>
                  <Text style={styles.kpiLabel}>Today</Text>
                  <Text style={styles.kpiValue}>{stepsToday.toLocaleString()} steps</Text>
                </View>
                <View style={styles.kpiBox}>
                  <Text style={styles.kpiLabel}>Distance</Text>
                  <Text style={styles.kpiValue}>
                    {Number.isFinite(distanceKmToShow) ? distanceKmToShow.toFixed(2) : "0.00"} km
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              {stepsLoading ? (
                <Text style={styles.bodyHint}>Loading step data…</Text>
              ) : stepsError ? (
                <View style={{ gap: 6 }}>
                  <Text style={styles.bodyHint}>{stepsError}</Text>
                  {stepsError.includes("Health Connect") ? (
                    <Pressable
                      onPress={() => openHealthConnectSettings()}
                      style={{ padding: 10, borderRadius: 12, backgroundColor: COLORS.surface2 }}
                    >
                      <Text style={{ color: COLORS.primary, fontWeight: "700" }}>
                        Open Health Connect
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : stepsToday === 0 ? (
                <Text style={styles.bodyHint}>No step logs for this day.</Text>
              ) : null}
            </View>
          </SectionCard>

          <SectionCard
            title="Burn"
            icon="barbell"
            accent={BURN}
            valueLeft={String(Math.round(burned))}
            valueRight={String(Math.round(burnTarget))}
            open={openKey === "burn"}
            onToggle={() => setOpenKey((k) => (k === "burn" ? null : "burn"))}
          >
            <Text style={styles.bodyHint}>Activities for this day</Text>

            {activities.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No activity logs for this day.</Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {activities.map((a) => (
                  <View key={a.id} style={styles.activityItem}>
                    {/* ✅ ตามที่สั่ง: ไม่มี icon ในรายการ */}
                    <View style={{ flex: 1, gap: 8 }}>
                      <Text style={styles.activityTitle}>{String(a.activityKey).replace(/_/g, " ")}</Text>

                      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                        <SoftPill text={String(a.intensity)} />
                        <SoftPill text={`${a.minutes} min`} />
                      </View>
                    </View>

                    <View style={styles.kcalPill}>
                      <Text style={styles.kcalText}>{Math.round(a.kcal_burned)} kcal</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </SectionCard>
        </ScrollView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 28,
    gap: 12,
  },

  // ===== Header =====
  headerWrap: {
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  headerDate: {
    color: COLORS.subtext,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  headerStatsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
  },
  statTile: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 8,
  },
  statTitle: {
    color: COLORS.subtext,
    fontSize: 12,
    fontWeight: "800",
  },
  statValue: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 4,
  },
  statHint: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 6,
  },

  // ===== Pills =====
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "800",
  },

  // ===== Progress Bar =====
  barTrack: {
    height: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    position: "relative",
  },
  barFill: {
    height: "100%",
    borderRadius: 999,
  },
  barGlow: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "100%",
  },

  // ===== Section Card =====
  sectionCard: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    overflow: "hidden",
  },
  sectionAccent: {
    position: "absolute",
    left: 0,
    top: 12,
    bottom: 12,
    width: 4,
    borderTopRightRadius: 999,
    borderBottomRightRadius: 999,
    opacity: 0.95,
  },
  sectionHeader: {
    paddingLeft: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900",
  },
  sectionSub: {
    color: COLORS.subtext,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2,
  },
  chevBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
  },
  sectionBarWrap: {
    marginTop: 12,
    paddingLeft: 6,
  },
  sectionBody: {
    marginTop: 14,
    paddingLeft: 6,
    gap: 12,
  },

  // ===== Body bits =====
  bodyHint: {
    color: COLORS.subtext,
    fontWeight: "700",
    lineHeight: 18,
  },
  macroCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    gap: 4,
  },
  macroLabel: {
    color: COLORS.subtext,
    fontSize: 12,
    fontWeight: "800",
  },
  macroValue: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  kpiRow: {
    flexDirection: "row",
    gap: 10,
  },
  kpiBox: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  kpiLabel: {
    color: COLORS.subtext,
    fontSize: 12,
    fontWeight: "800",
  },
  kpiValue: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 4,
  },

  // ===== Empty =====
  emptyBox: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  emptyText: {
    color: COLORS.subtext,
    fontWeight: "800",
  },

  // ===== Activity item =====
  activityItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  activityTitle: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 15,
    textTransform: "capitalize",
  },
  kcalPill: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,90,61,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,90,61,0.22)",
  },
  kcalText: {
    color: "#ff5a3d",
    fontWeight: "900",
    fontSize: 13,
  },
});
