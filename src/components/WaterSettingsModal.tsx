import React, { useMemo, useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { COLORS } from "../theme/colors";
import { useWater } from "../hooks/useWater";
import { MAX_WATER_CUPS_PER_DAY } from "../services/firestoreWater";

type Props = {
  visible: boolean;
  onClose: () => void;
  uid: string | null;
};

export default function WaterSettingsModal({ visible, onClose, uid }: Props) {
  const water = useWater(uid);

  const [cups, setCups] = useState<number>(water.goalCups);

  useEffect(() => {
    if (visible) setCups(Math.min(MAX_WATER_CUPS_PER_DAY, water.goalCups));
  }, [visible, water.goalCups]);

  const mlPerCup = water.targets.mlPerCup || 250;

  const goalMl = useMemo(() => Math.max(mlPerCup, cups * mlPerCup), [cups, mlPerCup]);

  const label = useMemo(() => {
    const cupLabel = cups === 1 ? "cup" : "cups";
    return `${goalMl} ml (${cups} ${cupLabel})`;
  }, [goalMl, cups]);

  const canSave = uid !== null;

  const onReset = async () => {
    await water.resetTargets();
    // default 2000ml -> แปลงเป็น cups แล้ว cap ไม่เกิน 7
    const defaultCups = Math.max(1, Math.round(2000 / mlPerCup));
    setCups(Math.min(MAX_WATER_CUPS_PER_DAY, defaultCups));
  };

  const onSave = async () => {
    if (!uid) return;
    await water.saveTargets({ goalMlPerDay: goalMl });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.backdrop}
      >
        {/* tap outside to close */}
        <Pressable style={styles.overlay} onPress={onClose} />

        {/* Bottom Sheet */}
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Water drinking settings</Text>
              <Text style={styles.sub}>Goal per day (max {MAX_WATER_CUPS_PER_DAY} cups)</Text>
            </View>

            <Pressable onPress={onClose} hitSlop={12} style={styles.iconBtn}>
              <Ionicons name="close" size={18} color={COLORS.subtext} />
            </Pressable>
          </View>

          {/* Current goal */}
          <View style={styles.goalBox}>
            <Text style={styles.goalValue}>{label}</Text>
            <Text style={styles.goalHint}>Each drop = 1 cup</Text>
          </View>

          {/* Slider */}
          <View style={{ marginTop: 16 }}>
            <View style={styles.sliderRow}>
              <Text style={styles.sliderMin}>1</Text>
              <Text style={styles.sliderMax}>{MAX_WATER_CUPS_PER_DAY}</Text>
            </View>

            <Slider
              value={cups}
              onValueChange={(v) => setCups(Math.round(v))}
              minimumValue={1}
              maximumValue={MAX_WATER_CUPS_PER_DAY}
              step={1}
              minimumTrackTintColor={COLORS.primary}
              maximumTrackTintColor={COLORS.border}
              thumbTintColor={COLORS.primary}
              style={{ marginTop: 6 }}
            />
          </View>

          {/* Actions */}
          <View style={styles.actionsRow}>
            <Pressable onPress={onReset} style={[styles.btn, styles.btnGhost]}>
              <Text style={[styles.btnText, styles.btnTextGhost]}>Reset</Text>
            </Pressable>

            <Pressable
              onPress={onSave}
              disabled={!canSave}
              style={[styles.btn, styles.btnPrimary, !canSave && { opacity: 0.5 }]}
            >
              <Text style={[styles.btnText, styles.btnTextPrimary]}>Save</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  overlay: {
    flex: 1,
  },
  sheet: {
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 18,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,

    backgroundColor: "rgba(20,20,20,0.98)",

    ...Platform.select({
      android: { elevation: 14 },
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: -6 },
      },
    }),
  },
  handle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900",
  },
  sub: {
    color: COLORS.subtext,
    fontWeight: "800",
    marginTop: 4,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  goalBox: {
    marginTop: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  goalValue: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900",
  },
  goalHint: {
    marginTop: 6,
    color: COLORS.subtext,
    fontWeight: "700",
    fontSize: 12,
  },
  sliderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sliderMin: { color: COLORS.subtext, fontWeight: "800", fontSize: 12 },
  sliderMax: { color: COLORS.subtext, fontWeight: "800", fontSize: 12 },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  btn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnGhost: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "transparent",
  },
  btnPrimary: {
    backgroundColor: COLORS.primary,
  },
  btnText: { fontWeight: "900", fontSize: 14 },
  btnTextGhost: { color: COLORS.text },
  btnTextPrimary: { color: "white" },
});
