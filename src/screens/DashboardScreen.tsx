import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, ScrollView, Animated } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

import { useAuth } from "../services/AuthContext";
import { useTodayNutrition } from "../hooks/useTodayNutrition";
import { useStreakStats } from "../hooks/useStreakStats";

import { Screen } from "../components/ui/Screen";
import { Card } from "../components/ui/Card";
import { COLORS } from "../theme/colors";

import { ProgressRing } from "../components/ProgressRing";
import { MacroRing } from "../components/MacroRing";
import FloatingAddButton from "../components/FloatingAddButton";

import { Ionicons } from "@expo/vector-icons";

import carbIcon from "../../assets/icon/carbicon.png";
import proteinIcon from "../../assets/icon/proteinicon.png";
import fatIcon from "../../assets/icon/faticon.png";

import WaterCard from "../components/WaterCard";
import WaterSettingsModal from "../components/WaterSettingsModal";

/* ---------- helpers ---------- */

// Mon–Sun
function dowLetterMonStart(date: Date) {
  const map = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return map[date.getDay()] ?? "";
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Expo Go-friendly animation wrapper (NO reanimated/worklets)
 * - staggered fade + slide up + slight scale
 */
function AnimatedIn({
  index,
  children,
  distance = 14,
}: {
  index: number;
  children: React.ReactNode;
  distance?: number;
}) {
  const p = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = index * 70;
    Animated.timing(p, {
      toValue: 1,
      duration: 420,
      delay,
      useNativeDriver: true,
    }).start();
  }, [index, p]);

  const translateY = p.interpolate({
    inputRange: [0, 1],
    outputRange: [distance, 0],
  });

  const scale = p.interpolate({
    inputRange: [0, 1],
    outputRange: [0.98, 1],
  });

  return (
    <Animated.View style={{ opacity: p, transform: [{ translateY }, { scale }] }}>
      {children}
    </Animated.View>
  );
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const navigation = useNavigation<any>();
  const tabBarHeight = useBottomTabBarHeight();

  const { goals, totals, progress } = useTodayNutrition(uid);

  const { currentSuccessStreak, bestFoodStreak, bestBurnStreak, last7 } =
    useStreakStats(uid, { fetchDays: 420 });

  const [waterModalOpen, setWaterModalOpen] = useState(false);

  const goGoals = () => navigation.navigate("NutritionGoals");

  // ✅ ใช้สีเดียวกับ Calories today (CalToday)
  const ringColor = COLORS.primary;

  return (
    <Screen>
      <View style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: 16,
            gap: 14,
            paddingBottom: tabBarHeight + 140,
          }}
        >
          {/* Header */}
          <View style={{ gap: 2, marginTop: 4 }}>
            <Text style={{ color: COLORS.text, fontSize: 26, fontWeight: "900" }}>
              Dashboard
            </Text>
            <Text style={{ color: COLORS.subtext, fontWeight: "700" }}>
              Today summary (real-time)
            </Text>
          </View>

          {/* Calories card */}
          <AnimatedIn index={0}>
            <Card style={{ alignItems: "center" }}>
              <Pressable
                onPress={goGoals}
                hitSlop={12}
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  width: 34,
                  height: 34,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(255,255,255,0.04)",
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
              >
                <Ionicons name="create-outline" size={18} color={COLORS.subtext} />
              </Pressable>

              <ProgressRing
                progress={progress.calPct}
                labelTop="Calories today"
                centerValue={`${totals.totalCalories}`}
                labelBottom={`Goal ${goals.calorieTarget}`}
              />

              <View style={{ height: 12 }} />

              <View style={{ flexDirection: "row", alignSelf: "center", marginTop: 6 }}>
                <MiniStat label="Carbs" value={`${totals.totalCarbs}g`} />
                <MiniStat label="Protein" value={`${totals.totalProtein}g`} />
                <MiniStat label="Fat" value={`${totals.totalFat}g`} />
              </View>
            </Card>
          </AnimatedIn>

          {/* Nutrition rings */}
          <AnimatedIn index={1}>
            <Card>
              <Text
                style={{
                  color: COLORS.text,
                  fontWeight: "900",
                  fontSize: 16,
                  marginBottom: 10,
                }}
              >
                Nutrition
              </Text>

              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <MacroRing
                  icon={carbIcon}
                  title="Carb"
                  valueText={`${totals.totalCarbs}/${goals.carbTarget}g`}
                  progress={progress.carbPct}
                  // ✅ ให้สีวงเหมือน CalToday
                  color={ringColor}
                />

                <MacroRing
                  icon={proteinIcon}
                  title="Protein"
                  valueText={`${totals.totalProtein}/${goals.proteinTarget}g`}
                  progress={progress.proteinPct}
                  // ✅ ให้สีวงเหมือน CalToday
                  color={ringColor}
                />

                <MacroRing
                  icon={fatIcon}
                  title="Fat"
                  valueText={`${totals.totalFat}/${goals.fatTarget}g`}
                  progress={progress.fatPct}
                  // ✅ ให้สีวงเหมือน CalToday
                  color={ringColor}
                />
              </View>
            </Card>
          </AnimatedIn>

          {/* Streak card */}
          <AnimatedIn index={2}>
            <Card>
              <Text style={{ color: COLORS.text, fontWeight: "900", fontSize: 18 }}>
                Activity Streak
              </Text>

              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 14 }}>
                <Ionicons name="flame-outline" size={26} color={COLORS.text} />
                <Text
                  style={{
                    color: COLORS.text,
                    fontSize: 46,
                    fontWeight: "900",
                    marginLeft: 10,
                  }}
                >
                  {currentSuccessStreak}
                </Text>
                <Text
                  style={{
                    color: COLORS.text,
                    fontSize: 22,
                    fontWeight: "900",
                    marginLeft: 10,
                  }}
                >
                  days
                </Text>
              </View>

              <View style={{ flexDirection: "row", marginTop: 14 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: COLORS.text, fontWeight: "900", fontSize: 20 }}>
                    {bestFoodStreak} days
                  </Text>
                  <Text style={{ color: COLORS.subtext, fontWeight: "800", marginTop: 4 }}>
                    Longest food logging streak
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ color: COLORS.text, fontWeight: "900", fontSize: 20 }}>
                    {bestBurnStreak} days
                  </Text>
                  <Text style={{ color: COLORS.subtext, fontWeight: "800", marginTop: 4 }}>
                    Longest burn tracking streak
                  </Text>
                </View>
              </View>

              <View
                style={{
                  height: 1,
                  backgroundColor: COLORS.border,
                  marginTop: 14,
                  marginBottom: 12,
                }}
              />

              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                {last7.map((d) => {
                  const today = isSameDay(d.date, new Date());
                  const ringColor = d.restDay
                    ? COLORS.border
                    : d.success
                    ? COLORS.primary
                    : COLORS.border;

                  return (
                    <Pressable
                      key={d.dateKey}
                      onPress={() =>
                        navigation.navigate("ActivityTab", {
                          screen: "ActivityDayDetail",
                          params: { dateKey: d.dateKey },
                        })
                      }
                      style={{ alignItems: "center", width: 40 }}
                    >
                      <View
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 17,
                          borderWidth: today ? 3 : 2,
                          borderColor: ringColor,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text
                          style={{
                            color: today ? COLORS.primary : COLORS.subtext,
                            fontWeight: "900",
                            fontSize: 12,
                          }}
                        >
                          {dowLetterMonStart(d.date)}
                        </Text>
                      </View>

                      <Text
                        style={{
                          marginTop: 6,
                          color: today ? COLORS.primary : COLORS.subtext,
                          fontWeight: "900",
                        }}
                      >
                        {d.date.getDate()}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Card>
          </AnimatedIn>

          {/* Water card (below streak) */}
          <AnimatedIn index={3}>
            <WaterCard uid={uid} onPressSettings={() => setWaterModalOpen(true)} />
          </AnimatedIn>
        </ScrollView>

        <WaterSettingsModal
          visible={waterModalOpen}
          uid={uid}
          onClose={() => setWaterModalOpen(false)}
        />

        <FloatingAddButton onPress={() => navigation.navigate("FoodTab")} />
      </View>
    </Screen>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ width: 96, alignItems: "center" }}>
      <Text
        style={{
          color: COLORS.subtext,
          fontWeight: "800",
          fontSize: 12,
          textAlign: "center",
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          color: COLORS.text,
          fontWeight: "900",
          fontSize: 16,
          textAlign: "center",
        }}
      >
        {value}
      </Text>
    </View>
  );
}
