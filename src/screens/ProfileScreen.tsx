import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
  Alert,
  Modal,
  FlatList,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { ProfileStackParamList } from "../types/navigation";

import { useAuth } from "../services/AuthContext";
import { Screen } from "../components/ui/Screen";
import { Card } from "../components/ui/Card";
import { COLORS } from "../theme/colors";
import { RADIUS } from "../theme/radius";

import { useUserProfile } from "../hooks/useUserProfile";
import { useStreakStats } from "../hooks/useStreakStats";
import { calcBMI } from "../utils/healthCalc";

import { useActivityToday } from "../hooks/useActivityToday";
import { useWater } from "../hooks/useWater";
import { useBurnTarget } from "../hooks/useBurnTarget";
import { useTodayNutrition } from "../hooks/useTodayNutrition";

import {
  ACHIEVEMENT_DEFS,
  subscribeAchievements,
  type AchievementDoc,
} from "../services/firestoreAchievements";

/* ---------- Firebase Auth (for reset password + logout) ---------- */
import {
  signOut,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { auth } from "../services/firebase";

/* ---------- icons (เหมือนที่ใช้ใน AchievementsScreen) ---------- */
import burnIcon from "../../assets/iconachievements/burn.png";
import calorieIcon from "../../assets/iconachievements/calorie.png";
import fireIcon from "../../assets/iconachievements/fire.png";

type TabKey = "overview" | "goals" | "achievements";
type BadgeKey = "burn" | "calorie" | "fire";

type Nav = NativeStackNavigationProp<ProfileStackParamList, "ProfileHome">;

function formatMemberSince(creationTime?: string | null) {
  if (!creationTime) return "-";
  const d = new Date(creationTime);
  if (Number.isNaN(d.getTime())) return "-";
  const month = d.toLocaleString("en-US", { month: "short" });
  const year = d.getFullYear();
  return `${month} ${year}`;
}

function titleCase(s?: string) {
  if (!s) return "-";
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function clamp01(n: number) {
  // FIX: กัน NaN/Infinity เพื่อไม่ให้ width เป็น "NaN%"
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function formatUnlockedAt(v: any) {
  try {
    const d: Date | null =
      v?.toDate?.() instanceof Date ? (v.toDate() as Date) : null;
    if (!d) return null;

    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return null;
  }
}

type StatTileProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  accent?: string;
};

function StatTile({ icon, label, value, accent }: StatTileProps) {
  return (
    <Card style={{ flex: 1, paddingVertical: 16 }}>
      <View style={{ gap: 10 }}>
        <Ionicons name={icon} size={18} color={accent ?? COLORS.primary} />
        <Text style={{ color: COLORS.subtext, fontSize: 12 }}>{label}</Text>
        <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: "800" }}>
          {value}
        </Text>
      </View>
    </Card>
  );
}

