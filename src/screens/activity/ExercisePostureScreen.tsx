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
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { COLORS } from "../../theme/colors";
import type { ActivityKey } from "../../utils/met";
import { useExerciseCatalog } from "../../services/exerciseCatalog";

import { useAuth } from "../../services/AuthContext";
import { ActivityAddModal } from "../../components/activity/ActivityAddModal";

type Category = {
  key: ActivityKey;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  fallbackKey?: ActivityKey;
};

type MiniCard = {
  id: string;
  name: string;
  subtitle: string;
  desc?: string;
  imageUri?: string;
  activityKey: ActivityKey;
};

function statusBarPad() {
  return Platform.OS === "android" ? StatusBar.currentHeight ?? 0 : 0;
}

export default function ExercisePostureScreen() {
  const navigation = useNavigation<any>();
  const { items: dbItems, loading } = useExerciseCatalog();

  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const weightKg = 66;

  const [query, setQuery] = useState("");

  // ---- Modal state ----
  const [modalVisible, setModalVisible] = useState(false);
  const [selected, setSelected] = useState<MiniCard | null>(null);
  const [selectedActivityKey, setSelectedActivityKey] = useState<ActivityKey | null>(null);

  const closeModal = () => {
    setModalVisible(false);
    setSelected(null);
    setSelectedActivityKey(null);
  };

  const openAddModal = (it: MiniCard) => {
    setSelected(it);
    setSelectedActivityKey(it.activityKey);
    setModalVisible(true);
  };

  // ✅ รวมหมวดให้ครบ รวม swim/cycle และทำ fallback สำหรับ lifting/aerobic
  const categories: Category[] = useMemo(
    () => [
      {
        key: "lifting" as ActivityKey,
        title: "Lifting",
        icon: "barbell-outline",
        fallbackKey: "resistance_training" as ActivityKey,
      },
      {
        key: "aerobic" as ActivityKey,
        title: "Aerobic",
        icon: "flash-outline",
        fallbackKey: "aerobic_exercise" as ActivityKey,
      },
      { key: "swimming" as ActivityKey, title: "Swimming", icon: "water-outline" },
      { key: "cycling" as ActivityKey, title: "Cycling", icon: "bicycle-outline" },
      { key: "flexibility_exercise" as ActivityKey, title: "Flexibility", icon: "leaf-outline" },
      { key: "balance_exercise" as ActivityKey, title: "Balance", icon: "walk-outline" },
    ],
    []
  );

  const countByKey = useMemo(() => {
    const map: Record<string, number> = {};
    for (const it of dbItems || []) {
      const k = String(it.mappedActivityKey || "unknown");
      map[k] = (map[k] || 0) + 1;
    }
    return map;
  }, [dbItems]);

  const goCollection = (activityKey: ActivityKey, initialSearch?: string) => {
    navigation.navigate("ExerciseCollection", {
      activityKey,
      ...(initialSearch ? { initialSearch } : {}),
    });
  };

  const getExercisesForCategory = (cat: Category, take = 5): MiniCard[] => {
    const primaryKey = String(cat.key);
    const fallbackKey = cat.fallbackKey ? String(cat.fallbackKey) : null;

    const filtered = (dbItems || []).filter((x: any) => {
      const k = String(x?.mappedActivityKey || "");
      return k === primaryKey || (fallbackKey ? k === fallbackKey : false);
    });

    return filtered.slice(0, take).map((x: any) => ({
      id: String(x.id),
      name: String(x.name || "Exercise"),
      subtitle:
        String(x.level || "").trim() ||
        String(x.equipment || "").trim() ||
        "Exercise",
      desc: String(x.desc || ""),
      imageUri: x.images?.[0],
      activityKey: (x.mappedActivityKey || cat.key) as ActivityKey,
    }));
  };

  const searchResults: MiniCard[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return (dbItems || [])
      .filter((x: any) => String(x?.name || "").toLowerCase().includes(q))
      .slice(0, 10)
      .map((x: any) => ({
        id: String(x.id),
        name: String(x.name || "Exercise"),
        subtitle:
          String(x.level || "").trim() ||
          String(x.equipment || "").trim() ||
          "Exercise",
        desc: String(x.desc || ""),
        imageUri: x.images?.[0],
        activityKey: (x.mappedActivityKey || "aerobic") as ActivityKey,
      }));
  }, [dbItems, query]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={{ height: statusBarPad() }} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
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
              Exercise
            </Text>
            <Text style={{ color: COLORS.subtext, fontWeight: "700", marginTop: 2 }}>
              Find a movement, log it fast.
            </Text>
          </View>
        </View>

        {/* Search */}
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
              value={query}
              onChangeText={setQuery}
              placeholder="Search exercises…"
              placeholderTextColor={COLORS.subtext}
              style={{ flex: 1, color: COLORS.text, fontWeight: "800" }}
              returnKeyType="search"
            />
            {!!query && (
              <Pressable
                onPress={() => setQuery("")}
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

          {!!query && (
            <View style={{ marginTop: 14 }}>
              <SectionTitle title="SEARCH RESULT" hideChevron />
              <HorizontalCards>
                {searchResults.length === 0 ? (
                  <EmptyHorizontalHint text={loading ? "Loading…" : "No result"} />
                ) : (
                  searchResults.map((it) => (
                    <MiniExerciseCard
                      key={it.id}
                      item={it}
                      // ✅ กดแล้วเปิด modal ทันที
                      onPress={() => openAddModal(it)}
                    />
                  ))
                )}
              </HorizontalCards>
            </View>
          )}
        </View>

        {/* Popular */}
        <View style={{ marginTop: 18 }}>
          <SectionTitle title="POPULAR" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingVertical: 2 }}
          >
            {categories.map((c) => {
              const count =
                (countByKey[String(c.key)] ?? 0) +
                (c.fallbackKey ? countByKey[String(c.fallbackKey)] ?? 0 : 0);

              return (
                <Pressable
                  key={String(c.key)}
                  // Popular tap -> เข้า list หมวด
                  onPress={() => goCollection(c.key)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 999,
                    backgroundColor: "rgba(255,255,255,0.06)",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.10)",
                  }}
                >
                  <Ionicons name={c.icon} size={18} color={COLORS.text} />
                  <Text style={{ color: COLORS.text, fontWeight: "900" }}>{c.title}</Text>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 999,
                      backgroundColor: "rgba(0,0,0,0.20)",
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.10)",
                    }}
                  >
                    <Text style={{ color: COLORS.subtext, fontWeight: "900", fontSize: 12 }}>
                      {loading ? "…" : count}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Our collection */}
        <View style={{ marginTop: 18 }}>
          <SectionTitle title="OUR COLLECTION" hideChevron />
          <View style={{ gap: 18, marginTop: 6 }}>
            {categories.map((cat) => {
              const sample = getExercisesForCategory(cat, 5);
              const total =
                (countByKey[String(cat.key)] ?? 0) +
                (cat.fallbackKey ? countByKey[String(cat.fallbackKey)] ?? 0 : 0);

              return (
                <View key={String(cat.key)} style={{ gap: 10 }}>
                  {/* ✅ กดหัวข้อ -> เข้า list หมวด */}
                  <Pressable
                    onPress={() => goCollection(cat.key)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <Ionicons name={cat.icon} size={18} color={COLORS.text} />
                      <Text style={{ color: COLORS.text, fontWeight: "900", fontSize: 16 }}>
                        {cat.title} {" >"}
                      </Text>
                    </View>

                    <Text style={{ color: COLORS.subtext, fontWeight: "800" }}>
                      {loading ? "Loading…" : `${total} exercises`}
                    </Text>
                  </Pressable>

                  <HorizontalCards>
                    {sample.length === 0 ? (
                      <EmptyHorizontalHint text={loading ? "Loading…" : "No exercises"} />
                    ) : (
                      sample.map((it) => (
                        <MiniExerciseCard
                          key={`${String(cat.key)}-${it.id}`}
                          item={it}
                          // ✅ กดการ์ด -> เปิด modal ทันที (ตามที่คุณต้องการ)
                          onPress={() => openAddModal(it)}
                        />
                      ))
                    )}
                  </HorizontalCards>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* ✅ Modal: เปิดจากหน้าแรกได้เลย */}
      <ActivityAddModal
        visible={modalVisible}
        onClose={closeModal}
        onSaved={() => {
          closeModal();
          navigation.popToTop();
        }}
        uid={uid}
        weightKg={weightKg}
        activityKey={selectedActivityKey ?? (selected?.activityKey as ActivityKey)}
        title={selected?.name}
        description={selected?.desc}
        imageSource={selected?.imageUri ? { uri: selected.imageUri } : undefined}
      />
    </SafeAreaView>
  );
}

/* ---------------- UI bits ---------------- */

function SectionTitle({
  title,
  hideChevron,
}: {
  title: string;
  hideChevron?: boolean;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
      <Text style={{ color: COLORS.text, fontWeight: "900", letterSpacing: 0.6 }}>
        {title} {hideChevron ? "" : ">"}
      </Text>
    </View>
  );
}

function HorizontalCards({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 12, paddingVertical: 2 }}
    >
      {children}
    </ScrollView>
  );
}

function EmptyHorizontalHint({ text }: { text: string }) {
  return (
    <View
      style={{
        width: 220,
        height: 140,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.05)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.10)",
      }}
    >
      <Text style={{ color: COLORS.subtext, fontWeight: "800" }}>{text}</Text>
    </View>
  );
}

function MiniExerciseCard({
  item,
  onPress,
}: {
  item: MiniCard;
  onPress: () => void;
}) {
  const hasImg = !!item.imageUri;

  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 220,
        height: 140,
        borderRadius: 18,
        overflow: "hidden",
        backgroundColor: "rgba(255,255,255,0.05)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.10)",
      }}
    >
      {hasImg ? (
        <Image source={{ uri: item.imageUri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
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
          paddingHorizontal: 12,
          paddingVertical: 10,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "900" }} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.85)", fontWeight: "700", marginTop: 2 }} numberOfLines={1}>
          {item.subtitle}
        </Text>
      </LinearGradient>
    </Pressable>
  );
}
