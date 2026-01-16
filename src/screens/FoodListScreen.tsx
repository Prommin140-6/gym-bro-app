import React, { useMemo, useState } from "react";
import { View, Text, TextInput, FlatList, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

import { useAuth } from "../services/AuthContext";
import { useFoods } from "../hooks/useFoods";
import { FoodCard } from "../components/FoodCard";
import type { FoodBase, FoodCategory } from "../types/food";
import { COLORS } from "../theme/colors";
import { RADIUS } from "../theme/radius";

import { Screen } from "../components/ui/Screen"; // ✅ ADD

type TabType = "menus" | "add";
type CategoryFilter = FoodCategory | "all";

const CATEGORY_LABEL: Record<FoodCategory, string> = {
  rice: "Rice",
  noodle: "Noodles",
  salad: "Salad",
  soup: "Soup",
  dessert: "Dessert",
  drink: "Drinks",
  snack: "Snacks",
  other: "Other",
};

const CATEGORY_ORDER: FoodCategory[] = [
  "rice",
  "noodle",
  "salad",
  "soup",
  "dessert",
  "drink",
  "snack",
  "other",
];

// ✅ fixed height for category row
const CATEGORY_ROW_HEIGHT = 46;
const CHIP_HEIGHT = 40;

export default function FoodListScreen() {
  const navigation = useNavigation<any>();
  const tabBarHeight = useBottomTabBarHeight();

  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const { allFoods, loadingPublic } = useFoods(uid);

  const [tab, setTab] = useState<TabType>("menus");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();

    return allFoods.filter((f) => {
      const matchText = s ? f.name.toLowerCase().includes(s) : true;
      const matchCat = category === "all" ? true : (f.category ?? "other") === category;
      return matchText && matchCat;
    });
  }, [allFoods, q, category]);

  // data for horizontal category list
  const catData = useMemo(() => {
    return (["all", ...CATEGORY_ORDER] as const).map((c) => ({
      key: c,
      label: c === "all" ? "All" : CATEGORY_LABEL[c],
    }));
  }, []);

  return (
    <Screen>
      <View style={{ flex: 1, padding: 16, gap: 14 }}>
        {/* Header */}
        <View style={{ gap: 4, marginTop: 4 }}>
          <Text style={{ color: COLORS.text, fontSize: 26, fontWeight: "900" }}>Food</Text>
          <Text style={{ color: COLORS.subtext, fontWeight: "700" }}>
            Browse menus by category
          </Text>
        </View>

        {/* Top Tabs */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TopTabButton text="Menus" active={tab === "menus"} onPress={() => setTab("menus")} />
          <TopTabButton text="Add new" active={tab === "add"} onPress={() => setTab("add")} />
        </View>

        {tab === "menus" ? (
          <>
            {/* Search */}
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Search food..."
              placeholderTextColor={COLORS.subtext}
              style={{
                borderWidth: 1,
                borderColor: COLORS.border,
                borderRadius: RADIUS.lg,
                padding: 12,
                backgroundColor: COLORS.surface,
                color: COLORS.text,
                fontWeight: "800",
              }}
            />

            {/* ✅ Categories (fixed height, 1 row, horizontal scroll) */}
            <View style={{ height: CATEGORY_ROW_HEIGHT }}>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={catData}
                keyExtractor={(it) => String(it.key)}
                contentContainerStyle={{ gap: 10, paddingVertical: 3 }}
                renderItem={({ item }) => (
                  <CategoryChip
                    label={item.label}
                    active={category === item.key}
                    onPress={() => setCategory(item.key as CategoryFilter)}
                  />
                )}
              />
            </View>

            {/* List section MUST take remaining space */}
            <View style={{ flex: 1, gap: 12 }}>
              {/* Add new shortcut */}
              <Pressable
                onPress={() => navigation.navigate("AddFood")}
                style={{
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  borderRadius: RADIUS.lg,
                  padding: 14,
                  backgroundColor: COLORS.surface2,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ gap: 2 }}>
                  <Text style={{ color: COLORS.text, fontWeight: "900", fontSize: 16 }}>
                    Add new
                  </Text>
                  <Text style={{ color: COLORS.subtext, fontWeight: "700" }}>
                    Create your custom menu
                  </Text>
                </View>
                <Text style={{ color: COLORS.text, fontWeight: "900", fontSize: 22 }}>＋</Text>
              </Pressable>

              {/* List */}
              {loadingPublic ? (
                <Text style={{ color: COLORS.subtext, fontWeight: "800" }}>Loading...</Text>
              ) : results.length === 0 ? (
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 10 }}>
                  <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: "900" }}>
                    No food
                  </Text>
                  <Text style={{ color: COLORS.subtext, fontWeight: "700" }}>
                    Try search or change category.
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={results}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{
                    gap: 12,
                    paddingBottom: tabBarHeight + 12,
                  }}
                  renderItem={({ item }: { item: FoodBase }) => (
                    <FoodCard
                      food={item}
                      onPress={() => navigation.navigate("FoodDetail", { food: item })}
                    />
                  )}
                />
              )}
            </View>
          </>
        ) : (
          <View style={{ gap: 12 }}>
            <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: "900" }}>
              Create your food
            </Text>
            <Text style={{ color: COLORS.subtext, fontWeight: "700" }}>
              Add a custom menu and it will appear instantly in your list.
            </Text>

            <Pressable
              onPress={() => navigation.navigate("AddFood")}
              style={{
                backgroundColor: COLORS.primary,
                padding: 14,
                borderRadius: RADIUS.lg,
                alignItems: "center",
              }}
            >
              <Text style={{ color: COLORS.text, fontWeight: "900" }}>Go to Add Food</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Screen>
  );
}

/* ---------------- small components ---------------- */

function TopTabButton(props: { text: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={props.onPress}
      style={{
        flex: 1,
        paddingVertical: 12,
        borderRadius: RADIUS.lg,
        alignItems: "center",
        borderWidth: 1,
        borderColor: props.active ? "rgba(47,136,255,0.55)" : COLORS.border,
        backgroundColor: props.active ? "rgba(47,136,255,0.12)" : COLORS.surface,
      }}
    >
      <Text style={{ color: COLORS.text, fontWeight: "900" }}>{props.text}</Text>
    </Pressable>
  );
}

function CategoryChip(props: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={props.onPress}
      style={{
        height: CHIP_HEIGHT, // ✅ fixed
        paddingHorizontal: 14,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: props.active ? "rgba(47,136,255,0.6)" : COLORS.border,
        backgroundColor: props.active ? "rgba(47,136,255,0.18)" : COLORS.surface,
        alignItems: "center",
        justifyContent: "center", // ✅ keep text centered
      }}
    >
      <Text style={{ color: COLORS.text, fontWeight: "900", fontSize: 13 }}>{props.label}</Text>
    </Pressable>
  );
}
