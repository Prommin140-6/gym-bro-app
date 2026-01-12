import React from "react";
import { View, Text, ScrollView } from "react-native";
import { useRoute } from "@react-navigation/native";

import { Screen } from "../../components/ui/Screen";
import { COLORS } from "../../theme/colors";
import { useAuth } from "../../services/AuthContext";
import { useActivityByDateKey } from "../../hooks/useActivityByDateKey";
import ActivityDayView from "./ActivityDayView";

export default function ActivityDayDetailScreen() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const route = useRoute<any>();
  const dateKey: string = route.params?.dateKey;

  const { activities, dailySummary, totals, loading } = useActivityByDateKey(uid, dateKey);

  return (
    <Screen>
      <View style={{ flex: 1, padding: 16 }}>
        <Text style={{ color: COLORS.text, fontSize: 22, fontWeight: "900" }}>
          {dateKey}
        </Text>
        <Text style={{ color: COLORS.subtext, marginTop: 4, fontWeight: "700" }}>
          Day details
        </Text>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 140 }}>
          <ActivityDayView
            loading={loading}
            burnedToday={Number(totals.totalBurned ?? 0)}
            burnTarget={Number(dailySummary.burnTarget ?? 0)}
            distanceKm={Number(totals.totalDistanceKm ?? 0)}
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
