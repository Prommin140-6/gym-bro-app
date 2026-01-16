import React, { useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    Pressable,
    Modal,
    FlatList,
    Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { Screen } from "../../components/ui/Screen";
import { COLORS } from "../../theme/colors";
import { useAuth } from "../../services/AuthContext";
import {
    ACHIEVEMENT_DEFS,
    subscribeAchievements,
    type AchievementDoc,
} from "../../services/firestoreAchievements";
import type { ActivityStackParamList } from "../../types/navigation";

/* ---------- icons ---------- */
import burnIcon from "../../../assets/iconachievements/burn.png";
import calorieIcon from "../../../assets/iconachievements/calorie.png";
import fireIcon from "../../../assets/iconachievements/fire.png";

type Nav = NativeStackNavigationProp<ActivityStackParamList>;
type BadgeKey = "burn" | "calorie" | "fire";

type BadgeConfig = {
    key: BadgeKey;
    title: string;
    subtitle: string;
    icon: any;
    color: string;
};

const BADGES: BadgeConfig[] = [
    {
        key: "burn",
        title: "Perfect Burn",
        subtitle: "Burn Streak",
        icon: burnIcon,
        color: "#5e97d3",
    },
    {
        key: "calorie",
        title: "Perfect Calorie",
        subtitle: "Calorie Streak",
        icon: calorieIcon,
        color: "#00bf63",
    },
    {
        key: "fire",
        title: "Fire Streak",
        subtitle: "Fire Streak",
        icon: fireIcon,
        color: "#ffca08",
    },
];

function formatUnlockedAt(v: any) {
    try {
        const d: Date | null =
            v?.toDate?.() instanceof Date ? (v.toDate() as Date) : null;
        if (!d) return null;

        const pad = (n: number) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
            d.getDate()
        )} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
        return null;
    }
}

/* ---------- Badge ---------- */
function Badge3D({
    title,
    count,
    icon,
    color,
    locked,
    onPress,
}: {
    title: string;
    count: number;
    icon: any;
    color: string;
    locked: boolean;
    onPress: () => void;
}) {
    const opacity = locked ? 0.35 : 1;

    return (
        <Pressable onPress={onPress} style={{ width: "33.33%", alignItems: "center" }}>
            <View style={{ alignItems: "center" }}>
                <View
                    style={{
                        width: 78,
                        height: 78,
                        borderRadius: 18,
                        backgroundColor: color,
                        alignItems: "center",
                        justifyContent: "center",
                        opacity,
                    }}
                >
                    <Image
                        source={icon}
                        style={{
                            width: 46,
                            height: 46,
                            resizeMode: "contain",
                            shadowColor: "#000",
                            shadowOpacity: 0.2,
                            shadowRadius: 4,
                            shadowOffset: { width: 0, height: 2 },
                        }}
                    />
                </View>

                <Text
                    style={{
                        marginTop: 8,
                        color: locked ? COLORS.subtext : COLORS.text,
                        fontSize: 12,
                        fontWeight: "800",
                    }}
                >
                    {title.toLowerCase()}
                </Text>

                <View
                    style={{
                        marginTop: 6,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 999,
                        backgroundColor: COLORS.surface2,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                    }}
                >
                    <Text style={{ color: COLORS.text, fontSize: 12, fontWeight: "900" }}>
                        {count}x
                    </Text>
                </View>
            </View>
        </Pressable>
    );
}

