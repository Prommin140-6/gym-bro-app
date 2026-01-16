import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../theme/colors";

type Props = {
  onPress: () => void;
  iconName?: React.ComponentProps<typeof Ionicons>["name"];
};

export default function FloatingAddButton({
  onPress,
  iconName = "add",
}: Props) {
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();

  // ระยะลอยเพิ่ม (ปรับได้ตามความสวย)
  const lift = 50;

  return (
    <Pressable
      style={[
        styles.fab,
        {
          bottom: tabBarHeight + insets.bottom + lift,
        },
      ]}
      onPress={onPress}
    >
      <Ionicons name={iconName} size={36} color="white" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    zIndex: 1000,
  },
});
