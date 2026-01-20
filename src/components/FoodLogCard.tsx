import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Alert } from "react-native";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

import { db } from "../services/firebase";
import { getDateKey } from "../utils/dateKey";
import { deleteTodayFood } from "../services/firestoreFoodLog";

import { Card } from "./ui/Card";
import { FoodSwipeRow, type FoodLogItem } from "./FoodSwipeRow";
import { COLORS } from "../theme/colors";

export function FoodLogCard({ uid }: { uid: string | null }) {
  const [foods, setFoods] = useState<FoodLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setFoods([]);
      setLoading(false);
      return;
    }

    const dateKey = getDateKey();
    const q = query(
      collection(db, "users", uid, "dailyLogs", dateKey, "foods"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const items: FoodLogItem[] = snap.docs.map((doc) => {
          const data = doc.data() as any;
          return {
            id: doc.id,
            name: data.name_snapshot ?? "Unknown",
            servings: data.servings ?? 1,
            imageUrl: data.imageUrl_snapshot ?? null,
            totals: data.totals ?? {
              totalCalories: 0,
              totalCarbs: 0,
              totalProtein: 0,
              totalFat: 0,
            },
          };
        });
        setFoods(items);
        setLoading(false);
      },
      (error) => {
        console.warn("[FoodLogCard] Error fetching foods:", error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [uid]);

  const onDelete = (id: string) => {
    if (!uid) return;

    Alert.alert("Delete food", "Remove this food from today's log?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteTodayFood(uid, id);
          } catch (e) {
            console.warn("[FoodLogCard] Delete failed:", e);
            Alert.alert("Error", "Failed to delete food");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <Card>
        <Text style={{ color: COLORS.text, fontWeight: "900", fontSize: 16 }}>
          Food Log
        </Text>
        <View style={{ marginTop: 12, alignItems: "center" }}>
          <Text style={{ color: COLORS.subtext, fontWeight: "700" }}>Loading...</Text>
        </View>
      </Card>
    );
  }

  if (foods.length === 0) {
    return (
      <Card>
        <Text style={{ color: COLORS.text, fontWeight: "900", fontSize: 16, marginBottom: 8 }}>
          Food Log
        </Text>
        <View style={{ alignItems: "center", paddingVertical: 16 }}>
          <Text style={{ color: COLORS.subtext, fontWeight: "700" }}>
            No food logged yet
          </Text>
          <Text style={{ color: COLORS.subtext, fontWeight: "600", fontSize: 12, marginTop: 4 }}>
            Go to Food tab to add some
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <Card>
      <Text style={{ color: COLORS.text, fontWeight: "900", fontSize: 16, marginBottom: 12 }}>
        Food Log
      </Text>

      <FlatList
        data={foods}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 8 }}>
            <FoodSwipeRow item={item} onDelete={onDelete} />
          </View>
        )}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
      />
    </Card>
  );
}
