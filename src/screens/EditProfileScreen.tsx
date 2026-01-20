import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  ScrollView,
  Image,
  Platform,
  Modal,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";

import { Screen } from "../components/ui/Screen";
import { Card } from "../components/ui/Card";
import { TextField } from "../components/ui/TextField";
import { PrimaryButton } from "../components/ui/PrimaryButton";
import { COLORS } from "../theme/colors";

import { useAuth } from "../services/AuthContext";
import { useUserProfile } from "../hooks/useUserProfile";
import { updateUserProfile } from "../services/firestoreProfile";
import type { ProfileStackParamList } from "../types/navigation";

import { uploadProfilePhoto } from "../services/storageProfilePhoto";

type Props = NativeStackScreenProps<ProfileStackParamList, "EditProfile">;

function onlyDigits(s: string) {
  return s.replace(/[^\d]/g, "");
}

function formatDateLabel(iso: string | null) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d} / ${m} / ${y}`;
}

function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function titleCase(s?: string) {
  if (!s) return "-";
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ---------- options ---------- */

const EXERCISE_OPTIONS = [
  { key: "exercise_everyday", title: "Very active" },
  { key: "exercise_3_5_days_week", title: "Moderate (3-5 days/week)" },
  { key: "exercise_1_2_days_week", title: "Light (1-2 days/week)" },
  { key: "not_exercise", title: "Sedentary" },
] as const;

const GOAL_OPTIONS = [
  { key: "lose_weight", title: "Lose Weight" },
  { key: "gain_weight", title: "Gain Weight" },
  { key: "maintain_weight", title: "Maintain Weight" },
  { key: "maintain_muscle", title: "Maintain Muscle" },
] as const;

/* Default tab bar styles to restore */
const defaultTabBarStyle = {
  position: "absolute" as const,
  left: 14,
  right: 14,
  bottom: 14,
  height: 64,
  borderRadius: 999,
  backgroundColor: "#2f7cf6",
  borderTopWidth: 0,
  paddingHorizontal: 6,
  paddingTop: 12,
  paddingBottom: 6,
  overflow: "hidden" as const,
  ...Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOpacity: 0.18,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
    },
    android: { elevation: 10 },
  }),
};

/* ---------------- UI helpers (local only; no impact elsewhere) ---------------- */

function SectionHeader({
  icon,
  title,
  accent,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  accent: string;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 2 }}>
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 999,
          backgroundColor: "rgba(255,255,255,0.06)",
          borderWidth: 1,
          borderColor: COLORS.border,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={16} color={accent} />
      </View>
      <Text style={{ color: COLORS.text, fontWeight: "900", fontSize: 14 }}>
        {title}
      </Text>
    </View>
  );
}

function FieldBox({
  label,
  value,
  placeholder,
  onPress,
  leftIcon,
  rightIcon = "chevron-down",
  disabled,
}: {
  label: string;
  value?: string | null;
  placeholder?: string;
  onPress: () => void;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
}) {
  const hasValue = !!value && value.trim().length > 0;

  return (
    <View style={{ flex: 1, gap: 6 }}>
      <Text style={{ color: COLORS.text, fontWeight: "900" }}>{label}</Text>

      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 12,
          paddingVertical: 12,
          paddingHorizontal: 12,
          backgroundColor: COLORS.surface2,
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {leftIcon ? (
          <Ionicons name={leftIcon} size={16} color={COLORS.subtext} />
        ) : null}

        <Text
          style={{
            flex: 1,
            color: hasValue ? COLORS.text : COLORS.subtext,
            fontWeight: "800",
          }}
          numberOfLines={1}
        >
          {hasValue ? value : placeholder ?? "-"}
        </Text>

        <Ionicons name={rightIcon} size={16} color={COLORS.subtext} />
      </Pressable>
    </View>
  );
}

function PickerModal({
  visible,
  title,
  onClose,
  items,
  selectedKey,
  onSelect,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  items: Array<{ key: string; label: string }>;
  selectedKey?: string;
  onSelect: (k: string) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.6)",
          padding: 16,
          justifyContent: "flex-end",
        }}
      >
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: COLORS.surface,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: COLORS.border,
            padding: 14,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{ color: COLORS.text, fontWeight: "900", fontSize: 16, flex: 1 }}>
              {title}
            </Text>

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
              <Ionicons name="close" size={18} color={COLORS.text} />
            </Pressable>
          </View>

          <View style={{ marginTop: 12, gap: 10 }}>
            {items.map((it) => {
              const active = it.key === selectedKey;
              return (
                <Pressable
                  key={it.key}
                  onPress={() => {
                    onSelect(it.key);
                    onClose();
                  }}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: active ? COLORS.primary : COLORS.border,
                    backgroundColor: COLORS.surface2,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <Ionicons
                    name={active ? "checkmark-circle" : "ellipse-outline"}
                    size={18}
                    color={active ? COLORS.primary : COLORS.subtext}
                  />
                  <Text style={{ color: COLORS.text, fontWeight: "800", flex: 1 }}>
                    {it.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function SecondaryButton({
  title,
  onPress,
  disabled,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        flex: 1,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: "center",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <Text style={{ color: COLORS.text, fontWeight: "900", fontSize: 16 }}>
        {title}
      </Text>
    </Pressable>
  );
}

/* ---------------- Screen ---------------- */

export default function EditProfileScreen({ navigation }: Props) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const { profile, loading } = useUserProfile(uid);

  // Hide tab bar when this screen is focused
  useFocusEffect(
    React.useCallback(() => {
      const parent = navigation.getParent();
      parent?.setOptions({
        tabBarStyle: { display: "none" },
      });
      return () => {
        // Restore tab bar when leaving
        parent?.setOptions({
          tabBarStyle: defaultTabBarStyle,
        });
      };
    }, [navigation])
  );

  const initial = useMemo(() => {
    const weightKg = profile.weightKg ?? (profile as any).weight_kg;
    const heightCm = profile.heightCm ?? (profile as any).height_cm;
    const sex = (profile as any).sex;
    const exerciseStyle =
      (profile as any).exerciseStyle ?? (profile as any).exercise_style;
    const goal = (profile as any).goal ?? (profile as any).goalType;
    const dob =
      typeof (profile as any).dob === "string" ? (profile as any).dob : null;

    return {
      weightKg: weightKg != null ? String(Math.round(Number(weightKg))) : "",
      heightCm: heightCm != null ? String(Math.round(Number(heightCm))) : "",
      sex: (sex as "male" | "female" | undefined) ?? undefined,
      exerciseStyle: exerciseStyle as string | undefined,
      goal: goal as string | undefined,
      firstName:
        typeof (profile as any).firstName === "string"
          ? (profile as any).firstName
          : "",
      lastName:
        typeof (profile as any).lastName === "string"
          ? (profile as any).lastName
          : "",
      dob,
    };
  }, [profile]);

  const [sex, setSex] = useState<"male" | "female" | undefined>(undefined);
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [exerciseStyle, setExerciseStyle] = useState<string | undefined>(undefined);
  const [goal, setGoal] = useState<string | undefined>(undefined);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [dob, setDob] = useState<string | null>(null);
  const [showDobPicker, setShowDobPicker] = useState(false);

  const [photoLocalUri, setPhotoLocalUri] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [openGender, setOpenGender] = useState(false);
  const [openGoal, setOpenGoal] = useState(false);
  const [openActivity, setOpenActivity] = useState(false);

  useEffect(() => {
    if (loading) return;
    setSex(initial.sex);
    setHeightCm(initial.heightCm);
    setWeightKg(initial.weightKg);
    setExerciseStyle(initial.exerciseStyle);
    setGoal(initial.goal);
    setFirstName(initial.firstName);
    setLastName(initial.lastName);
    setDob(initial.dob);
  }, [loading, initial]);

  const pickProfileImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission required", "Please allow photo access.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled) setPhotoLocalUri(result.assets[0].uri);
  };

  const validate = () => {
    if (!uid) return "Not logged in";
    if (!dob) return "Please select date of birth";
    if (!sex) return "Please select gender";

    const fn = firstName.trim();
    const ln = lastName.trim();
    if ((fn && !ln) || (!fn && ln)) {
      return "Please enter both first name and last name";
    }

    const h = Number(heightCm);
    const w = Number(weightKg);

    if (!h || h < 120 || h > 230) return "Height must be 120–230 cm";
    if (!w || w < 30 || w > 250) return "Weight must be 30–250 kg";
    if (!exerciseStyle) return "Please select activity level";
    if (!goal) return "Please select goal";

    return null;
  };

  const onSave = async () => {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    try {
      setSaving(true);
      setError(null);

      let photoURL: string | undefined = undefined;
      if (photoLocalUri) {
        photoURL = await uploadProfilePhoto(uid!, photoLocalUri);
      }

      await updateUserProfile(uid!, {
        sex,
        heightCm: Number(heightCm),
        weightKg: Number(weightKg),
        exerciseStyle,
        goal,
        goalType: goal,
        firstName: firstName.trim() ? firstName.trim() : null,
        lastName: lastName.trim() ? lastName.trim() : null,
        dob,
        ...(photoURL ? { photoURL } : {}),
      });

      Alert.alert("Saved", "Your profile has been updated.");
      navigation.goBack();
    } catch (e: any) {
      setError(e?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const goalLabel =
    GOAL_OPTIONS.find((x) => x.key === goal)?.title ??
    (goal ? titleCase(goal) : "");
  const activityLabel =
    EXERCISE_OPTIONS.find((x) => x.key === exerciseStyle)?.title ??
    (exerciseStyle ? titleCase(exerciseStyle) : "");
  const genderLabel = sex === "male" ? "Male" : sex === "female" ? "Female" : "";

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 120,
          gap: 14,
        }}
      >
        {/* Header (title + close) */}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ width: 40, height: 40 }} />
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: "900" }}>
              Edit Profile
            </Text>
          </View>
          <Pressable
            onPress={() => navigation.goBack()}
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
            <Ionicons name="close" size={20} color={COLORS.text} />
          </Pressable>
        </View>

        {/* Photo card */}
        <View
          style={{
            borderWidth: 1,
            borderColor: COLORS.border,
            backgroundColor: COLORS.surface,
            borderRadius: 18,
            padding: 14,
          }}
        >
          <View style={{ alignItems: "center", gap: 10 }}>
            <View
              style={{
                width: 92,
                height: 92,
                borderRadius: 46,
                borderWidth: 2,
                borderColor: COLORS.primary,
                backgroundColor: COLORS.surface2,
                overflow: "hidden",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {photoLocalUri ? (
                <Image
                  source={{ uri: photoLocalUri }}
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (profile as any)?.photoURL ? (
                <Image
                  source={{ uri: (profile as any).photoURL }}
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (
                <Ionicons name="person" size={34} color={COLORS.subtext} />
              )}

              <Pressable
                onPress={pickProfileImage}
                style={{
                  position: "absolute",
                  right: 6,
                  bottom: 6,
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: COLORS.primary,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 2,
                  borderColor: COLORS.surface,
                }}
              >
                <Ionicons name="camera" size={14} color={COLORS.text} />
              </Pressable>
            </View>

            <Text style={{ color: COLORS.subtext, fontWeight: "700", fontSize: 12 }}>
              Click the camera icon to change photo
            </Text>
          </View>
        </View>

        {/* Personal Information */}
        <SectionHeader
          icon="person-outline"
          title="Personal Information"
          accent={COLORS.primary}
        />

        <Card style={{ gap: 12 }}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <TextField label="First Name" value={firstName} onChange={setFirstName} />
            </View>
            <View style={{ flex: 1 }}>
              <TextField label="Last Name" value={lastName} onChange={setLastName} />
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <FieldBox
              label="Date of birth"
              value={dob ? formatDateLabel(dob) : ""}
              placeholder="Select date"
              leftIcon="calendar-outline"
              onPress={() => setShowDobPicker(true)}
              disabled={saving}
            />

            <FieldBox
              label="Gender"
              value={genderLabel}
              placeholder="Select gender"
              leftIcon="male-female-outline"
              onPress={() => setOpenGender(true)}
              disabled={saving}
            />
          </View>

          {showDobPicker && (
            <DateTimePicker
              value={dob ? new Date(dob) : new Date(2000, 0, 1)}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(_, date) => {
                setShowDobPicker(false);
                if (date) setDob(toISODate(date));
              }}
            />
          )}
        </Card>

        {/* Physical Stats */}
        <SectionHeader icon="pulse-outline" title="Physical Stats" accent={COLORS.success} />

        <Card style={{ gap: 12 }}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <TextField
                label="Height (cm)"
                value={heightCm}
                onChange={(t) => setHeightCm(onlyDigits(t))}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextField
                label="Weight (kg)"
                value={weightKg}
                onChange={(t) => setWeightKg(onlyDigits(t))}
                keyboardType="numeric"
              />
            </View>
          </View>
        </Card>

        {/* Fitness Goals */}
        <SectionHeader
          icon="radio-button-on-outline"
          title="Fitness Goals"
          accent={COLORS.accent}
        />

        <Card style={{ gap: 12 }}>
          <FieldBox
            label="Primary Goal"
            value={goalLabel}
            placeholder="Select goal"
            onPress={() => setOpenGoal(true)}
            disabled={saving}
          />

          <FieldBox
            label="Activity Level"
            value={activityLabel}
            placeholder="Select level"
            onPress={() => setOpenActivity(true)}
            disabled={saving}
          />

          {error ? (
            <Text style={{ color: COLORS.danger, fontWeight: "800" }}>{error}</Text>
          ) : null}
        </Card>

        {/* Action buttons (NOT fixed; scroll with content) */}
        <View style={{ flexDirection: "row", gap: 12, marginTop: 6 }}>
          <SecondaryButton
            title="Cancel"
            onPress={() => navigation.goBack()}
            disabled={saving}
          />
          <View style={{ flex: 1 }}>
            <PrimaryButton
              title={saving ? "Saving..." : "Save Changes"}
              onPress={onSave}
              disabled={saving}
            />
          </View>
        </View>

        {/* Extra bottom spacing (so last buttons breathe) */}
        <View style={{ height: 8 }} />
      </ScrollView>

      {/* Modals */}
      <PickerModal
        visible={openGender}
        title="Select Gender"
        onClose={() => setOpenGender(false)}
        selectedKey={sex}
        items={[
          { key: "male", label: "Male" },
          { key: "female", label: "Female" },
        ]}
        onSelect={(k) => setSex(k as any)}
      />

      <PickerModal
        visible={openGoal}
        title="Select Goal"
        onClose={() => setOpenGoal(false)}
        selectedKey={goal}
        items={GOAL_OPTIONS.map((g) => ({ key: g.key, label: g.title }))}
        onSelect={(k) => setGoal(k)}
      />

      <PickerModal
        visible={openActivity}
        title="Select Activity Level"
        onClose={() => setOpenActivity(false)}
        selectedKey={exerciseStyle}
        items={EXERCISE_OPTIONS.map((x) => ({ key: x.key, label: x.title }))}
        onSelect={(k) => setExerciseStyle(k)}
      />
    </Screen>
  );
}
