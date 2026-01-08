import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, Alert, Image, Modal, ScrollView } from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import * as ImagePicker from "expo-image-picker";

import { useAuth } from "../services/AuthContext";
import { addCustomFood } from "../services/firestoreCustomFoods";
import { uploadCustomFoodImage } from "../services/storageUpload";

import type { FoodCategory } from "../types/food";
import { COLORS } from "../theme/colors";
import { RADIUS } from "../theme/radius";

const CATEGORY_LABEL: Record<FoodCategory, string> = {
  rice: "Rice",
  noodle: "Noodles",
  salad: "Salad",
  soup: "Soup",
  dessert: "Dessert",
  drink: "Drinks",
  snack: "Snacks",
  other: "Other",
};

const CATEGORY_ORDER: FoodCategory[] = ["rice", "noodle", "salad", "soup", "dessert", "drink", "snack", "other"];

function toNumber(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function AddFoodScreen({ navigation }: any) {
  const tabBarHeight = useBottomTabBarHeight();

  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const [name, setName] = useState("");
  const [category, setCategory] = useState<FoodCategory>("other");

  const [cal, setCal] = useState("");
  const [carb, setCarb] = useState("");
  const [protein, setProtein] = useState("");
  const [fat, setFat] = useState("");

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [catOpen, setCatOpen] = useState(false);

  const canSave = useMemo(() => {
    return name.trim().length > 0 && toNumber(cal) > 0 && !saving;
  }, [name, cal, saving]);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission required", "Please allow photo access.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const validate = () => {
    if (!name.trim()) return "Please enter food name.";
    const calories = toNumber(cal);
    if (calories <= 0) return "Calories must be greater than 0.";
    return null;
  };

  const onSave = async () => {
    if (!uid) return Alert.alert("Error", "Not logged in");

    const err = validate();
    if (err) return Alert.alert("Invalid", err);

    setSaving(true);
    try {
      let imageUrl: string | null = null;
      if (imageUri) imageUrl = await uploadCustomFoodImage(uid, imageUri);

      await addCustomFood(uid, {
        name: name.trim(),
        category,
        calories_per_serving: toNumber(cal),
        carbs_g: toNumber(carb),
        protein_g: toNumber(protein),
        fat_g: toNumber(fat),
        imageUrl,
      });

      Alert.alert("Saved", "Your custom menu has been added.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* ✅ Scroll ทั้งหน้า รวมปุ่ม Save */}
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          gap: 14,
          paddingBottom: tabBarHeight + 28, // ✅ กัน bottom tab บังปุ่ม
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ gap: 4 }}>
          <Text style={{ color: COLORS.text, fontSize: 22, fontWeight: "900" }}>Add new food</Text>
          <Text style={{ color: COLORS.subtext, fontWeight: "700" }}>Create your custom menu</Text>
        </View>

        {/* Image */}
        <Pressable
          onPress={pickImage}
          style={{
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: RADIUS.lg,
            backgroundColor: COLORS.surface,
            overflow: "hidden",
          }}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={{ width: "100%", height: 190 }} />
          ) : (
            <View style={{ height: 190, alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Text style={{ color: COLORS.text, fontWeight: "900" }}>Add food image</Text>
              <Text style={{ color: COLORS.subtext, fontWeight: "700" }}>Tap to choose from gallery</Text>
            </View>
          )}
        </Pressable>

        {/* Form card */}
        <View
          style={{
            backgroundColor: COLORS.surface,
            borderRadius: RADIUS.lg,
            borderWidth: 1,
            borderColor: COLORS.border,
            padding: 14,
            gap: 12,
          }}
        >
          <Field label="Name" value={name} onChange={setName} placeholder="e.g., Omelette rice" />

          {/* Category dropdown */}
          <View style={{ gap: 6 }}>
            <Text style={{ color: COLORS.text, fontWeight: "900" }}>Category</Text>

            <Pressable
              onPress={() => setCatOpen(true)}
              style={{
                borderWidth: 1,
                borderColor: COLORS.border,
                borderRadius: RADIUS.md,
                padding: 12,
                backgroundColor: COLORS.surface2,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ color: COLORS.text, fontWeight: "800" }}>{CATEGORY_LABEL[category]}</Text>
              <Text style={{ color: COLORS.subtext, fontWeight: "900" }}>▾</Text>
            </Pressable>
          </View>

          <Field label="Calories / serving (kcal)" value={cal} onChange={setCal} placeholder="e.g., 600" keyboard="numeric" />

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Field label="Carbs (g)" value={carb} onChange={setCarb} placeholder="e.g., 70" keyboard="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Protein (g)" value={protein} onChange={setProtein} placeholder="e.g., 30" keyboard="numeric" />
            </View>
          </View>

          <Field label="Fat (g)" value={fat} onChange={setFat} placeholder="e.g., 20" keyboard="numeric" />
        </View>

        {/* ✅ Save button อยู่ใน scroll */}
        <Pressable
          onPress={onSave}
          disabled={!canSave}
          style={{
            backgroundColor: COLORS.primary,
            paddingVertical: 14,
            borderRadius: RADIUS.lg,
            alignItems: "center",
            opacity: canSave ? 1 : 0.6,
            marginTop: 6,
          }}
        >
          <Text style={{ color: COLORS.text, fontWeight: "900", fontSize: 16 }}>
            {saving ? "Saving..." : "Save"}
          </Text>
        </Pressable>
      </ScrollView>

      {/* Category Modal */}
      <Modal visible={catOpen} transparent animationType="fade" onRequestClose={() => setCatOpen(false)}>
        <Pressable
          onPress={() => setCatOpen(false)}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.55)",
            padding: 16,
            justifyContent: "center",
          }}
        >
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: COLORS.surface,
              borderRadius: RADIUS.lg,
              borderWidth: 1,
              borderColor: COLORS.border,
              padding: 14,
              gap: 10,
            }}
          >
            <Text style={{ color: COLORS.text, fontWeight: "900", fontSize: 16 }}>Select category</Text>

            <View style={{ gap: 8 }}>
              {CATEGORY_ORDER.map((c) => {
                const active = c === category;
                return (
                  <Pressable
                    key={c}
                    onPress={() => {
                      setCategory(c);
                      setCatOpen(false);
                    }}
                    style={{
                      paddingVertical: 12,
                      paddingHorizontal: 12,
                      borderRadius: RADIUS.md,
                      backgroundColor: active ? "rgba(47,136,255,0.18)" : COLORS.surface2,
                      borderWidth: 1,
                      borderColor: active ? "rgba(47,136,255,0.45)" : COLORS.border,
                    }}
                  >
                    <Text style={{ color: COLORS.text, fontWeight: "900" }}>{CATEGORY_LABEL[c]}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable onPress={() => setCatOpen(false)} style={{ alignItems: "center", paddingTop: 6 }}>
              <Text style={{ color: COLORS.subtext, fontWeight: "900" }}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboard?: "default" | "numeric";
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: COLORS.text, fontWeight: "900" }}>{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={(v) => props.onChange(v)}
        placeholder={props.placeholder}
        placeholderTextColor={COLORS.subtext}
        keyboardType={props.keyboard ?? "default"}
        style={{
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: RADIUS.md,
          padding: 12,
          backgroundColor: COLORS.surface2,
          color: COLORS.text,
          fontWeight: "800",
        }}
      />
    </View>
  );
}
