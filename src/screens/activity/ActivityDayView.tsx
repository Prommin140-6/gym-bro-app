import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, Modal, TextInput } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";

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
  steps?: number;

  restDay?: boolean;
  onRestDay?: () => void;

  onEdit?: (log: ActivityLog) => void;
  onDelete?: (id: string) => void;

  onUpdateBurnTarget?: (value: number) => Promise<void>;
  onUseAutoBurnTarget?: () => Promise<void>;

  // ✅ show on UI
  recommendedBurnTarget?: number;

  bottomSpacer?: number;
}) {
  const pct = props.burnedToday / Math.max(1, props.burnTarget);
  const bottom = props.bottomSpacer ?? 120;

  const [editOpen, setEditOpen] = useState(false);
  const [draftBurn, setDraftBurn] = useState(String(props.burnTarget || 0));
  const [saving, setSaving] = useState(false);

  const canEditGoal = Boolean(props.onUpdateBurnTarget || props.onUseAutoBurnTarget);

  const openEdit = () => {
    setDraftBurn(String(props.burnTarget || 0));
    setEditOpen(true);
  };

  const closeEdit = () => setEditOpen(false);

  const saveGoal = async () => {
    const v = Number(draftBurn);
    if (!Number.isFinite(v) || v <= 0) return;
    if (!props.onUpdateBurnTarget) return;

    try {
      setSaving(true);
      await props.onUpdateBurnTarget(v);
      closeEdit();
    } finally {
      setSaving(false);
    }
  };

  const useRecommended = async () => {
    if (!props.onUseAutoBurnTarget) return;

    try {
      setSaving(true);
      await props.onUseAutoBurnTarget();
      closeEdit();
    } finally {
      setSaving(false);
    }
  };

  const rec = Number(props.recommendedBurnTarget ?? 0);
  const hasRec = Number.isFinite(rec) && rec > 0;
  const recommendedLabel = hasRec ? `Recommended • ${rec} kcal` : "Recommended • ...";

  return (
    <ScrollView
      contentContainerStyle={{ gap: 14, paddingBottom: bottom }}
      showsVerticalScrollIndicator={false}
    >
      <Card style={{ alignItems: "center", gap: 12, position: "relative" }}>
        {/* Edit icon (top-right) */}
        <Pressable
          onPress={openEdit}
          disabled={!canEditGoal}
          accessibilityRole="button"
          accessibilityLabel="Edit burn goal"
          hitSlop={12}
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
            opacity: canEditGoal ? 1 : 0.45,
            zIndex: 50,
          }}
        >
          <Ionicons name="create-outline" size={18} color={COLORS.text} />
        </Pressable>

        <ProgressRing
          progress={pct}
          labelTop="burned today"
          centerValue={`${props.burnedToday}`}
          labelBottom={`today goal ${props.burnTarget}`}
          value={props.burnedToday}
          target={props.burnTarget}
          dangerOverBy={100}
        />

        <View style={{ flexDirection: "row", width: "100%", justifyContent: "space-between" }}>
          <MiniStat label="Burned" value={`${props.burnedToday} kcal`} />
          <MiniStat label="Distance" value={`${props.distanceKm} km`} />
          <MiniStat
            label="Steps"
            value={
              props.steps !== undefined && props.steps !== null
                ? props.steps.toLocaleString()
                : "0"
            }
          />
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
              <SwipeRow key={a.id} log={a} onDelete={props.onDelete} onEdit={props.onEdit} />
            ))
          )}
        </View>
      </Card>

      {/* Edit goal modal */}
      <Modal visible={editOpen} transparent animationType="fade" onRequestClose={closeEdit}>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.35)",
            alignItems: "center",
            justifyContent: "center",
            padding: 22,
          }}
        >
          <Card style={{ width: "100%", gap: 12 }}>
            <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: "900" }}>
              Edit burn goal
            </Text>

            <Text style={{ color: COLORS.subtext, fontWeight: "700" }}>kcal per day</Text>

            <TextInput
              value={draftBurn}
              onChangeText={(t) => setDraftBurn(t.replace(/[^\d]/g, ""))}
              keyboardType="numeric"
              placeholder="e.g. 350"
              placeholderTextColor={COLORS.subtext}
              style={{
                borderWidth: 1,
                borderColor: COLORS.border,
                borderRadius: 12,
                paddingVertical: 12,
                paddingHorizontal: 12,
                color: COLORS.text,
                fontWeight: "900",
                backgroundColor: COLORS.surface2,
              }}
            />

            {/* ✅ Recommended (full width) — กดได้เสมอถ้ามี handler */}
            <Pressable
              onPress={useRecommended}
              disabled={saving || !props.onUseAutoBurnTarget}
              style={{
                width: "100%",
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: "rgba(43,228,167,0.08)",
                borderWidth: 1,
                borderColor: COLORS.success,
                alignItems: "center",
                opacity: saving || !props.onUseAutoBurnTarget ? 0.6 : 1,
              }}
            >
              <Text style={{ color: COLORS.success, fontWeight: "900" }}>{recommendedLabel}</Text>
            </Pressable>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                onPress={closeEdit}
                disabled={saving}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: COLORS.surface2,
                  alignItems: "center",
                  opacity: saving ? 0.6 : 1,
                }}
              >
                <Text style={{ color: COLORS.text, fontWeight: "900" }}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={saveGoal}
                disabled={saving || !props.onUpdateBurnTarget}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: COLORS.primary,
                  alignItems: "center",
                  opacity: saving || !props.onUpdateBurnTarget ? 0.6 : 1,
                }}
              >
                <Text style={{ color: "white", fontWeight: "900" }}>
                  {saving ? "Saving..." : "Save"}
                </Text>
              </Pressable>
            </View>

            <Text style={{ color: COLORS.subtext, fontSize: 12, fontWeight: "700" }}>
              Recommended is calculated from your profile.
            </Text>
          </Card>
        </View>
      </Modal>
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
    <Swipeable enabled={Boolean(onDelete)} renderRightActions={renderRight} overshootRight={false}>
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