function SegmentedTabs({
  value,
  onChange,
}: {
  value: TabKey;
  onChange: (v: TabKey) => void;
}) {
  const items: { key: TabKey; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "goals", label: "Goals" },
    { key: "achievements", label: "Achievements" },
  ];

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 999,
        padding: 4,
        gap: 6,
      }}
    >
      {items.map((it) => {
        const active = it.key === value;
        return (
          <Pressable
            key={it.key}
            onPress={() => onChange(it.key)}
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 8,
              borderRadius: 999,
              backgroundColor: active ? COLORS.primary : "transparent",
            }}
          >
            <Text
              style={{
                color: active ? COLORS.text : COLORS.subtext,
                fontWeight: active ? "900" : "700",
                fontSize: 12,
              }}
              numberOfLines={1}
            >
              {it.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ProgressRow({
  icon,
  label,
  rightText,
  progress01,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  rightText: string;
  progress01: number;
  color?: string; // optional เพื่อไม่กระทบ call site อื่น
}) {
  const p = clamp01(progress01);

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Ionicons name={icon} size={16} color={COLORS.primary} />
        <Text style={{ color: COLORS.text, fontWeight: "800", marginLeft: 8 }}>
          {label}
        </Text>

        <View style={{ flex: 1 }} />

        <Text style={{ color: COLORS.subtext, fontWeight: "800" }}>
          {rightText}
        </Text>
      </View>

      {/* Bar (match mockup: higher + colored) */}
      <View
        style={{
          height: 12,
          borderRadius: 999,
          backgroundColor: "rgba(255,255,255,0.08)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.10)",
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: `${Math.round(p * 100)}%`,
            height: "100%",
            borderRadius: 999,
            backgroundColor: color ?? COLORS.primary,
          }}
        />
      </View>
    </View>
  );
}

function TodayProgressCard({
  uid,
  burnProfile,
}: {
  uid: string | null;
  burnProfile: any | null;
}) {
  const { totals } = useActivityToday(uid);
  const { burnTarget } = useBurnTarget(uid, burnProfile);
  const water = useWater(uid);

  // Steps: ในโปรเจกต์ตอนนี้ยังไม่มี data จริง
  const stepsToday = 0;
  const stepsTarget = 10000;

  const stepsPct = stepsTarget > 0 ? stepsToday / stepsTarget : 0;
  const burnPct = burnTarget > 0 ? totals.totalBurned / burnTarget : 0;

  return (
    <Card style={{ paddingVertical: 14 }}>
      <View style={{ gap: 2, marginBottom: 12 }}>
        <Text style={{ color: COLORS.text, fontWeight: "900", fontSize: 16 }}>
          Today&apos;s Progress
        </Text>
        <Text style={{ color: COLORS.subtext, fontSize: 12, fontWeight: "700" }}>
          Track your daily fitness goals
        </Text>
      </View>

      <View style={{ gap: 14 }}>
        <ProgressRow
          icon="footsteps-outline"
          label="Steps"
          rightText={`${stepsToday.toLocaleString()} / ${stepsTarget.toLocaleString()} steps`}
          progress01={stepsPct}
          color="#4da3ff"
        />

        <ProgressRow
          icon="flame-outline"
          label="Calories Burned"
          rightText={`${totals.totalBurned} / ${Math.round(burnTarget)} kcal`}
          progress01={burnPct}
          color="#22c55e"
        />

        <ProgressRow
          icon="water-outline"
          label="Drinking water"
          rightText={`${water.todayCups} / ${water.goalCups} liters`}
          progress01={water.progress01}
          color="#38bdf8"
        />
      </View>
    </Card>
  );
}

function NutritionGoalsCard({ uid }: { uid: string | null }) {
  const { totals, goals, progress } = useTodayNutrition(uid);

  return (
    <Card style={{ paddingVertical: 14 }}>
      <View style={{ gap: 2, marginBottom: 12 }}>
        <Text style={{ color: COLORS.text, fontWeight: "900", fontSize: 16 }}>
          Nutrition goals
        </Text>
        <Text style={{ color: COLORS.subtext, fontSize: 12, fontWeight: "700" }}>
          Track your daily nutrition goals
        </Text>
      </View>

      <View style={{ gap: 14 }}>
        <ProgressRow
          icon="fitness-outline"
          label="Protein"
          rightText={`${totals.totalProtein} / ${Math.round(goals.proteinTarget)} grams`}
          progress01={progress.proteinPct}
          color="#a855f7"
        />

        <ProgressRow
          icon="leaf-outline"
          label="Carbohydrate"
          rightText={`${totals.totalCarbs} / ${Math.round(goals.carbTarget)} grams`}
          progress01={progress.carbPct}
          color="#f59e0b"
        />

        <ProgressRow
          icon="water-outline"
          label="Fats"
          rightText={`${totals.totalFat} / ${Math.round(goals.fatTarget)} grams`}
          progress01={progress.fatPct}
          color="#22c55e"
        />
      </View>
    </Card>
  );
}

/* ---------------- Achievements (Step 5) ---------------- */

const BADGE_META: Record<
  BadgeKey,
  { title: string; icon: any; color: string; rule: string }
> = {
  burn: {
    title: "Burn Streak",
    icon: burnIcon,
    color: "#5e97d3",
    rule: "Burn calories reaching your daily burn target continuously.",
  },
  calorie: {
    title: "Calorie Streak",
    icon: calorieIcon,
    color: "#00bf63",
    rule: "Consume calories reaching your daily calorie target continuously.",
  },
  fire: {
    title: "Fire Streak",
    icon: fireIcon,
    color: "#ffca08",
    rule: "Reach both burn and calorie targets every day without missing.",
  },
};

function AchievementsCard({ uid }: { uid: string | null }) {
  const [ach, setAch] = useState<Record<string, AchievementDoc>>({});
  const [openType, setOpenType] = useState<BadgeKey | null>(null);

  useEffect(() => {
    if (!uid) return;
    return subscribeAchievements(uid, setAch);
  }, [uid]);

  const unlockedSorted = useMemo(() => {
    const list: Array<AchievementDoc & { title: string; description: string }> =
      [];

    for (const def of ACHIEVEMENT_DEFS) {
      const doc = ach[def.id];
      if (!doc?.unlocked) continue;

      list.push({
        ...doc,
        title: def.title,
        description: def.description,
      });
    }

    const ts = (v: any) => {
      try {
        const d = v?.toDate?.() instanceof Date ? (v.toDate() as Date) : null;
        return d ? d.getTime() : 0;
      } catch {
        return 0;
      }
    };

    list.sort((a, b) => ts(b.unlockedAt) - ts(a.unlockedAt));
    return list.slice(0, 3);
  }, [ach]);

  const groupedByType = useMemo(() => {
    const byType: Record<BadgeKey, AchievementDoc[]> = {
      burn: [],
      calorie: [],
      fire: [],
    };

    for (const def of ACHIEVEMENT_DEFS) {
      const doc = ach[def.id] ?? {
        id: def.id,
        type: def.type,
        targetDays: def.targetDays,
        unlocked: false,
        unlockedAt: null,
      };
      byType[def.type as BadgeKey].push(doc);
    }

    (Object.keys(byType) as BadgeKey[]).forEach((k) =>
      byType[k].sort((a, b) => a.targetDays - b.targetDays)
    );

    return byType;
  }, [ach]);

  const badgeCount = useMemo(() => {
    const countUnlocked = (k: BadgeKey) =>
      groupedByType[k].filter((x) => x.unlocked).length;

    return {
      burn: countUnlocked("burn"),
      calorie: countUnlocked("calorie"),
      fire: countUnlocked("fire"),
    };
  }, [groupedByType]);

  const modalData = useMemo(() => {
    if (!openType) return null;
    const meta = BADGE_META[openType];
    return {
      ...meta,
      list: groupedByType[openType],
    };
  }, [openType, groupedByType]);

  return (
    <Card style={{ paddingVertical: 14 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <View style={{ gap: 2 }}>
          <Text style={{ color: COLORS.text, fontWeight: "900", fontSize: 16 }}>
            Recent Achievements
          </Text>
          <Text
            style={{ color: COLORS.subtext, fontSize: 12, fontWeight: "700" }}
          >
            Celebrate your fitness milestones
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: 8 }}>
          {(Object.keys(BADGE_META) as BadgeKey[]).map((k) => {
            const meta = BADGE_META[k];
            const locked = badgeCount[k] === 0;

            return (
              <Pressable
                key={k}
                onPress={() => setOpenType(k)}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: meta.color,
                  opacity: locked ? 0.35 : 1,
                }}
              >
                <Image
                  source={meta.icon}
                  style={{ width: 22, height: 22, resizeMode: "contain" }}
                />
              </Pressable>
            );
          })}
        </View>
      </View>

      {unlockedSorted.length === 0 ? (
        <View
          style={{
            padding: 12,
            borderRadius: RADIUS.md,
            borderWidth: 1,
            borderColor: COLORS.border,
            backgroundColor: COLORS.surface,
          }}
        >
          <Text style={{ color: COLORS.subtext, fontWeight: "700" }}>
            No achievements unlocked yet.
          </Text>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {unlockedSorted.map((it) => {
            const meta = BADGE_META[it.type as BadgeKey];
            const unlockedAt = formatUnlockedAt(it.unlockedAt);

            return (
              <View
                key={it.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  padding: 12,
                  borderRadius: RADIUS.md,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  backgroundColor: COLORS.surface,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 14,
                    backgroundColor: meta?.color ?? COLORS.primary,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Image
                    source={meta?.icon ?? burnIcon}
                    style={{ width: 22, height: 22, resizeMode: "contain" }}
                  />
                </View>

                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ color: COLORS.text, fontWeight: "900" }}>
                    {it.title}
                  </Text>
                  <Text style={{ color: COLORS.subtext, fontSize: 12 }}>
                    {unlockedAt ? unlockedAt : "Unlocked"}
                  </Text>
                </View>

                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={COLORS.success}
                />
              </View>
            );
          })}
        </View>
      )}

      <Modal visible={!!openType} transparent animationType="fade">
        <Pressable
          onPress={() => setOpenType(null)}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "flex-end",
            padding: 16,
          }}
        >
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: COLORS.surface,
              borderRadius: 18,
              padding: 14,
              borderWidth: 1,
              borderColor: COLORS.border,
              maxHeight: "75%",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text
                style={{
                  color: modalData?.color ?? COLORS.primary,
                  fontSize: 18,
                  fontWeight: "900",
                  flex: 1,
                }}
              >
                {modalData?.title ?? "Achievement"}
              </Text>

              <Pressable
                onPress={() => setOpenType(null)}
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

            <Text
              style={{
                color: COLORS.subtext,
                fontSize: 12,
                marginTop: 6,
                marginBottom: 12,
              }}
            >
              {modalData?.rule ?? ""}
            </Text>

            <FlatList
              data={modalData?.list ?? []}
              keyExtractor={(it) => it.id}
              renderItem={({ item }) => {
                const unlockedAt = formatUnlockedAt(item.unlockedAt);
                return (
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: 10,
                    }}
                  >
                    <Text style={{ color: COLORS.text, fontWeight: "800" }}>
                      {item.targetDays} days
                    </Text>
                    <Text style={{ color: COLORS.subtext, fontSize: 12 }}>
                      {item.unlocked
                        ? unlockedAt
                          ? `Unlocked at ${unlockedAt}`
                          : "Unlocked"
                        : "Locked"}
                    </Text>
                  </View>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </Card>
  );
}

