import React from "react";
import { Pressable, Text } from "react-native";

export function FloatingAddButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        position: "absolute",
        right: 20,
        bottom: 20,
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "#1f6fff",
        alignItems: "center",
        justifyContent: "center",
        elevation: 6, // Android shadow
        shadowColor: "#000", // iOS shadow
        shadowOpacity: 0.25,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 4 },
      }}
    >
      <Text style={{ color: "white", fontSize: 36, fontWeight: "900", marginTop: -2 }}>
        +
      </Text>
    </Pressable>
  );
}
