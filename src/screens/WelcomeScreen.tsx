import React, { useEffect, useRef } from "react";
import { View, Text, Image, Pressable, Animated, Easing, Dimensions } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../types/navigation";

import { Screen } from "../components/ui/Screen";
import { COLORS } from "../theme/colors";
import { RADIUS } from "../theme/radius";

type Props = NativeStackScreenProps<AuthStackParamList, "Welcome">;

const { height: H } = Dimensions.get("window");

export default function WelcomeScreen({ navigation }: Props) {
  // --- animations ---
  const imgScale = useRef(new Animated.Value(1.04)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(imgScale, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(contentY, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [imgScale, contentOpacity, contentY]);

  return (
    <Screen>
      <View style={{ flex: 1 }}>
        {/* HERO (full width like your UI) */}
        <View
          style={{
            width: "100%",
            height: Math.min(420, Math.max(320, H * 0.52)), // ~top half screen
            backgroundColor: COLORS.surface,
          }}
        >
          <Animated.View style={{ flex: 1, transform: [{ scale: imgScale }] }}>
            <Image
              source={require("../../assets/GymBroHero.png")}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          </Animated.View>
        </View>

        {/* CONTENT AREA */}
        <Animated.View
          style={{
            flex: 1,
            paddingHorizontal: 18,
            paddingTop: 18,
            paddingBottom: 20,
            opacity: contentOpacity,
            transform: [{ translateY: contentY }],
          }}
        >
          {/* Title + subtitle */}
          <View style={{ gap: 10, alignItems: "center" }}>
            <Text style={{ color: COLORS.text, fontSize: 22, fontWeight: "900", textAlign: "center" }}>
              Welcome To GymBro APP
            </Text>

            <Text
              style={{
                color: COLORS.subtext,
                fontWeight: "700",
                textAlign: "center",
                lineHeight: 20,
                paddingHorizontal: 10,
              }}
            >
              Track your health metrics, set goals, and{"\n"}
              achieve a healthier lifestyle with our app.
            </Text>
          </View>

          <View style={{ flex: 1 }} />

          {/* Buttons (bottom like UI) */}
          <View style={{ gap: 12 }}>
            <Pressable
              onPress={() => navigation.navigate("Login")}
              style={{
                backgroundColor: COLORS.primary,
                paddingVertical: 14,
                borderRadius: 999,
                alignItems: "center",
              }}
            >
              <Text style={{ color: COLORS.text, fontWeight: "900", fontSize: 16 }}>
                Get Started
              </Text>
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate("Register")}
              style={{
                backgroundColor: COLORS.text,
                paddingVertical: 14,
                borderRadius: 999,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#111", fontWeight: "900", fontSize: 16 }}>
                Register
              </Text>
            </Pressable>

            {/* small spacing like screenshot */}
            <View style={{ height: 4 }} />
          </View>
        </Animated.View>

        {/* Soft overlay line between hero & content (optional but looks premium) */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: Math.min(420, Math.max(320, H * 0.52)) - 1,
            left: 0,
            right: 0,
            height: 1,
            backgroundColor: COLORS.border,
            opacity: 0.9,
          }}
        />
      </View>
    </Screen>
  );
}
