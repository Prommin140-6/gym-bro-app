import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
  TextInput,
  SafeAreaView,
  StatusBar,
  Platform,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { COLORS } from "../../theme/colors";
import type { ActivityStackParamList } from "../../types/navigation";
import type { ActivityKey } from "../../utils/met";
import { ACTIVITY_LABEL } from "../../utils/met";

import { useAuth } from "../../services/AuthContext";
import { useUserProfile } from "../../hooks/useUserProfile";
import { ActivityAddModal } from "../../components/activity/ActivityAddModal";
import { useExerciseCatalog, useExercisesForActivityKey } from "../../services/exerciseCatalog";
import type { ExerciseCatalogDoc } from "../../services/exerciseCatalog";

type Props = NativeStackScreenProps<ActivityStackParamList, "ExerciseCollection">;

type CardItem =
  | {
      kind: "group";
      id: string;
      title: string;
      subtitle: string;
      groupId: string;
      count: number;
    }
  | {
      kind: "exercise";
      id: string;
      title: string;
      subtitle: string;
      desc: string;
      imageUri?: string;
      ex?: ExerciseCatalogDoc;
    };

function statusBarPad() {
  return Platform.OS === "android" ? StatusBar.currentHeight ?? 0 : 0;
}

function normalizeMuscle(s: string) {
  return String(s || "").trim().toLowerCase();
}
function hasAnyMuscle(ex: ExerciseCatalogDoc, needles: string[]) {
  const prim = (ex.primaryMuscles || []).map(normalizeMuscle);
  const sec = (ex.secondaryMuscles || []).map(normalizeMuscle);
  const all = new Set([...prim, ...sec]);
  return needles.some((n) => all.has(normalizeMuscle(n)));
}
function needlesForGroup(groupId: string): string[] {
  switch (groupId) {
    case "chest": return ["chest", "pectorals", "triceps", "shoulders"];
    case "back": return ["lats", "middle back", "lower back", "traps", "back"];
    case "legs": return ["quadriceps", "hamstrings", "glutes", "calves", "adductors"];
    case "arms": return ["biceps", "triceps", "forearms"];
    case "shoulders": return ["shoulders", "delts"];
    case "core": return ["abdominals", "core"];
    default: return [];
  }
}

