import { Tabs } from "expo-router";
import React from "react";

import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "index",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "hand-left" : "hand-left-outline"}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="feeding-time"
        options={{
          title: "Feeding Time",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "time" : "time-outline"}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="stream-feed"
        options={{
          title: "Stream Feed",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "videocam" : "videocam-outline"}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Analytics",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "analytics" : "analytics-outline"}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="rfid-identification"
        options={{
          title: "RFID Identification",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "id-card" : "id-card-outline"}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
