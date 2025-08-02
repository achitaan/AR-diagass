import { Tabs } from "expo-router";
import { MessageSquare, Activity } from "lucide-react-native";
import React from "react";
import { colors } from "@/constants/colors";

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: colors.primary,
                headerShown: false,
                tabBarStyle: {
                    display: 'none', // Hide the tab bar since we only have one tab
                }
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Threads",
                    tabBarIcon: ({ color }) => <MessageSquare color={color} />,
                }}
            />
        </Tabs>
    );
}