export default function ExerciseCollectionScreen({ route }: Props) {
  const navigation = useNavigation<any>();
  const { activityKey } = route.params as { activityKey: ActivityKey };
  const groupId: string | undefined = (route.params as any)?.groupId;
  const initialSearch: string | undefined = (route.params as any)?.initialSearch;

  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const { profile } = useUserProfile(uid);
  const weightKg = (profile?.weightKg || profile?.weight_kg || 66);

  const { loading } = useExerciseCatalog();

  // ถ้ากด "lifting" แต่ DB map เป็น resistance_training ให้ดึงทั้งสอง
  const listPrimary = useExercisesForActivityKey(activityKey);
  const liftingFallbackKey =
    String(activityKey) === "lifting" ? ("resistance_training" as ActivityKey)
    : String(activityKey) === "resistance_training" ? ("lifting" as ActivityKey)
    : null;
  const listFallback = liftingFallbackKey ? useExercisesForActivityKey(liftingFallbackKey) : [];

  const mergedList: ExerciseCatalogDoc[] = useMemo(() => {
    const a = listPrimary || [];
    const b = listFallback || [];
    const map = new Map<string, ExerciseCatalogDoc>();
    for (const ex of [...a, ...b]) map.set(ex.id, ex);
    return Array.from(map.values());
  }, [listPrimary, listFallback]);

  const [search, setSearch] = useState(initialSearch || "");

  const [selected, setSelected] = useState<CardItem | null>(null);
  const [selectedActivityKey, setSelectedActivityKey] = useState<ActivityKey | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const closeModal = () => {
    setModalVisible(false);
    setSelected(null);
    setSelectedActivityKey(null);
  };

  const isStrengthKey = String(activityKey) === "lifting" || String(activityKey) === "resistance_training";

  const headerTitle = useMemo(() => {
    if (isStrengthKey && groupId) {
      const map: Record<string, string> = {
        chest: "Chest",
        back: "Back",
        legs: "Legs",
        arms: "Arms",
        shoulders: "Shoulders",
        core: "Core",
      };
      return `${ACTIVITY_LABEL[activityKey] ?? "Lifting"} • ${map[groupId] ?? groupId}`;
    }
    return ACTIVITY_LABEL[activityKey] ?? "Exercises";
  }, [activityKey, groupId, isStrengthKey]);

  const items: CardItem[] = useMemo(() => {
    // ถ้าเป็น lifting/resistance และยังไม่เลือก groupId → แสดง workout parts
    if (isStrengthKey && !groupId) {
      const groups = [
        { id: "chest", title: "Chest", icon: "heart-outline" },
        { id: "back", title: "Back", icon: "body-outline" },
        { id: "legs", title: "Legs", icon: "walk-outline" },
        { id: "arms", title: "Arms", icon: "fitness-outline" },
        { id: "shoulders", title: "Shoulders", icon: "shield-outline" },
        { id: "core", title: "Core", icon: "flash-outline" },
      ];

      return groups.map((g) => {
        const needles = needlesForGroup(g.id);
        const count = needles.length ? mergedList.filter((ex) => hasAnyMuscle(ex, needles)).length : 0;

        return {
          kind: "group",
          id: g.id,
          title: g.title,
          subtitle: "Tap to browse",
          groupId: g.id,
          count,
        };
      });
    }

    // ✅ ถ้าเลือก groupId แล้ว → list ท่าจริง
    let exs = mergedList;

    if (isStrengthKey && groupId) {
      const needles = needlesForGroup(groupId);
      if (needles.length) exs = exs.filter((ex) => hasAnyMuscle(ex, needles));
    }

    const q = search.trim().toLowerCase();
    if (q) exs = exs.filter((ex) => String(ex.name || "").toLowerCase().includes(q));

    return exs.map((ex) => ({
      kind: "exercise",
      id: ex.id,
      title: ex.name || "Exercise",
      subtitle: String(ex.level || ex.equipment || "Exercise"),
      desc: ex.desc || "",
      imageUri: ex.images?.[0],
      ex,
    }));
  }, [isStrengthKey, groupId, mergedList, search]);

  const openAddModal = (it: CardItem) => {
    if (it.kind !== "exercise") return;
    const mapped = (it.ex?.mappedActivityKey || activityKey) as ActivityKey;
    setSelectedActivityKey(mapped);
    setSelected(it);
    setModalVisible(true);
  };

  const isGroupMode = items[0]?.kind === "group";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={{ height: statusBarPad() }} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255,255,255,0.06)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.10)",
            }}
          >
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text style={{ color: COLORS.text, fontSize: 22, fontWeight: "900" }}>
              {headerTitle}
            </Text>
            <Text style={{ color: COLORS.subtext, fontWeight: "700", marginTop: 2 }}>
              {loading ? "Loading…" : `${items.length} items`}
            </Text>
          </View>
        </View>

        {/* Search เฉพาะโหมดรายการท่า (ไม่ใช่หน้า workout parts) */}
        {!isGroupMode && (
          <View style={{ marginTop: 14 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderRadius: 18,
                backgroundColor: "rgba(0,0,0,0.22)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.10)",
              }}
            >
              <Ionicons name="search" size={18} color={COLORS.subtext} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search in this category…"
                placeholderTextColor={COLORS.subtext}
                style={{ flex: 1, color: COLORS.text, fontWeight: "800" }}
              />
              {!!search && (
                <Pressable
                  onPress={() => setSearch("")}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(255,255,255,0.06)",
                  }}
                >
                  <Ionicons name="close" size={16} color={COLORS.text} />
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* Content grid 2 columns */}
        <View style={{ marginTop: 14, flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {items.map((it) => {
            if (it.kind === "group") {
              return (
                <Pressable
                  key={it.id}
                  onPress={() => navigation.push("ExerciseCollection", { activityKey, groupId: it.groupId })}
                  style={{
                    width: "48%",
                    borderRadius: 18,
                    overflow: "hidden",
                    backgroundColor: "rgba(255,255,255,0.05)",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.10)",
                    aspectRatio: 1.35,
                  }}
                >
                  <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <Ionicons name="grid-outline" size={22} color={COLORS.subtext} />
                    <Text style={{ color: COLORS.text, fontWeight: "900" }}>{it.title}</Text>
                    <Text style={{ color: COLORS.subtext, fontWeight: "800" }}>{it.count} exercises</Text>
                  </View>
                </Pressable>
              );
            }

            return (
              <Pressable
                key={it.id}
                onPress={() => openAddModal(it)}
                style={{
                  width: "48%",
                  borderRadius: 18,
                  overflow: "hidden",
                  backgroundColor: "rgba(255,255,255,0.05)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.10)",
                  aspectRatio: 1.35,
                }}
              >
                {it.imageUri ? (
                  <Image source={{ uri: it.imageUri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                ) : (
                  <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name="image-outline" size={22} color={COLORS.subtext} />
                  </View>
                )}

                <LinearGradient
                  colors={["rgba(0,0,0,0.00)", "rgba(0,0,0,0.70)"]}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    paddingHorizontal: 10,
                    paddingVertical: 10,
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "900" }} numberOfLines={1}>
                    {it.title}
                  </Text>
                  <Text style={{ color: "rgba(255,255,255,0.85)", fontWeight: "700", marginTop: 2 }} numberOfLines={1}>
                    {it.subtitle}
                  </Text>
                </LinearGradient>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <ActivityAddModal
        visible={modalVisible}
        onClose={closeModal}
        onSaved={() => {
          closeModal();
          navigation.popToTop();
        }}
        uid={uid}
        weightKg={weightKg}
        activityKey={selectedActivityKey ?? activityKey}
        title={selected && selected.kind === "exercise" ? selected.title : undefined}
        description={selected && selected.kind === "exercise" ? selected.desc : undefined}
        imageSource={
          selected && selected.kind === "exercise" && selected.imageUri
            ? { uri: selected.imageUri }
            : undefined
        }
      />
    </SafeAreaView>
  );
}
