import React, { useMemo, useState } from "react";
import { View, Text, Image, Pressable, Alert, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { FoodBase, BowlSize } from "../types/food";
import { useAuth } from "../services/AuthContext";
import { addFoodToTodayLog } from "../services/firestoreFoodLog";
import { useTodayNutrition } from "../hooks/useTodayNutrition";

import { Screen } from "../components/ui/Screen";
import { Card } from "../components/ui/Card";
import { MacroRing } from "../components/MacroRing";
import { COLORS } from "../theme/colors";
import { RADIUS } from "../theme/radius";

const PLACEHOLDER = "https://via.placeholder.com/600x420.png?text=Food";

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

// Bowl size multiplier
function getBowlSizeMultiplier(bowlSize: BowlSize): number {
  switch (bowlSize) {
    case "small":
      return 0.8; // -20%
    case "regular":
      return 1.0; // 0% (default)
    case "large":
      return 1.2; // +20%
  }
}

export default function FoodDetailScreen({ route, navigation }: any) {
  const food = route.params.food as FoodBase;

  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const { goals } = useTodayNutrition(uid);

  const [servings, setServings] = useState(1);
  const [bowlSize, setBowlSize] = useState<BowlSize>("regular");
  const [saving, setSaving] = useState(false);

  // Check if food is fruits category (don't apply bowl size)
  const isFruit = food.category === "fruits";

  const totals = useMemo(() => {
    const s = servings || 1;
    // Only apply bowl size multiplier for non-fruit foods
    const bowlMultiplier = !isFruit ? getBowlSizeMultiplier(bowlSize) : 1;
    return {
      calories: Math.round((food.calories_per_serving ?? 0) * s * bowlMultiplier),
      carbs: round1((food.carbs_g ?? 0) * s * bowlMultiplier),
      protein: round1((food.protein_g ?? 0) * s * bowlMultiplier),
      fat: round1((food.fat_g ?? 0) * s * bowlMultiplier),
    };
  }, [food, servings, bowlSize, isFruit]);

  const img = food.imageUrl ? { uri: food.imageUrl } : { uri: PLACEHOLDER };

  const goDashboard = () => {
    navigation.popToTop();
    const parent = navigation.getParent?.();
    if (parent) parent.navigate("DashboardTab");
    else navigation.navigate?.("DashboardTab");
  };

  const onAdd = async () => {
    if (!uid) return Alert.alert("Error", "Not logged in");
    if (saving) return;

    setSaving(true);
    try {
      const bowlMultiplier = getBowlSizeMultiplier(bowlSize);
      
      const logParams: any = {
        uid,
        foodRefType: food.refType,
        foodId: food.id,
        name: food.name,
        calories_per_serving: food.calories_per_serving,
        carbs_g: food.carbs_g,
        protein_g: food.protein_g,
        fat_g: food.fat_g,
        servings,
        imageUrl: food.imageUrl,
      };

      // Add bowl size only for non-fruit foods
      if (!isFruit) {
        logParams.bowlSize = bowlSize;
        logParams.bowlMultiplier = bowlMultiplier;
      }

      await addFoodToTodayLog(logParams);

      Alert.alert("Success", "Added to today's log!", [
        { text: "OK", onPress: goDashboard },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Add failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <View style={{ flex: 1, padding: 16, gap: 12 }}>
        {/* 🔙 Back header */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
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
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </Pressable>

          <Text style={{ color: COLORS.text, fontSize: 22, fontWeight: "900" }}>
            Food detail
          </Text>
        </View>

        {/* Scrollable Content */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingBottom: 80 }}
        >
          {/* Image */}
          <Card style={{ padding: 10 }}>
            <Image
              source={img}
              style={{ width: "100%", height: 220, borderRadius: RADIUS.lg }}
              resizeMode="cover"
            />
          </Card>

          {/* Title */}
          <View style={{ gap: 4 }}>
            <Text style={{ color: COLORS.text, fontSize: 22, fontWeight: "900" }}>
              {food.name}
            </Text>
            <Text style={{ color: COLORS.subtext, fontWeight: "800" }}>
              {Math.round((food.calories_per_serving ?? 0) * (!isFruit ? getBowlSizeMultiplier(bowlSize) : 1))} kcal / serving
            </Text>

            <Text style={{ fontSize: 13, fontWeight: "900" }}>
              <Text style={{ color: "#FFD84D" }}>C </Text>
              <Text style={{ color: COLORS.text }}>{totals.carbs}g  </Text>
              <Text style={{ color: "#FF5A5A" }}>P </Text>
              <Text style={{ color: COLORS.text }}>{totals.protein}g  </Text>
              <Text style={{ color: "#B388FF" }}>F </Text>
              <Text style={{ color: COLORS.text }}>{totals.fat}g</Text>
            </Text>
          </View>

          {/* Rings */}
          <Card>
            <Text style={{ color: COLORS.text, fontWeight: "900", marginBottom: 10 }}>
              Macros vs daily goal
            </Text>

            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <MacroRing
                title="carb"
                valueText={`${totals.carbs}/${goals.carbTarget}g`}
                progress={totals.carbs / Math.max(1, goals.carbTarget)}
                size={74}
                strokeWidth={12}
              />
              <MacroRing
                title="protein"
                valueText={`${totals.protein}/${goals.proteinTarget}g`}
                progress={totals.protein / Math.max(1, goals.proteinTarget)}
                size={74}
                strokeWidth={12}
              />
              <MacroRing
                title="fat"
                valueText={`${totals.fat}/${goals.fatTarget}g`}
                progress={totals.fat / Math.max(1, goals.fatTarget)}
                size={74}
                strokeWidth={12}
              />
            </View>
          </Card>

          {/* Bowl Size - Only for non-fruit foods */}
          {!isFruit && (
            <Card>
              <View style={{ gap: 10 }}>
                <View style={{ gap: 2 }}>
                  <Text style={{ color: COLORS.text, fontWeight: "900" }}>Bowl Size</Text>
                  <Text style={{ color: COLORS.subtext, fontWeight: "800", fontSize: 12 }}>
                    Adjust portion weight
                  </Text>
                </View>

                <View style={{ flexDirection: "row", gap: 8 }}>
                  {(["small", "regular", "large"] as BowlSize[]).map((size) => (
                    <Pressable
                      key={size}
                      onPress={() => setBowlSize(size)}
                      style={[
                        bowlButton,
                        bowlSize === size && {
                          backgroundColor: COLORS.primary,
                          borderColor: COLORS.primary,
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          size === "small"
                            ? "restaurant-outline"
                            : size === "regular"
                            ? "restaurant"
                            : "fast-food-outline"
                        }
                        size={size === "small" ? 16 : size === "regular" ? 20 : 24}
                        color={bowlSize === size ? COLORS.text : COLORS.subtext}
                      />
                      <Text
                        style={[
                          bowlButtonText,
                          bowlSize === size && { color: COLORS.text },
                        ]}
                      >
                        {size === "small"
                          ? "Small"
                          : size === "regular"
                          ? "Regular"
                          : "Large"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </Card>
          )}

          {/* Servings */}
          <Card style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ gap: 2 }}>
              <Text style={{ color: COLORS.text, fontWeight: "900" }}>Servings</Text>
              <Text style={{ color: COLORS.subtext, fontWeight: "800", fontSize: 12 }}>
                Adjust portion size
              </Text>
            </View>

            <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
              <Pressable onPress={() => setServings((s) => Math.max(1, s - 1))} style={pill}>
                <Text style={pillText}>-</Text>
              </Pressable>

              <Text style={{ color: COLORS.text, fontWeight: "900", fontSize: 16 }}>
                {servings}
              </Text>

              <Pressable onPress={() => setServings((s) => Math.min(20, s + 1))} style={pill}>
                <Text style={pillText}>+</Text>
              </Pressable>
            </View>
          </Card>

          {/* Add button */}
          <Pressable onPress={onAdd} disabled={saving} style={[btn, saving && { opacity: 0.6 }]}>
            <Text style={btnText}>
              {saving ? "Adding..." : `Add • ${totals.calories} kcal`}
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </Screen>
  );
}

const btn = {
  backgroundColor: COLORS.primary,
  padding: 14,
  borderRadius: RADIUS.md,
  alignItems: "center",
  marginTop: 4,
} as const;

const btnText = { color: COLORS.text, fontWeight: "900", fontSize: 16 } as const;

const pill = {
  width: 40,
  height: 40,
  borderRadius: 999,
  borderWidth: 1,
  borderColor: COLORS.border,
  backgroundColor: COLORS.surface2,
  alignItems: "center",
  justifyContent: "center",
} as const;

const pillText = { color: COLORS.text, fontWeight: "900", fontSize: 18 } as const;

const bowlButton = {
  flex: 1,
  paddingVertical: 10,
  paddingHorizontal: 8,
  borderRadius: RADIUS.md,
  borderWidth: 1,
  borderColor: COLORS.border,
  backgroundColor: COLORS.surface2,
  alignItems: "center",
  justifyContent: "center",
  gap: 4,
} as const;

const bowlButtonText = {
  color: COLORS.subtext,
  fontWeight: "800",
  fontSize: 12,
  textAlign: "center",
} as const;
