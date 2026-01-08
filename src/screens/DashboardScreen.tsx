import React from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { useAuth } from "../services/AuthContext";
import { useTodayNutrition } from "../hooks/useTodayNutrition";

import { Screen } from "../components/ui/Screen";
import { Card } from "../components/ui/Card";
import { COLORS } from "../theme/colors";

import { ProgressRing } from "../components/ProgressRing";
import { MacroRing } from "../components/MacroRing";
import { FloatingAddButton } from "../components/FloatingAddButton";

import carbIcon from "../../assets/icon/carbicon.png";
import proteinIcon from "../../assets/icon/proteinicon.png";
import fatIcon from "../../assets/icon/faticon.png";

export default function DashboardScreen() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const navigation = useNavigation<any>();
  const { goals, totals, progress } = useTodayNutrition(uid);

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
          {/* subtle more button */}
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
              ...
            </Text>
          </Pressable>

          <ProgressRing
            progress={progress.calPct}
            labelTop="calories today"
            centerValue={`${totals.totalCalories}`}
            labelBottom={`goal ${goals.calorieTarget}`}
          />

          <View style={{ height: 12 }} />

          {/* Mini stats (centered) */}
          <View
            style={{
              flexDirection: "row",
              alignSelf: "center",
              marginTop: 6,
            }}
          >
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

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
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
