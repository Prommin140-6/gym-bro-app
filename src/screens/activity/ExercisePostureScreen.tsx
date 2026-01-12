import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { COLORS } from "../../theme/colors";
import type { ActivityKey } from "../../utils/met";

type PopularItem = {
  key: ActivityKey;
  title: string;
  desc: string;
};

const POPULAR: PopularItem[] = [
  { key: "lifting", title: "Lifting", desc: "Strength training" },
  { key: "aerobic", title: "Aerobic", desc: "Cardio session" },
  { key: "swimming", title: "Swimming", desc: "Full-body cardio" },
  { key: "cycling", title: "Cycling", desc: "Endurance ride" },
];

export default function ExercisePostureScreen() {
  const navigation = useNavigation<any>();

  const goCollection = (activityKey: ActivityKey) => {
    navigation.navigate("ExerciseCollection", { activityKey });
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <Text style={{ color: COLORS.text, fontSize: 22, fontWeight: "900" }}>
          Exercise posture
        </Text>
        <Text style={{ color: COLORS.subtext, fontWeight: "700" }}>
          Choose a category then pick an exercise
        </Text>

        {/* Popular activities */}
        <View style={{ gap: 10 }}>
          <Text style={{ color: COLORS.text, fontWeight: "900" }}>
            Popular activities
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10 }}
          >
            {POPULAR.map((it) => (
              <Pressable
                key={it.key}
                onPress={() => goCollection(it.key)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 999,
                  backgroundColor: COLORS.surface2,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
              >
                <Text style={{ color: COLORS.text, fontWeight: "900" }}>
                  {it.title}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Our collection: เลือกหมวด -> ไป collection */}
        <View style={{ gap: 10, marginTop: 6 }}>
          <Text style={{ color: COLORS.text, fontWeight: "900" }}>
            Our collection
          </Text>

          <CollectionCard
            title="Aerobic Exercise"
            desc="Improve heart health and endurance"
            onPress={() => goCollection("aerobic_exercise")}
          />
          <CollectionCard
            title="Resistance Training"
            desc="Build strength and muscle"
            onPress={() => goCollection("resistance_training")}
          />
          <CollectionCard
            title="Flexibility Exercise"
            desc="Increase range of motion"
            onPress={() => goCollection("flexibility_exercise")}
          />
          <CollectionCard
            title="Balance Exercise"
            desc="Improve stability and control"
            onPress={() => goCollection("balance_exercise")}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function CollectionCard(props: {
  title: string;
  desc: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={props.onPress}
      style={{
        padding: 14,
        borderRadius: 18,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: 6,
      }}
    >
      <Text style={{ color: COLORS.text, fontWeight: "900", fontSize: 16 }}>
        {props.title}
      </Text>
      <Text style={{ color: COLORS.subtext, fontWeight: "700" }}>
        {props.desc}
      </Text>
      <Text style={{ color: COLORS.subtext, fontWeight: "800", marginTop: 2 }}>
        10 exercises
      </Text>
    </Pressable>
  );
}
