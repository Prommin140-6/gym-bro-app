import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Swipeable } from "react-native-gesture-handler";

import { COLORS } from "../../theme/colors";
import { Card } from "../../components/ui/Card";
import { ProgressRing } from "../../components/ProgressRing";

import type { ActivityLog } from "../../services/firestoreActivity";
import type { ActivityKey } from "../../utils/met";

function labelForActivity(key: ActivityKey): string {
  const map: Record<string, string> = {
    aerobic_exercise: "Aerobic Exercise",
    resistance_training: "Resistance Training",
    flexibility_exercise: "Flexibility Exercise",
    balance_exercise: "Balance Exercise",
    lifting: "Lifting",
    aerobic: "Aerobic",
    swimming: "Swimming",
    cycling: "Cycling",
  };
  return map[key as string] ?? String(key).replace(/_/g, " ");
}

export default function ActivityDayView(props: {
  loading?: boolean;
  burnedToday: number;
  burnTarget: number;
  distanceKm: number;

  activities: ActivityLog[];

  restDay?: boolean;
  onRestDay?: () => void;

  onEdit?: (log: ActivityLog) => void;
  onDelete?: (id: string) => void;

  bottomSpacer?: number;
}) {
  const pct = props.burnedToday / Math.max(1, props.burnTarget);
  const bottom = props.bottomSpacer ?? 120;

  return (
    <ScrollView
      contentContainerStyle={{ gap: 14, paddingBottom: bottom }}
      showsVerticalScrollIndicator={false}
    >
      {/* Progress ring */}
      <Card style={{ alignItems: "center", gap: 12 }}>
        <ProgressRing
          progress={pct}
          labelTop="burned today"
          centerValue={`${props.burnedToday}`}
          labelBottom={`today goal ${props.burnTarget}`}
        />

        <View style={{ flexDirection: "row", width: "100%", justifyContent: "space-between" }}>
          <MiniStat label="Burned" value={`${props.burnedToday} kcal`} />
          <MiniStat label="Distance" value={`${props.distanceKm} km`} />
          <MiniStat label="Steps" value="coming soon" />
        </View>

        <Pressable
          onPress={props.onRestDay}
          disabled={!props.onRestDay}
          style={{
            marginTop: 8,
            width: "100%",
            paddingVertical: 12,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: props.restDay ? COLORS.primary : COLORS.border,
            backgroundColor: props.restDay ? "rgba(47,136,255,0.12)" : COLORS.surface2,
            alignItems: "center",
            opacity: props.onRestDay ? 1 : 0.6,
          }}
        >
          <Text style={{ color: COLORS.text, fontWeight: "900" }}>
            {props.restDay ? "Rest Day: ON" : "Rest Today"}
          </Text>
        </Pressable>
      </Card>

      {/* Activity list */}
      <Card>
        <Text style={{ color: COLORS.text, fontWeight: "900", fontSize: 16 }}>Activity today</Text>
        <Text style={{ color: COLORS.subtext, marginTop: 4 }}>Logs update in realtime</Text>

        <View style={{ marginTop: 12, gap: 10 }}>
          {props.loading ? (
            <View style={{ paddingVertical: 20, alignItems: "center", gap: 6 }}>
              <Text style={{ color: COLORS.subtext, fontWeight: "800" }}>Loading...</Text>
            </View>
          ) : props.activities.length === 0 ? (
            <View style={{ paddingVertical: 20, alignItems: "center", gap: 6 }}>
              <Text style={{ color: COLORS.text, fontWeight: "900" }}>No activity yet</Text>
              <Text style={{ color: COLORS.subtext }}>Tap + to add your first session</Text>
            </View>
          ) : (
            props.activities.map((a) => (
              <SwipeRow
                key={a.id}
                log={a}
                onDelete={props.onDelete}
                onEdit={props.onEdit}
              />
            ))
          )}
        </View>
      </Card>
    </ScrollView>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ width: "32%", alignItems: "center", gap: 2 }}>
      <Text style={{ color: COLORS.subtext, fontSize: 12, fontWeight: "800" }}>{label}</Text>
      <Text style={{ color: COLORS.text, fontSize: 14, fontWeight: "900" }}>{value}</Text>
    </View>
  );
}

function SwipeRow(props: {
  log: ActivityLog;
  onDelete?: (id: string) => void;
  onEdit?: (log: ActivityLog) => void;
}) {
  const { log, onDelete, onEdit } = props;

  const renderRight = () => (
    <Pressable
      onPress={() => onDelete?.(log.id)}
      style={{
        width: 92,
        marginLeft: 10,
        borderRadius: 14,
        backgroundColor: "rgba(255, 77, 79, 0.18)",
        borderWidth: 1,
        borderColor: "rgba(255, 77, 79, 0.35)",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: COLORS.danger, fontWeight: "900" }}>Delete</Text>
    </Pressable>
  );

  return (
    <Swipeable
      enabled={Boolean(onDelete)}
      renderRightActions={renderRight}
      overshootRight={false}
    >
      <Pressable
        onPress={() => onEdit?.(log)}
        style={{
          padding: 12,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: COLORS.border,
          backgroundColor: COLORS.surface2,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ color: COLORS.text, fontWeight: "900" }} numberOfLines={1}>
            {labelForActivity(log.activityKey as ActivityKey)}
          </Text>
          <Text style={{ color: COLORS.subtext, fontWeight: "700", fontSize: 12 }}>
            {String(log.intensity).toUpperCase()} • {log.minutes} min
          </Text>
        </View>

        <Text style={{ color: COLORS.text, fontWeight: "900" }}>{log.kcal_burned} kcal</Text>
      </Pressable>
    </Swipeable>
  );
}
