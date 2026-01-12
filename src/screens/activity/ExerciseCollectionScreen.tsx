// src/screens/activity/ExerciseCollectionScreen.tsx
import React, { useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView, Image } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";

import { COLORS } from "../../theme/colors";
import type { ActivityStackParamList } from "../../types/navigation";
import type { ActivityKey } from "../../utils/met";
import { ACTIVITY_LABEL } from "../../utils/met";

import { useAuth } from "../../services/AuthContext";
import { ActivityAddModal } from "../../components/activity/ActivityAddModal";

type Props = NativeStackScreenProps<ActivityStackParamList, "ExerciseCollection">;

type ExerciseItem = {
  id: string;
  title: string;
  desc: string;
  imageSource?: any;
};

function exercisesOf(activityKey: ActivityKey): ExerciseItem[] {
  switch (activityKey) {
    case "lifting":
    case "resistance_training":
      return [
        { id: "chest", title: "Chest workout", desc: "Bench / push movements" },
        { id: "legs", title: "Leg workout", desc: "Squat / lunge movements" },
        { id: "arms", title: "Arms workout", desc: "Biceps / triceps focus" },
        { id: "back", title: "Back workout", desc: "Pull movements" },
      ];
    case "aerobic":
    case "aerobic_exercise":
      return [
        { id: "run", title: "Running", desc: "Steady cardio" },
        { id: "hiit", title: "HIIT", desc: "Intervals and bursts" },
        { id: "jump", title: "Jump rope", desc: "Fast-paced cardio" },
      ];
    case "swimming":
      return [
        { id: "freestyle", title: "Freestyle", desc: "Moderate full-body swim" },
        { id: "laps", title: "Swim laps", desc: "Consistent pacing" },
      ];
    case "cycling":
      return [
        { id: "indoor", title: "Indoor cycling", desc: "Stationary bike session" },
        { id: "outdoor", title: "Outdoor cycling", desc: "Road/park ride" },
      ];
    case "flexibility_exercise":
      return [
        { id: "stretch", title: "Stretching", desc: "Full-body mobility" },
        { id: "yoga", title: "Yoga flow", desc: "Flexibility & breathing" },
      ];
    case "balance_exercise":
      return [
        { id: "core", title: "Core balance", desc: "Stability & control" },
        { id: "single", title: "Single-leg balance", desc: "Simple balance drills" },
      ];
    default:
      return [{ id: "basic", title: "Workout", desc: "General session" }];
  }
}

export default function ExerciseCollectionScreen({ route }: Props) {
  const navigation = useNavigation<any>();
  const { activityKey } = route.params;

  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const weightKg = 66; // เดี๋ยวค่อยผูก profile

  const items = useMemo(() => exercisesOf(activityKey), [activityKey]);

  const [selected, setSelected] = useState<ExerciseItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const openModal = (it: ExerciseItem) => {
    setSelected(it);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelected(null);
  };

  const headerTitle = ACTIVITY_LABEL[activityKey] ?? "Exercises";

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text style={{ color: COLORS.text, fontSize: 22, fontWeight: "900" }}>
          {headerTitle}
        </Text>
        <Text style={{ color: COLORS.subtext, fontWeight: "700" }}>
          Pick an exercise to log
        </Text>

        <View style={{ gap: 12, marginTop: 6 }}>
          {items.map((it) => (
            <Pressable
              key={it.id}
              onPress={() => openModal(it)}
              style={{
                padding: 14,
                borderRadius: 18,
                backgroundColor: COLORS.surface,
                borderWidth: 1,
                borderColor: COLORS.border,
                gap: 10,
              }}
            >
              <View
                style={{
                  height: 140,
                  borderRadius: 16,
                  backgroundColor: COLORS.surface2,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  overflow: "hidden",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {it.imageSource ? (
                  <Image source={it.imageSource} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                ) : (
                  <Text style={{ color: COLORS.subtext, fontWeight: "900" }}>Image (placeholder)</Text>
                )}
              </View>

              <View style={{ gap: 4 }}>
                <Text style={{ color: COLORS.text, fontWeight: "900", fontSize: 16 }}>
                  {it.title}
                </Text>
                <Text style={{ color: COLORS.subtext, fontWeight: "700" }}>
                  {it.desc}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <ActivityAddModal
        visible={modalVisible}
        onClose={closeModal}
        onSaved={() => {
          closeModal();
          navigation.popToTop(); 
        }}
        uid={uid}
        weightKg={weightKg}
        activityKey={activityKey}
        title={selected?.title}
        description={selected?.desc}
        imageSource={selected?.imageSource}
      />
    </View>
  );
}
