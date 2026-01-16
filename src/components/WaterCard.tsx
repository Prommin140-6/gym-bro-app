import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "./ui/Card";
import { COLORS } from "../theme/colors";
import { useWater } from "../hooks/useWater";

type Props = {
    uid: string | null;
    onPressSettings?: () => void;
};

export default function WaterCard({ uid, onPressSettings }: Props) {
    const water = useWater(uid);

    const consumedText = useMemo(() => `${water.todayMl} ml`, [water.todayMl]);
    const targetText = useMemo(() => {
        const cupLabel = water.goalCups === 1 ? "cup" : "cups";
        return `Target: ${water.goalMl} ml (${water.goalCups} ${cupLabel})`;
    }, [water.goalMl, water.goalCups]);

    return (
        <Card style={styles.card}>
            <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>Drink water</Text>

                    <View style={styles.valueRow}>
                        <Text style={styles.value}>{consumedText}</Text>
                        <View style={styles.badge}>
                            <Ionicons name="water" size={14} color={COLORS.primary} />
                            <Text style={styles.badgeText}>
                                {water.todayCups}/{water.goalCups}
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.sub}>{targetText}</Text>
                </View>

                <Pressable onPress={onPressSettings} hitSlop={12} style={styles.iconBtn}>
                    <Ionicons name="create-outline" size={18} color={COLORS.subtext} />
                </Pressable>
            </View>

            <View style={styles.divider} />

            <View style={styles.dropsRow}>
                {Array.from({ length: water.goalCups }).map((_, i) => {
                    const idx = i + 1;
                    const filled = idx <= water.todayCups;

                    const onPressDrop = async () => {
                        if (filled && idx === water.todayCups) {
                            await water.setCups(Math.max(0, water.todayCups - 1));
                        } else {
                            await water.setCups(idx);
                        }
                    };

                    return (
                        <Pressable
                            key={`drop-${i}`}
                            onPress={onPressDrop}
                            hitSlop={10}
                            style={[styles.dropBtn, filled && styles.dropBtnFilled]}
                        >
                            <Ionicons
                                name={filled ? "water" : "water-outline"}
                                size={24}
                                color={filled ? COLORS.primary : COLORS.subtext}
                            />
                        </Pressable>
                    );
                })}
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        paddingTop: 14,
        paddingBottom: 12,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
    },
    title: {
        color: COLORS.text,
        fontSize: 14,
        fontWeight: "900",
    },
    valueRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginTop: 6,
    },
    value: {
        color: COLORS.text,
        fontSize: 22,
        fontWeight: "900",
    },
    badge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: "rgba(255,255,255,0.04)",
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    badgeText: {
        color: COLORS.subtext,
        fontWeight: "900",
        fontSize: 12,
    },
    sub: {
        marginTop: 4,
        color: COLORS.subtext,
        fontWeight: "800",
        fontSize: 12,
    },
    iconBtn: {
        width: 34,
        height: 34,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.04)",
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginTop: 12,
        marginBottom: 10,
    },
    dropsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        alignItems: "center",
    },
    // --- ปรับขนาดหยดน้ำให้ใหญ่ขึ้น ---
    dropBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "transparent",
    },
    dropBtnFilled: {
        backgroundColor: "rgba(255,255,255,0.03)",
    },
});
