import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ThreadsProvider } from "@/hooks/use-threads-store";
import { initializeTensorFlow } from "@/utils/tensorflow";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="session" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
        </Stack>
    );
}

export default function RootLayout() {
    useEffect(() => {
        const initApp = async () => {
            // Initialize TensorFlow.js
            await initializeTensorFlow();
            // Hide splash screen after TensorFlow is ready
            SplashScreen.hideAsync();
        };
        
        initApp();
    }, []);

    return (
        <QueryClientProvider client={queryClient}>
            <ThreadsProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                    <RootLayoutNav />
                </GestureHandlerRootView>
            </ThreadsProvider>
        </QueryClientProvider>
    );
}
 