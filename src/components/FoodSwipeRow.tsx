import React from "react";
import { View, Text, Pressable, Image } from "react-native";
import { Swipeable } from "react-native-gesture-handler";

import { COLORS } from "../theme/colors";

const PLACEHOLDER = "https://via.placeholder.com/80x60.png?text=Food";

export type FoodLogItem = {
  id: string;
  name: string;
  servings: number;
  imageUrl?: string | null;
  totals: {
    totalCalories: number;
    totalCarbs: number;
    totalProtein: number;
    totalFat: number;
  };
};

export function FoodSwipeRow(props: {
  item: FoodLogItem;
  onDelete?: (id: string) => void;
}) {
  const { item, onDelete } = props;

  const renderRight = () => (
    <Pressable
      onPress={() => onDelete?.(item.id)}
      style={{
        width: 92,
        marginLeft: 10,
        borderRadius: 14,
        backgroundColor: "rgba(255, 77, 79, 0.18)",
        borderWidth: 1,
        borderColor: "rgba(255, 77, 79, 0.35)",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: COLORS.danger, fontWeight: "900" }}>Delete</Text>
    </Pressable>
  );

  return (
    <Swipeable enabled={Boolean(onDelete)} renderRightActions={renderRight} overshootRight={false}>
      <View
        style={{
          padding: 12,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: COLORS.border,
          backgroundColor: COLORS.surface2,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        {/* Food image */}
        <Image
          source={{ uri: item.imageUrl || PLACEHOLDER }}
          style={{ width: 60, height: 60, borderRadius: 12 }}
        />

        {/* Info */}
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ color: COLORS.text, fontWeight: "900" }} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={{ color: COLORS.subtext, fontWeight: "700", fontSize: 12 }}>
            {item.servings} serving{item.servings !== 1 ? "s" : ""} • {item.totals.totalCalories} kcal
          </Text>

          {/* Macros */}
          <Text style={{ fontSize: 11, fontWeight: "800" }}>
            <Text style={{ color: "#FFD84D" }}>C </Text>
            <Text style={{ color: COLORS.text }}>{item.totals.totalCarbs}g </Text>

            <Text style={{ color: "#FF5A5A" }}>P </Text>
            <Text style={{ color: COLORS.text }}>{item.totals.totalProtein}g </Text>

            <Text style={{ color: "#B388FF" }}>F </Text>
            <Text style={{ color: COLORS.text }}>{item.totals.totalFat}g</Text>
          </Text>
        </View>
      </View>
    </Swipeable>
  );
}
