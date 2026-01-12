import React from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";

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

function thDowLetterMonStart(date: Date) {
  // จ อ พ พ ค ส อ (Mon..Sun)
  const map = ["อ", "จ", "อ", "พ", "พ", "ค", "ส"]; // JS: 0=Sun
  return map[date.getDay()] ?? "";
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const navigation = useNavigation<any>();
  const { goals, totals, progress } = useTodayNutrition(uid);

  const { currentSuccessStreak, bestFoodStreak, bestBurnStreak, last7 } =
    useStreakStats(uid, { fetchDays: 420 });

  const goGoals = () => navigation.navigate("NutritionGoals");

  return (
    <Screen>
      <View style={{ flex: 1, padding: 16, gap: 14 }}>
        {/* Header */}
        <View style={{ gap: 2, marginTop: 4 }}>
          <Text style={{ color: COLORS.text, fontSize: 26, fontWeight: "900" }}>
            Dashboard
          </Text>
          <Text style={{ color: COLORS.subtext, fontWeight: "700" }}>
            Today summary (realtime)
          </Text>
        </View>

        {/* Calories card */}
        <Card style={{ alignItems: "center" }}>
          <Pressable
            onPress={goGoals}
            hitSlop={14}
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: "rgba(255,255,255,0.04)",
            }}
          >
            <Text
              style={{
                color: COLORS.subtext,
                fontWeight: "900",
                fontSize: 18,
                letterSpacing: 2,
              }}
            >
              .
            </Text>
          </Pressable>

          <ProgressRing
            progress={progress.calPct}
            labelTop="calories today"
            centerValue={`${totals.totalCalories}`}
            labelBottom={`goal ${goals.calorieTarget}`}
          />

          <View style={{ height: 12 }} />

          <View style={{ flexDirection: "row", alignSelf: "center", marginTop: 6 }}>
            <MiniStat label="Carbs" value={`${totals.totalCarbs}g`} />
            <MiniStat label="Protein" value={`${totals.totalProtein}g`} />
            <MiniStat label="Fat" value={`${totals.totalFat}g`} />
          </View>
        </Card>

        {/* Nutrition rings */}
        <Card>
          <Text
            style={{
              color: COLORS.text,
              fontWeight: "900",
              fontSize: 16,
              marginBottom: 10,
            }}
          >
            nutritions
          </Text>

          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <MacroRing
              icon={carbIcon}
              title="carb"
              valueText={`${totals.totalCarbs}/${goals.carbTarget}g`}
              progress={progress.carbPct}
            />

            <MacroRing
              icon={proteinIcon}
              title="protein"
              valueText={`${totals.totalProtein}/${goals.proteinTarget}g`}
              progress={progress.proteinPct}
            />

            <MacroRing
              icon={fatIcon}
              title="fat"
              valueText={`${totals.totalFat}/${goals.fatTarget}g`}
              progress={progress.fatPct}
            />
          </View>
        </Card>

        {/* ✅ Streak card (ตามรูปที่ส่งมา) */}
        <Card>
          <Text style={{ color: COLORS.text, fontWeight: "900", fontSize: 18 }}>
            สถิติบันทึกต่อเนื่อง
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
            <Text style={{ color: COLORS.text, fontSize: 22, fontWeight: "900", marginLeft: 10 }}>
              วัน
            </Text>
          </View>

          <View style={{ flexDirection: "row", marginTop: 14 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: COLORS.text, fontWeight: "900", fontSize: 20 }}>
                {bestFoodStreak} วัน
              </Text>
              <Text style={{ color: COLORS.subtext, fontWeight: "800", marginTop: 4 }}>
                บันทึกอาหารนานที่สุด
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ color: COLORS.text, fontWeight: "900", fontSize: 20 }}>
                {bestBurnStreak} วัน
              </Text>
              <Text style={{ color: COLORS.subtext, fontWeight: "800", marginTop: 4 }}>
                บันทึกเผาผลาญนานที่สุด
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
                  onPress={() => navigation.navigate("ActivityDayDetail", { dateKey: d.dateKey })}
                  style={{ alignItems: "center", width: 40 }}
                >
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      borderWidth: today ? 3 : 2,
                      borderColor: ringColor,
                      backgroundColor: "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: today ? COLORS.primary : COLORS.subtext,
                        fontWeight: "900",
                        fontSize: 14,
                      }}
                    >
                      {thDowLetterMonStart(d.date)}
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

        {/* Floating + */}
        <FloatingAddButton onPress={() => navigation.navigate("FoodTab")} />
      </View>
    </Screen>
  );
}

/* ---------- sub component ---------- */

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
