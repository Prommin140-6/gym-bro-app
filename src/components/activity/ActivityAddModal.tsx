// src/components/activity/ActivityAddModal.tsx
import React, { useMemo, useState, useEffect } from "react";
import { Modal, View, Text, Pressable, Alert, Image } from "react-native";
import Slider from "@react-native-community/slider";

import { COLORS } from "../../theme/colors";
import type { ActivityKey, Intensity } from "../../utils/met";
import { ACTIVITY_LABEL, kcalBurned, metOf } from "../../utils/met";
import { addActivityToToday, updateTodayActivity } from "../../services/firestoreActivity";
import { upsertTodayDailySummary } from "../../services/firestoreDailySummary";

export function ActivityAddModal(props: {
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;

  uid: string | null;
  weightKg: number;
  activityKey: ActivityKey | null;

  // optional display
  title?: string;
  description?: string;
  imageSource?: any;

  // edit mode
  editLogId?: string | null;
  initialIntensity?: Intensity;
  initialMinutes?: number;
}) {
  const {
    visible,
    onClose,
    onSaved,
    uid,
    weightKg,
    activityKey,
    title,
    description,
    imageSource,
    editLogId,
    initialIntensity,
    initialMinutes,
  } = props;

  const isEdit = Boolean(editLogId);

  const [intensity, setIntensity] = useState<Intensity>(initialIntensity ?? "moderate");
  const [minutes, setMinutes] = useState(initialMinutes ?? 30);
  const [saving, setSaving] = useState(false);

  // reset when open
  useEffect(() => {
    if (!visible) return;
    setIntensity(initialIntensity ?? "moderate");
    setMinutes(initialMinutes ?? 30);
  }, [visible, initialIntensity, initialMinutes]);

  const headerTitle = title ?? (activityKey ? ACTIVITY_LABEL[activityKey] : "Activity");
  const headerDesc = description ?? (isEdit ? "Edit your session" : "Log your session");

  const met = useMemo(() => {
    if (!activityKey) return 0;
    const v = metOf(activityKey, intensity);
    return Number.isFinite(v) ? v : 0;
  }, [activityKey, intensity]);

  // ✅ FIX สำคัญ: kcalBurned signature = (weightKg, minutes, met)
  const kcal = useMemo(() => {
    if (!activityKey) return 0;
    const v = kcalBurned(weightKg, minutes, met);
    return Number.isFinite(v) ? v : 0;
  }, [activityKey, weightKg, minutes, met]);

  const reset = () => {
    setIntensity("moderate");
    setMinutes(30);
  };

  const handleSave = async () => {
    if (!uid) return Alert.alert("Error", "Not logged in");
    if (!activityKey) return Alert.alert("Error", "No activity selected");
    if (saving) return;

    setSaving(true);
    try {
      if (isEdit && editLogId) {
        await updateTodayActivity({
          uid,
          logId: editLogId,
          intensity,
          minutes,
          met,
          kcal_burned: kcal,
          distance_km: 0,
        });
      } else {
        await addActivityToToday({
          uid,
          activityKey,
          intensity,
          minutes,
          met,
          kcal_burned: kcal,
          distance_km: 0,
        });
      }

      await upsertTodayDailySummary(uid, { updatedAt: "server" });

      if (onSaved) onSaved();
      else onClose();
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" }}
      >
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: COLORS.surface,
            borderTopLeftRadius: 22,
            borderTopRightRadius: 22,
            borderWidth: 1,
            borderColor: COLORS.border,
            padding: 16,
          }}
        >
          {/* header */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ gap: 2, flex: 1, paddingRight: 10 }}>
              <Text style={{ color: COLORS.subtext, fontWeight: "800" }}>
                {isEdit ? "Edit activity" : "Add activity"}
              </Text>
              <Text style={{ color: COLORS.text, fontWeight: "900", fontSize: 20 }} numberOfLines={1}>
                {headerTitle}
              </Text>
              <Text style={{ color: COLORS.subtext, fontWeight: "700", marginTop: 2 }} numberOfLines={2}>
                {headerDesc}
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              hitSlop={12}
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
              <Text style={{ color: COLORS.text, fontWeight: "900" }}>✕</Text>
            </Pressable>
          </View>

          {/* image */}
          <View
            style={{
              height: 160,
              borderRadius: 18,
              backgroundColor: COLORS.surface2,
              borderWidth: 1,
              borderColor: COLORS.border,
              marginTop: 14,
              overflow: "hidden",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {imageSource ? (
              <Image source={imageSource} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
            ) : (
              <Text style={{ color: COLORS.subtext, fontWeight: "900" }}>Silhouette (placeholder)</Text>
            )}
          </View>

          {/* intensity */}
          <Text style={{ color: COLORS.text, fontWeight: "900", marginTop: 14 }}>Intensity</Text>
          <View
            style={{
              flexDirection: "row",
              backgroundColor: COLORS.surface2,
              borderRadius: 16,
              padding: 4,
              marginTop: 10,
            }}
          >
            {(["heavy", "moderate", "light"] as Intensity[]).map((k) => {
              const active = intensity === k;
              return (
                <Pressable
                  key={k}
                  onPress={() => setIntensity(k)}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 12,
                    alignItems: "center",
                    backgroundColor: active ? COLORS.primary : "transparent",
                  }}
                >
                  <Text style={{ color: active ? "white" : COLORS.subtext, fontWeight: "900" }}>
                    {k === "heavy" ? "Heavy" : k === "moderate" ? "Moderate" : "Light"}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* minutes */}
          <View style={{ marginTop: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ color: COLORS.text, fontWeight: "900" }}>Minutes</Text>
              <Text style={{ color: COLORS.subtext, fontWeight: "900" }}>{minutes} min</Text>
            </View>

            <Slider
              minimumValue={5}
              maximumValue={180}
              step={5}
              value={minutes}
              onValueChange={setMinutes}
              minimumTrackTintColor={COLORS.primary}
              maximumTrackTintColor={COLORS.border}
              thumbTintColor={COLORS.primary}
              style={{ marginTop: 6 }}
            />
          </View>

          {/* kcal preview */}
          <View
            style={{
              marginTop: 10,
              padding: 12,
              borderRadius: 16,
              backgroundColor: "rgba(47,136,255,0.10)",
              borderWidth: 1,
              borderColor: "rgba(47,136,255,0.25)",
            }}
          >
            <Text style={{ color: COLORS.subtext, fontWeight: "800" }}>Estimated burn</Text>
            <Text style={{ color: COLORS.text, fontWeight: "900", fontSize: 22, marginTop: 4 }}>
              {kcal} kcal
            </Text>
            <Text style={{ color: COLORS.subtext, fontWeight: "800", marginTop: 2 }}>
              MET {Number.isFinite(met) ? met.toFixed(1) : "0.0"} • Weight {weightKg} kg
            </Text>
          </View>

          {/* buttons */}
          <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
            <Pressable
              onPress={reset}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 14,
                alignItems: "center",
                backgroundColor: "transparent",
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
              disabled={saving}
            >
              <Text style={{ color: COLORS.text, fontWeight: "900" }}>Reset</Text>
            </Pressable>

            <Pressable
              onPress={handleSave}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 14,
                alignItems: "center",
                backgroundColor: COLORS.primary,
                opacity: saving ? 0.7 : 1,
              }}
              disabled={saving}
            >
              <Text style={{ color: "white", fontWeight: "900" }}>
                {saving ? "Saving..." : isEdit ? "Update" : "Save"}
              </Text>
            </Pressable>
          </View>

          <View style={{ height: 10 }} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