/* ======================= MAIN SCREEN ======================= */

export default function ProfileScreen() {
  const navigation = useNavigation<Nav>();

  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const { profile } = useUserProfile(uid);
  const { currentSuccessStreak } = useStreakStats(uid);

  const [tab, setTab] = useState<TabKey>("overview");

  const memberSince = useMemo(
    () => formatMemberSince(user?.metadata?.creationTime ?? null),
    [user?.metadata?.creationTime]
  );

  const weightKg =
    (profile as any)?.weightKg ??
    (profile as any)?.weight_kg ??
    (profile as any)?.weight ??
    undefined;

  const heightCm =
    (profile as any)?.heightCm ??
    (profile as any)?.height_cm ??
    (profile as any)?.height ??
    undefined;

  const age = (profile as any)?.age;
  const sex = (profile as any)?.sex;
  const goal = (profile as any)?.goalType ?? (profile as any)?.goal;
  const exerciseStyle =
    (profile as any)?.exerciseStyle ?? (profile as any)?.exercise_style;

  const bmi = useMemo(() => {
    if (!heightCm || !weightKg) return undefined;
    if (!Number.isFinite(heightCm) || !Number.isFinite(weightKg)) return undefined;
    if (heightCm <= 0 || weightKg <= 0) return undefined;
    return calcBMI(Number(heightCm), Number(weightKg));
  }, [heightCm, weightKg]);

  const burnProfile = useMemo(() => {
    if (
      !profile ||
      age == null ||
      !heightCm ||
      !weightKg ||
      !sex ||
      !exerciseStyle ||
      !goal
    ) {
      return null;
    }

    return {
      sex,
      age: Number(age),
      heightCm: Number(heightCm),
      weightKg: Number(weightKg),
      exerciseStyle,
      goalType: goal,
    };
  }, [profile, age, heightCm, weightKg, sex, exerciseStyle, goal]);

  // Display name: prefer Firestore first/last name if both exist, else fallback to auth displayName
  const firstName = (profile as any)?.firstName;
  const lastName = (profile as any)?.lastName;
  const displayName =
    firstName && lastName
      ? `${String(firstName)} ${String(lastName)}`.trim()
      : user?.displayName || "User";

  // IMPORTANT: prefer Firestore photoURL (what you update on edit profile)
  const avatarUrl = (profile as any)?.photoURL || user?.photoURL || "";

  /* ================= Reset password (in-app) ================= */
  const [pwModal, setPwModal] = useState(false);
  const [pwBusy, setPwBusy] = useState(false);
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");

  const email = auth.currentUser?.email ?? null;

  const hasPasswordProvider = useMemo(() => {
    const providers = auth.currentUser?.providerData?.map((p) => p.providerId) ?? [];
    return providers.includes("password");
  }, []);

  function openResetPassword() {
    if (!auth.currentUser) {
      Alert.alert("Error", "No signed-in user.");
      return;
    }
    if (!email || !hasPasswordProvider) {
      Alert.alert(
        "Unavailable",
        "This account does not use email/password sign-in, so password cannot be changed here."
      );
      return;
    }
    setPwModal(true);
  }

  async function submitResetPassword() {
    if (pwBusy) return;

    if (!auth.currentUser) {
      Alert.alert("Error", "No signed-in user.");
      return;
    }
    if (!email) {
      Alert.alert("Error", "No email found for this account.");
      return;
    }
    if (!curPw.trim()) {
      Alert.alert("Missing", "Please enter your current password.");
      return;
    }
    if (!newPw.trim()) {
      Alert.alert("Missing", "Please enter a new password.");
      return;
    }
    if (newPw.length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return;
    }
    if (newPw !== newPw2) {
      Alert.alert("Mismatch", "New password and confirm password do not match.");
      return;
    }

    setPwBusy(true);
    try {
      const cred = EmailAuthProvider.credential(email, curPw);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await updatePassword(auth.currentUser, newPw);

      setPwModal(false);
      setCurPw("");
      setNewPw("");
      setNewPw2("");
      Alert.alert("Success", "Password updated successfully.");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to update password.");
    } finally {
      setPwBusy(false);
    }
  }

  function doLogout() {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut(auth);
          } catch (e: any) {
            Alert.alert("Error", e?.message ?? "Failed to log out");
          }
        },
      },
    ]);
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 140,
          gap: 14,
        }}
      >
        {/* ---------- Header  ---------- */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingVertical: 14,
            paddingHorizontal: 6,
            marginBottom: 6,
          }}
        >
          {/* Left: Avatar + Name */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            {/* Avatar */}
            {avatarUrl ? (
              <Image
                key={avatarUrl}
                source={{ uri: avatarUrl }}
                style={{
                  width: 72, // ใหญ่ขึ้น
                  height: 72,
                  borderRadius: 36,
                  borderWidth: 3,
                  borderColor: "#3b82f6",
                  backgroundColor: COLORS.surface,
                }}
              />
            ) : (
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  borderWidth: 3,
                  borderColor: "#3b82f6",
                  backgroundColor: COLORS.surface,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: COLORS.text,
                    fontWeight: "900",
                    fontSize: 26,
                  }}
                >
                  {displayName?.[0]?.toUpperCase() ?? "U"}
                </Text>
              </View>
            )}

            {/* Name + Member since */}
            <View style={{ gap: 4 }}>
              <Text
                style={{
                  color: COLORS.text,
                  fontSize: 20,
                  fontWeight: "900",
                }}
                numberOfLines={1}
              >
                {displayName}
              </Text>

              <Text
                style={{
                  color: COLORS.subtext,
                  fontSize: 13,
                  fontWeight: "600",
                }}
              >
                Member since {memberSince}
              </Text>
            </View>
          </View>

          {/* Right: Streak */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: "rgba(255,80,0,0.12)",
            }}
          >
            <Ionicons name="flame" size={28} color="#ff3b00" />
            <Text
              style={{
                color: "#ff3b00",
                fontWeight: "900",
                fontSize: 18,
              }}
            >
              {currentSuccessStreak ?? 0}
            </Text>
          </View>
        </View>

        {/* ---------- Actions: Edit Profile + Health History (LARGE) ---------- */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            marginTop: 6,
            marginBottom: 6,
          }}
        >
          {/* Edit Profile */}
          <Pressable
            onPress={() => navigation.navigate("EditProfile")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 14,
              backgroundColor: COLORS.primary,
              minHeight: 44,
            }}
          >
            <Ionicons name="create-outline" size={18} color={COLORS.text} />
            <Text
              style={{
                color: COLORS.text,
                fontWeight: "900",
                fontSize: 14,
              }}
            >
              Edit Profile
            </Text>
          </Pressable>

          {/* Health History */}
          <Pressable
            onPress={() => (navigation as any).navigate("HealthHistory")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 14,
              backgroundColor: COLORS.surface2,
              borderWidth: 1.5,
              borderColor: COLORS.border,
              minHeight: 44,
            }}
          >
            <Ionicons name="time-outline" size={18} color={COLORS.text} />
            <Text
              style={{
                color: COLORS.text,
                fontWeight: "900",
                fontSize: 14,
              }}
            >
              Health History
            </Text>
          </Pressable>
        </View>

        {/* ---------- Stats Grid ---------- */}
        <View style={{ gap: 10, marginTop: 6 }}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <StatTile
              icon="person-outline"
              label="Age"
              value={age != null ? String(age) : "-"}
              accent={COLORS.accent}
            />
            <StatTile
              icon="trending-up-outline"
              label="Weight"
              value={weightKg != null ? `${Number(weightKg)} kg` : "-"}
              accent={COLORS.success}
            />
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <StatTile
              icon="pulse-outline"
              label="Height"
              value={heightCm != null ? `${Number(heightCm)} cm` : "-"}
              accent={COLORS.accent}
            />
            <StatTile
              icon="heart-outline"
              label="BMI"
              value={bmi != null ? String(bmi) : "-"}
              accent={COLORS.success}
            />
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <StatTile
              icon="male-female-outline"
              label="Sex"
              value={sex ? titleCase(sex) : "-"}
              accent={COLORS.accent}
            />
            <StatTile
              icon="flag-outline"
              label="Goal"
              value={goal ? titleCase(String(goal)) : "-"}
              accent={COLORS.success}
            />
          </View>
        </View>

        {/* ---------- Tabs ---------- */}
        <SegmentedTabs value={tab} onChange={setTab} />

        {/* ---------- Tab Content ---------- */}
        {tab === "overview" ? (
          <TodayProgressCard uid={uid} burnProfile={burnProfile} />
        ) : null}

        {tab === "goals" ? <NutritionGoalsCard uid={uid} /> : null}

        {tab === "achievements" ? <AchievementsCard uid={uid} /> : null}

        {/* ================= Privacy & Security (ADD) ================= */}
        <View style={{ marginTop: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 999,
                backgroundColor: "rgba(34,197,94,0.15)",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 10,
              }}
            >
              <Ionicons name="shield-checkmark" size={18} color="#22c55e" />
            </View>

            <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: "900" }}>
              Privacy & Security
            </Text>
          </View>

          {/* Reset Password (in-app) */}
          <Pressable
            onPress={openResetPassword}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 14,
              paddingHorizontal: 16,
              borderRadius: 18,
              backgroundColor: COLORS.surface2,
              borderWidth: 1.5,
              borderColor: COLORS.primary,
              marginBottom: 12,
            }}
          >
            <Ionicons name="key-outline" size={20} color={COLORS.primary} />
            <Text
              style={{
                flex: 1,
                marginLeft: 12,
                color: COLORS.text,
                fontSize: 15,
                fontWeight: "800",
              }}
            >
              Reset Password
            </Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.subtext} />
          </Pressable>

          {/* Log Out */}
          <Pressable
            onPress={doLogout}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 14,
              paddingHorizontal: 16,
              borderRadius: 18,
              backgroundColor: COLORS.surface2,
              borderWidth: 1.5,
              borderColor: "#ef4444",
            }}
          >
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text
              style={{
                flex: 1,
                marginLeft: 12,
                color: "#ef4444",
                fontSize: 15,
                fontWeight: "800",
              }}
            >
              Log Out
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#ef4444" />
          </Pressable>
        </View>
      </ScrollView>

      {/* ================= Reset Password Modal ================= */}
      <Modal visible={pwModal} transparent animationType="fade">
        <Pressable
          onPress={() => {
            if (!pwBusy) {
              setPwModal(false);
              setCurPw("");
              setNewPw("");
              setNewPw2("");
            }
          }}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: COLORS.surface,
              borderRadius: 18,
              padding: 16,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: "900" }}>
              Reset Password
            </Text>
            <Text style={{ color: COLORS.subtext, marginTop: 6, lineHeight: 18 }}>
              Enter your current password, then set a new password.
            </Text>

            <View style={{ marginTop: 12, gap: 10 }}>
              <View>
                <Text style={{ color: COLORS.subtext, fontWeight: "800", marginBottom: 6 }}>
                  Current password
                </Text>
                <TextInput
                  value={curPw}
                  onChangeText={setCurPw}
                  placeholder="Current password"
                  placeholderTextColor={COLORS.subtext}
                  secureTextEntry
                  editable={!pwBusy}
                  style={{
                    color: COLORS.text,
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    borderRadius: 14,
                    backgroundColor: COLORS.surface2,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                  }}
                />
              </View>

              <View>
                <Text style={{ color: COLORS.subtext, fontWeight: "800", marginBottom: 6 }}>
                  New password
                </Text>
                <TextInput
                  value={newPw}
                  onChangeText={setNewPw}
                  placeholder="New password (min 6 chars)"
                  placeholderTextColor={COLORS.subtext}
                  secureTextEntry
                  editable={!pwBusy}
                  style={{
                    color: COLORS.text,
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    borderRadius: 14,
                    backgroundColor: COLORS.surface2,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                  }}
                />
              </View>

              <View>
                <Text style={{ color: COLORS.subtext, fontWeight: "800", marginBottom: 6 }}>
                  Confirm new password
                </Text>
                <TextInput
                  value={newPw2}
                  onChangeText={setNewPw2}
                  placeholder="Confirm new password"
                  placeholderTextColor={COLORS.subtext}
                  secureTextEntry
                  editable={!pwBusy}
                  style={{
                    color: COLORS.text,
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    borderRadius: 14,
                    backgroundColor: COLORS.surface2,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                  }}
                />
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
              <Pressable
                onPress={() => {
                  if (!pwBusy) {
                    setPwModal(false);
                    setCurPw("");
                    setNewPw("");
                    setNewPw2("");
                  }
                }}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 14,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: COLORS.surface2,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
                disabled={pwBusy}
              >
                <Text style={{ color: COLORS.text, fontWeight: "900" }}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={() => void submitResetPassword()}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 14,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: COLORS.primary,
                }}
                disabled={pwBusy}
              >
                {pwBusy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "900" }}>Save</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
