import React from "react";
import { Platform, StyleSheet, Text, View, Dimensions } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "@expo/vector-icons/Ionicons";
import type { MainTabParamList } from "../types/navigation";
import DashboardStack from "./DashboardStack";
import FoodStack from "./FoodStack";
import ActivityStack from "./ActivityStack";
import StepsScreen from "../screens/StepsScreen";
import ProfileStack from "./ProfileStack";
import { useAuth } from "../services/AuthContext";
import { useAutoDailySummary } from "../hooks/useAutoDailySummary";
import { SafeAreaView } from "react-native-safe-area-context";

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabs() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  console.log("[MainTabs] render uid =", uid);
  useAutoDailySummary(uid);

  const screenWidth = Dimensions.get("window").width;
  const tabBarWidth = screenWidth - 28;
  const pillWidth = Math.max((tabBarWidth - 12) / 5, 70);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Tab.Navigator
        initialRouteName="DashboardTab"
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: false,
          tabBarActiveTintColor: "#ffffff",
          tabBarInactiveTintColor: "rgba(255,255,255,0.82)",
          tabBarStyle: styles.tabBar,
          tabBarItemStyle: styles.tabItem,
          tabBarIconStyle: styles.tabIcon,
          tabBarIcon: ({ focused, color }) => {
            const name = route.name as keyof MainTabParamList;
            const iconName = getTabIconName(name, focused);
            const label = getTabLabel(name);
            return (
              <View style={styles.itemWrap}>
                {focused ? (
                  <View style={[styles.activePill, { width: pillWidth }]}>
                    <Ionicons name={iconName} size={22} color="#ffffff" />
                    <Text style={styles.activeLabel} numberOfLines={1} ellipsizeMode="tail">
                      {label}
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.inactivePill, { width: pillWidth }]}>
                    <Ionicons name={iconName} size={22} color={color} />
                    <Text style={styles.inactiveLabel} numberOfLines={1} ellipsizeMode="tail">
                      {label}
                    </Text>
                  </View>
                )}
              </View>
            );
          },
        })}
      >
        <Tab.Screen name="StepsTab" component={StepsScreen} />
        <Tab.Screen name="ActivityTab" component={ActivityStack} />
        <Tab.Screen name="DashboardTab" component={DashboardStack} />
        <Tab.Screen name="FoodTab" component={FoodStack} />
        <Tab.Screen name="ProfileTab" component={ProfileStack} />
      </Tab.Navigator>
    </SafeAreaView>
  );
}

function getTabLabel(routeName: keyof MainTabParamList) {
  switch (routeName) {
    case "StepsTab":
      return "Step";
    case "ActivityTab":
      return "Activity";
    case "DashboardTab":
      return "Dashboard";
    case "FoodTab":
      return "Food";
    case "ProfileTab":
      return "Profile";
    default:
      return "";
  }
}

function getTabIconName(routeName: keyof MainTabParamList, focused: boolean) {
  switch (routeName) {
    case "StepsTab":
      return focused ? "footsteps" : "footsteps-outline";
    case "ActivityTab":
      return focused ? "flame" : "flame-outline";
    case "DashboardTab":
      return focused ? "grid" : "grid-outline";
    case "FoodTab":
      return focused ? "restaurant" : "restaurant-outline";
    case "ProfileTab":
      return focused ? "person" : "person-outline";
    default:
      return focused ? "ellipse" : "ellipse-outline";
  }
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 14,
    height: 64,
    borderRadius: 999,
    backgroundColor: "#2f7cf6",
    borderTopWidth: 0,
    paddingHorizontal: 6,
    paddingTop: 12,
    paddingBottom: 6,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.18,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 10 },
    }),
  },
  tabItem: { flex: 1, alignItems: "center", justifyContent: "center" },
  tabIcon: { width: "100%" },
  itemWrap: { width: "100%", alignItems: "center", justifyContent: "center" },
  activePill: {
    height: 50,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  activeLabel: {
    marginTop: 0,
    fontSize: 11,
    lineHeight: 14,
    color: "#ffffff",
    fontWeight: "700",
    textAlign: "center",
  },
  inactivePill: {
    height: 50,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  inactiveLabel: {
    marginTop: 0,
    fontSize: 11,
    lineHeight: 14,
    color: "rgba(255,255,255,0.78)",
    fontWeight: "600",
    textAlign: "center",
  },
});
