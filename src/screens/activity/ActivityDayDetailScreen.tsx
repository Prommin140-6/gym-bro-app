import React, { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";

import { Screen } from "../../components/ui/Screen";
import { COLORS } from "../../theme/colors";
import { useAuth } from "../../services/AuthContext";
import { useActivityByDateKey } from "../../hooks/useActivityByDateKey";
import ActivityDayView from "./ActivityDayView";
import { Ionicons } from "@expo/vector-icons";
import { readStepsForDate } from "../../services/healthConnectSteps";

export default function ActivityDayDetailScreen() {
  const navigation = useNavigation<any>();

  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const route = useRoute<any>();
  const dateKey: string = route.params?.dateKey;
  const initialSteps: number | undefined = route.params?.initialSteps;

  const { activities, dailySummary, totals, loading } = useActivityByDateKey(uid, dateKey);

  const [steps, setSteps] = useState<number>(initialSteps ?? 0);
  const [stepsLoading, setStepsLoading] = useState(false);
  const [stepsError, setStepsError] = useState<string | null>(null);

  const loadStepsForDate = useCallback(
    async (key: string) => {
      setStepsError(null);
      setStepsLoading(true);

      try {
        const total = await readStepsForDate(key);
        setSteps(total);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        setStepsError(message);
      } finally {
        setStepsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!dateKey) return;

    if (initialSteps != null) {
      // Use preloaded step data (e.g., from week/month view) for fast display.
      setSteps(initialSteps);

      // Still refresh in the background in case the cached value is stale.
      (async () => {
        try {
          const total = await readStepsForDate(dateKey, { forceRefresh: true });
          if (total !== initialSteps) setSteps(total);
        } catch (e) {
          // Ignore background refresh failures when we already have a value.
          // This avoids showing "Permission denied" while still displaying steps.
          console.warn("Health Connect background refresh failed:", e);
        }
      })();

      return;
    }

    loadStepsForDate(dateKey);
  }, [dateKey, initialSteps, loadStepsForDate]);

  const distanceFromSteps = Math.round(steps * 0.0008 * 100) / 100;
  const burnedFromSteps = Math.round(steps * 0.05);
  const burnedWithSteps = Number(totals.totalBurned ?? 0) + burnedFromSteps;

  return (
    <Screen>
      <View style={{ flex: 1, padding: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: COLORS.surface2,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Ionicons name="chevron-back" size={20} color={COLORS.text} />
          </Pressable>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ color: COLORS.text, fontSize: 22, fontWeight: "900" }}>
              {dateKey}
            </Text>
            <Text style={{ color: COLORS.subtext, marginTop: 4, fontWeight: "700" }}>
              Day details
            </Text>
          </View>

          <View style={{ width: 40, height: 40 }} />
        </View>

        {stepsError ? (
          <Text style={{ color: COLORS.danger, marginBottom: 10 }}>{stepsError}</Text>
        ) : null}

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 140 }}>
          <ActivityDayView
            loading={loading || stepsLoading}
            burnedToday={burnedWithSteps}
            burnTarget={Number(dailySummary.burnTarget ?? 0)}
            distanceKm={distanceFromSteps}
            steps={steps}
            activities={activities}
            restDay={Boolean(dailySummary.restDay ?? false)}
            // ✅ read-only for past day (ไม่ให้แก้ย้อนหลัง)
            onRestDay={undefined}
            onDelete={undefined}
            onEdit={undefined}
          />
        </ScrollView>
      </View>
    </Screen>
  );
}
