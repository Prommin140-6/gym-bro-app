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

  title?: string;
  description?: string;
  imageSource?: any;

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

  useEffect(() => {
    if (!visible) return;
    setIntensity(initialIntensity ?? "moderate");
    setMinutes(initialMinutes ?? 30);
  }, [visible, initialIntensity, initialMinutes]);

  const headerTitle = title ?? (activityKey ? ACTIVITY_LABEL[activityKey] : "Activity");
  const headerDesc = description ?? (isEdit ? "Edit your session" : "Log your session");

  const met = useMemo(() => {
    if (!activityKey) return 0;
    return metOf(activityKey, intensity);
  }, [activityKey, intensity]);

  const kcal = useMemo(() => {
    if (!activityKey) return 0;

    // ✅ GUARD: กัน NaN เผื่อ weight/min/met หลุดมาไม่ใช่ตัวเลข
    if (!Number.isFinite(weightKg) || !Number.isFinite(minutes) || !Number.isFinite(met)) return 0;

    // ✅ FIX: signature ของ kcalBurned คือ (weightKg, minutes, met)
    return kcalBurned(weightKg, minutes, met);
  }, [activityKey, met, weightKg, minutes]);

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

      // ✅ ให้คงรูปแบบเดิมของโปรเจกต์คุณไว้ (ต้องส่ง patch)
      await upsertTodayDailySummary(uid, { updatedAt: "server" });

      onSaved?.();
      onClose();
      reset();
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to save activity");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.55)",
          justifyContent: "flex-end",
        }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: COLORS.surface,
            borderTopLeftRadius: 22,
            borderTopRightRadius: 22,
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 20,
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            {!!imageSource && (
              <Image
                source={imageSource}
                style={{ width: 54, height: 54, borderRadius: 14 }}
                resizeMode="cover"
              />
            )}

            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: "900", color: COLORS.text }}>
                {headerTitle}
              </Text>
              <Text style={{ fontSize: 13, color: COLORS.subtext, marginTop: 2 }}>
                {headerDesc}
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: 999,
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

          {/* image / placeholder */}
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
            {!!imageSource ? (
              <Image source={imageSource} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
            ) : (
              <Text style={{ color: COLORS.subtext, fontWeight: "800" }}>No preview</Text>
            )}
          </View>

          {/* intensity */}
          <Text style={{ marginTop: 14, color: COLORS.text, fontWeight: "900" }}>Intensity</Text>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            {(["light", "moderate", "heavy"] as Intensity[]).map((x) => {
              const active = intensity === x;
              return (
                <Pressable
                  key={x}
                  onPress={() => setIntensity(x)}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 14,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: active ? COLORS.primary : COLORS.border,
                    backgroundColor: active ? "rgba(255,202,8,0.12)" : COLORS.surface2,
                  }}
                >
                  <Text style={{ color: active ? COLORS.primary : COLORS.text, fontWeight: "900" }}>
                    {x.toUpperCase()}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* duration */}
          <View style={{ marginTop: 14 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: COLORS.text, fontWeight: "900" }}>Duration</Text>
              <Text style={{ color: COLORS.text, fontWeight: "900" }}>{minutes} min</Text>
            </View>

            <Slider
              minimumValue={5}
              maximumValue={180}
              step={5}
              value={minutes}
              onValueChange={(v) => setMinutes(v)}
              minimumTrackTintColor={COLORS.primary}
              maximumTrackTintColor={COLORS.border}
              style={{ marginTop: 6 }}
            />
          </View>

          {/* kcal */}
          <View
            style={{
              marginTop: 12,
              borderRadius: 16,
              padding: 12,
              backgroundColor: COLORS.surface2,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Text style={{ color: COLORS.text, fontWeight: "900", fontSize: 18 }}>
              {kcal} kcal
            </Text>
            <Text style={{ color: COLORS.subtext, fontWeight: "800", marginTop: 2 }}>
              MET {met} • Weight {weightKg} kg
            </Text>
          </View>

          {/* actions */}
          <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
            <Pressable
              onPress={onClose}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: COLORS.border,
                alignItems: "center",
                backgroundColor: COLORS.surface2,
              }}
              disabled={saving}
            >
              <Text style={{ color: COLORS.text, fontWeight: "900" }}>Cancel</Text>
            </Pressable>

            <Pressable
              onPress={handleSave}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 16,
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
