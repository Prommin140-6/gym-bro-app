import React, { useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { Screen } from "../components/ui/Screen";
import { COLORS } from "../theme/colors";

import { useAuth } from "../services/AuthContext";
import { useActivityMonth } from "../hooks/useActivityMonth";
import { ActivityMonthView } from "../components/activity/ActivityMonthView";

export default function HealthHistoryScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const [monthBase, setMonthBase] = useState(() => new Date());
  const { loadingMonth, monthDocs } = useActivityMonth(uid, monthBase);

  const monthTitle = useMemo(() => {
    const m = monthBase.toLocaleString("en-US", { month: "long" });
    const y = monthBase.getFullYear();
    return `${m} ${y}`;
  }, [monthBase]);

  return (
    <Screen>
      <View style={{ flex: 1, padding: 16 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
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
            <Ionicons name="chevron-back" size={20} color={COLORS.text} />
          </Pressable>

          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: "900" }}>
              Health History
            </Text>
            <Text style={{ color: COLORS.subtext, fontWeight: "700", marginTop: 2 }}>
              {monthTitle}
            </Text>
          </View>

          <View style={{ width: 40 }} />
        </View>

        {/* Month picker (reuse) */}
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
          <ActivityMonthView
            baseDate={monthBase}
            loading={loadingMonth}
            monthDocs={monthDocs}
            onPrevMonth={() =>
              setMonthBase((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
            }
            onNextMonth={() =>
              setMonthBase((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
            }
            onSelectDay={(dateKey) => navigation.navigate("HealthHistoryDay", { dateKey })}
          />
        </ScrollView>
      </View>
    </Screen>
  );
}