/* ---------- Screen ---------- */
export default function AchievementsScreen() {
    const navigation = useNavigation<Nav>();
    const { user } = useAuth();
    const uid = user?.uid ?? null;

    const [ach, setAch] = useState<Record<string, AchievementDoc>>({});
    const [openKey, setOpenKey] = useState<BadgeKey | null>(null);

    useEffect(() => {
        if (!uid) return;
        return subscribeAchievements(uid, setAch);
    }, [uid]);

    const grouped = useMemo(() => {
        const byType: Record<BadgeKey, AchievementDoc[]> = {
            burn: [],
            calorie: [],
            fire: [],
        };

        for (const def of ACHIEVEMENT_DEFS) {
            const doc = ach[def.id] ?? {
                id: def.id,
                type: def.type,
                targetDays: def.targetDays,
                unlocked: false,
                unlockedAt: null,
            };
            byType[def.type as BadgeKey].push(doc);
        }

        (Object.keys(byType) as BadgeKey[]).forEach((k) =>
            byType[k].sort((a, b) => a.targetDays - b.targetDays)
        );

        const unlockedCount = (k: BadgeKey) =>
            byType[k].filter((x) => x.unlocked).length;

        return { byType, unlockedCount };
    }, [ach]);

    const modalData = useMemo(() => {
        if (!openKey) return null;

        const title =
            openKey === "burn"
                ? "Burn Streak"
                : openKey === "calorie"
                    ? "Calorie Streak"
                    : "Fire Streak";

        const rule =
            openKey === "burn"
                ? "Burn calories reaching your daily burn target continuously."
                : openKey === "calorie"
                    ? "Consume calories reaching your daily calorie target continuously."
                    : "Reach both burn and calorie targets every day without missing.";

        return {
            title,
            rule,
            list: grouped.byType[openKey],
            color: BADGES.find((b) => b.key === openKey)?.color ?? COLORS.primary,
        };
    }, [openKey, grouped]);

    return (
        <Screen>
            <View style={{ flex: 1, padding: 16 }}>
                {/* Header */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
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
                        <Ionicons name="chevron-back" size={22} color={COLORS.text} />
                    </Pressable>

                    <Text style={{ color: COLORS.text, fontSize: 22, fontWeight: "900" }}>
                        Achievement
                    </Text>
                </View>

                {/* Badges */}
                <View style={{ flexDirection: "row", marginTop: 24 }}>
                    {BADGES.map((b) => {
                        const count = grouped.unlockedCount(b.key);
                        return (
                            <Badge3D
                                key={b.key}
                                title={b.title}
                                count={count}
                                icon={b.icon}
                                color={b.color}
                                locked={count === 0}
                                onPress={() => setOpenKey(b.key)}
                            />
                        );
                    })}
                </View>

                {/* Modal */}
                <Modal visible={!!openKey} transparent animationType="fade">
                    <Pressable
                        onPress={() => setOpenKey(null)}
                        style={{
                            flex: 1,
                            backgroundColor: "rgba(0,0,0,0.6)",
                            justifyContent: "flex-end",
                            padding: 16,
                        }}
                    >
                        <Pressable
                            onPress={() => { }}
                            style={{
                                backgroundColor: COLORS.surface,
                                borderRadius: 18,
                                padding: 14,
                                borderWidth: 1,
                                borderColor: COLORS.border,
                                maxHeight: "75%",
                            }}
                        >
                            <Text
                                style={{
                                    color: modalData?.color,
                                    fontSize: 18,
                                    fontWeight: "900",
                                }}
                            >
                                {modalData?.title}
                            </Text>

                            <Text
                                style={{
                                    color: COLORS.subtext,
                                    fontSize: 12,
                                    marginBottom: 12,
                                }}
                            >
                                {modalData?.rule}
                            </Text>

                            <FlatList
                                data={modalData?.list ?? []}
                                keyExtractor={(it) => it.id}
                                renderItem={({ item }) => {
                                    const unlockedAt = formatUnlockedAt(item.unlockedAt);
                                    return (
                                        <View
                                            style={{
                                                flexDirection: "row",
                                                justifyContent: "space-between",
                                                marginBottom: 10,
                                            }}
                                        >
                                            <Text style={{ color: COLORS.text, fontWeight: "800" }}>
                                                {item.targetDays} days
                                            </Text>
                                            <Text style={{ color: COLORS.subtext, fontSize: 12 }}>
                                                {item.unlocked
                                                    ? unlockedAt
                                                        ? `Unlocked at ${unlockedAt}`
                                                        : "Unlocked"
                                                    : "Locked"}
                                            </Text>
                                        </View>
                                    );
                                }}
                            />
                        </Pressable>
                    </Pressable>
                </Modal>
            </View>
        </Screen>
    );
}
