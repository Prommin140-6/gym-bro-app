import React from "react";
import { View, Text, Image, Pressable } from "react-native";
import type { FoodBase } from "../types/food";
import { COLORS } from "../theme/colors";
import { RADIUS } from "../theme/radius";

const PLACEHOLDER = "https://via.placeholder.com/120x90.png?text=Food";

export function FoodCard({
  food,
  onPress,
}: {
  food: FoodBase;
  onPress: () => void;
}) {
  const img = food.imageUrl ? { uri: food.imageUrl } : { uri: PLACEHOLDER };
  const isCustom = food.refType === "custom";

  // ✅ custom = green, public = neutral
  const badgeBg = isCustom
    ? "rgba(43,228,167,0.18)" // green soft bg
    : "rgba(255,255,255,0.06)";

  const badgeBorder = isCustom ? COLORS.success : COLORS.border;
  const badgeText = isCustom ? COLORS.success : COLORS.subtext;

  return (
    <Pressable
      onPress={onPress}
      style={{
        position: "relative",
        flexDirection: "row",
        gap: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: RADIUS.lg,
        backgroundColor: COLORS.surface,
        alignItems: "center",
      }}
    >
      {/* Image */}
      <Image
        source={img}
        style={{ width: 92, height: 72, borderRadius: 12 }}
      />

      {/* Content */}
      <View style={{ flex: 1, gap: 6 }}>
        <Text
          style={{ color: COLORS.text, fontWeight: "900" }}
          numberOfLines={1}
        >
          {food.name}
        </Text>

        <Text style={{ color: COLORS.subtext, fontWeight: "800" }}>
          {food.calories_per_serving} kcal / serving
        </Text>

        {/* Macros */}
        <Text style={{ fontSize: 12, fontWeight: "800" }}>
          <Text style={{ color: "#FFD84D" }}>C </Text>
          <Text style={{ color: COLORS.text }}>{food.carbs_g}g </Text>

          <Text style={{ color: "#FF5A5A" }}>P </Text>
          <Text style={{ color: COLORS.text }}>{food.protein_g}g </Text>

          <Text style={{ color: "#B388FF" }}>F </Text>
          <Text style={{ color: COLORS.text }}>{food.fat_g}g</Text>
        </Text>
      </View>

      {/* ✅ Badge: CUSTOM / PUBLIC (Top Right) */}
      <View
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 999,
          backgroundColor: badgeBg,
          borderWidth: 1,
          borderColor: badgeBorder,
        }}
      >
        <Text
          style={{
            color: badgeText,
            fontSize: 11,
            fontWeight: "900",
            letterSpacing: 0.6,
          }}
        >
          {isCustom ? "CUSTOM" : "PUBLIC"}
        </Text>
      </View>
    </Pressable>
  );
}
