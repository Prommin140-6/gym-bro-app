import React, { useMemo, useState } from "react";
import { Modal, View, Text, Pressable, Alert, Image } from "react-native";
import Slider from "@react-native-community/slider";

import { COLORS } from "../../theme/colors";
import type { ActivityKey, Intensity } from "../../utils/met";
import { ACTIVITY_LABEL, kcalBurned, metOf } from "../../utils/met";
import { addActivityToToday } from "../../services/firestoreActivity";
import { upsertTodayDailySummary } from "../../services/firestoreDailySummary";

export function ActivityAddModal(props: {
  visible: boolean;
  onClose: () => void;

  uid: string | null;
  weightKg: number;

  activityKey: ActivityKey | null;

  // ✅ เพิ่มเพื่อรองรับ UI ตามที่คุณต้องการ
  title?: string;
  description?: string;
  imageSource?: any; // e.g. require("...") หรือ { uri: "..." }
}) {
  const { visible, onClose, uid, weightKg, activityKey } = props;

  const [intensity, setIntensity] = useState<Intensity>("moderate");
  const [minutes, setMinutes] = useState(30);
  const [saving, setSaving] = useState(false);

  const fallbackTitle = activityKey ? ACTIVITY_LABEL[activityKey] : "Activity";
  const title = props.title?.trim() ? props.title : fallbackTitle;
  const description = props.description?.trim() ? props.description : "Set your intensity and duration.";

  const met = useMemo(() => {
    if (!activityKey) return 0;
    return metOf(activityKey, intensity);
  }, [activityKey, intensity]);

  const kcal = useMemo(() => {
    if (!activityKey) return 0;
    return kcalBurned({ met, weightKg, minutes });
  }, [activityKey, met, weightKg, minutes]);

  const reset = () => {
    setIntensity("moderate");
    setMinutes(30);
  };

  const onSave = async () => {
    if (!uid) return Alert.alert("Error", "Not logged in");
    if (!activityKey) return Alert.alert("Error", "No activity selected");
    if (saving) return;

    setSaving(true);
    try {
      await addActivityToToday({
        uid,
        activityKey,
        intensity,
        minutes,
        met,
        kcal_burned: kcal,
        distance_km: 0,
      });

      // ✅ ทำให้ daily_summary มี doc แน่ๆ (อัปเดท timestamp ฝั่ง service)
      await upsertTodayDailySummary(uid, {});

      onClose();
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* backdrop */}
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.58)",
          justifyContent: "flex-end",
        }}
      >
        {/* sheet */}
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
            <View style={{ gap: 4, flex: 1, paddingRight: 10 }}>
              <Text style={{ color: COLORS.subtext, fontWeight: "900", letterSpacing: 1 }}>
                ADD ACTIVITY
              </Text>
              <Text style={{ color: COLORS.text, fontWeight: "900", fontSize: 20 }} numberOfLines={1}>
                {title}
              </Text>
              <Text style={{ color: COLORS.subtext, fontWeight: "700" }} numberOfLines={2}>
                {description}
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
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

          {/* image / illustration */}
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
            {props.imageSource ? (
              <Image source={props.imageSource} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
            ) : (
              <Text style={{ color: COLORS.subtext, fontWeight: "900" }}>Image (placeholder)</Text>
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
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            {(["light", "moderate", "heavy"] as Intensity[]).map((k) => {
              const active = intensity === k;
              const label = k === "heavy" ? "Heavy" : k === "moderate" ? "Moderate" : "Light";
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
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* minutes slider */}
          <View style={{ marginTop: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ color: COLORS.text, fontWeight: "900" }}>Duration</Text>
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
              MET {met} • Weight {weightKg} kg
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
                opacity: saving ? 0.7 : 1,
              }}
              disabled={saving}
            >
              <Text style={{ color: COLORS.text, fontWeight: "900" }}>Reset</Text>
            </Pressable>

            <Pressable
              onPress={onSave}
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
              <Text style={{ color: "white", fontWeight: "900" }}>{saving ? "Saving..." : "Save"}</Text>
            </Pressable>
          </View>

          <View style={{ height: 10 }} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
