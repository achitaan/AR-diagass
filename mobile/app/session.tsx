import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Pressable,
    Alert,
    Platform,
    SafeAreaView,
    PanResponder
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import {
    Mic,
    MicOff,
    Eye,
    EyeOff,
    ArrowUpDown,
    RotateCcw,
    RotateCw,
    Check,
    Send
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useThreads } from '@/hooks/use-threads-store';
import { ChatOverlay } from '@/components/ChatOverlay';
import { DepthToggle } from '@/components/DepthToggle';
import { DepthLevel } from '@/types/thread';
import { colors } from '@/constants/colors';
import { borderRadius, spacing } from '@/constants/theme';

export default function SessionScreen() {
    const router = useRouter();
    const [permission, requestPermission] = useCameraPermissions();
    const [cameraType] = useState<CameraType>('back');
    const [micEnabled, setMicEnabled] = useState(false);
    const [chatVisible, setChatVisible] = useState(true);
    const [currentDepth, setCurrentDepth] = useState<DepthLevel>('skin');
    const [radiatingMode, setRadiatingMode] = useState(false);
    const [drawingPoints, setDrawingPoints] = useState<{ x: number, y: number }[]>([]);

    const { getCurrentThread, addMessage, addDrawingStroke } = useThreads();
    const currentThread = getCurrentThread();

    // Pan responder for swipe gestures to change depth
    const panResponder = PanResponder.create({
        onMoveShouldSetPanResponder: (evt, gestureState) => {
            return Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dy) < 50;
        },
        onPanResponderMove: () => { },
        onPanResponderRelease: (evt, gestureState) => {
            if (gestureState.dx > 50) {
                // Swipe right - next depth level
                handleDepthChange(getNextDepth(currentDepth));
            } else if (gestureState.dx < -50) {
                // Swipe left - previous depth level
                handleDepthChange(getPreviousDepth(currentDepth));
            }
        },
    });

    const getNextDepth = (depth: DepthLevel): DepthLevel => {
        const depthLevels: DepthLevel[] = ['skin', 'muscle', 'deep'];
        const currentIndex = depthLevels.indexOf(depth);
        return depthLevels[(currentIndex + 1) % depthLevels.length];
    };

    const getPreviousDepth = (depth: DepthLevel): DepthLevel => {
        const depthLevels: DepthLevel[] = ['skin', 'muscle', 'deep'];
        const currentIndex = depthLevels.indexOf(depth);
        return depthLevels[(currentIndex - 1 + depthLevels.length) % depthLevels.length];
    };

    // Request camera permission if not granted
    useEffect(() => {
        if (!permission?.granted) {
            requestPermission();
        }
    }, [permission, requestPermission]);

    const handleSave = () => {
        // Save the current session
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Show success message
        Alert.alert(
            'Session Saved',
            'Your pain session has been saved successfully.',
            [
                {
                    text: 'OK',
                    onPress: () => router.back(),
                },
            ]
        );
    };

    const handleToggleMic = () => {
        setMicEnabled(!micEnabled);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleToggleChat = () => {
        setChatVisible(!chatVisible);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleDepthChange = (depth: DepthLevel) => {
        setCurrentDepth(depth);
    };

    const handleToggleRadiatingMode = () => {
        setRadiatingMode(!radiatingMode);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    const handleUndo = () => {
        // In a real app, this would undo the last drawing action
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleRedo = () => {
        // In a real app, this would redo the last undone drawing action
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleTouchStart = (event: any) => {
        const { locationX, locationY } = event.nativeEvent;
        setDrawingPoints([{ x: locationX, y: locationY }]);
    };

    const handleTouchMove = (event: any) => {
        const { locationX, locationY } = event.nativeEvent;
        setDrawingPoints([...drawingPoints, { x: locationX, y: locationY }]);
    };

    const handleTouchEnd = () => {
        if (drawingPoints.length > 0) {
            addDrawingStroke(drawingPoints, currentDepth);
            setDrawingPoints([]);
        }
    };

    // If no camera permission, show request screen
    if (!permission?.granted) {
        return (
            <SafeAreaView style={styles.permissionContainer}>
                <Text style={styles.permissionText}>
                    We need camera permission to use the AR features.
                </Text>
                <Pressable
                    style={styles.permissionButton}
                    onPress={requestPermission}
                >
                    <Text style={styles.permissionButtonText}>Grant Permission</Text>
                </Pressable>
            </SafeAreaView>
        );
    }

    return (
        <View style={styles.container} {...panResponder.panHandlers}>
            <StatusBar style="light" />

            {/* Camera View */}
            <CameraView
                style={styles.camera}
                facing={cameraType}
                testID="camera-view"
            />

            {/* Drawing Canvas */}
            <View
                style={styles.drawingCanvas}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            />

            {/* Depth Tag - Top Left */}
            <View style={styles.depthTag}>
                <Text style={styles.depthTagText}>{currentDepth.toUpperCase()}</Text>
            </View>

            {/* Topbar with centered controls */}
            <SafeAreaView style={styles.topbar}>
                <View style={styles.topbarContent}>
                    <Pressable
                        style={styles.controlButton}
                        onPress={handleToggleChat}
                        testID="chat-toggle"
                    >
                        {chatVisible ? (
                            <Eye size={24} color="#fff" />
                        ) : (
                            <EyeOff size={24} color="#fff" />
                        )}
                    </Pressable>
                    <Pressable
                        style={[
                            styles.controlButton,
                            radiatingMode && styles.activeControlButton
                        ]}
                        onPress={handleToggleRadiatingMode}
                        testID="radiating-toggle"
                    >
                        <ArrowUpDown size={24} color="#fff" />
                    </Pressable>
                    <Pressable
                        style={styles.controlButton}
                        onPress={handleUndo}
                        testID="undo-button"
                    >
                        <RotateCcw size={24} color="#fff" />
                    </Pressable>
                    <Pressable
                        style={styles.controlButton}
                        onPress={handleRedo}
                        testID="redo-button"
                    >
                        <RotateCw size={24} color="#fff" />
                    </Pressable>
                    <Pressable
                        style={styles.saveButton}
                        onPress={handleSave}
                        testID="save-button"
                    >
                        <Check size={24} color="#fff" />
                    </Pressable>
                </View>
            </SafeAreaView>

            {/* Chat Overlay below topbar */}
            {currentThread && (
                <View style={styles.chatContainer} pointerEvents={chatVisible ? 'auto' : 'none'}>
                    <ChatOverlay
                        messages={currentThread.messages}
                        visible={chatVisible}
                        onSendMessage={(message) => addMessage(message, true)}
                        messageStyle={styles.gradientMessage}
                        micEnabled={micEnabled}
                        onToggleMic={handleToggleMic}
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    camera: {
        flex: 1,
    },
    drawingCanvas: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
        pointerEvents: 'box-none',
    },
    topbar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingTop: spacing.md,
        paddingBottom: spacing.sm,
        paddingHorizontal: spacing.md,
    },
    topbarContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.md,
    },
    depthTag: {
        position: 'absolute',
        top: 60,
        left: spacing.md,
        zIndex: 15,
        backgroundColor: 'rgba(0,0,0,0.8)',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    depthTagText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    chatContainer: {
        position: 'absolute',
        top: 120, // below topbar and depth tag
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 5,
        pointerEvents: 'box-none',
    },
    gradientMessage: {
        backgroundColor: 'rgba(30, 30, 60, 0.4)',
        borderRadius: 16,
        marginVertical: 4,
        padding: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 10,
        // Simulate blur and gradient
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    controlButton: {
        width: 50,
        height: 50,
        borderRadius: borderRadius.full,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: spacing.xs,
    },
    activeControlButton: {
        backgroundColor: colors.accent,
    },
    saveButton: {
        width: 60,
        height: 60,
        borderRadius: borderRadius.full,
        backgroundColor: colors.success,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
            },
            android: {
                elevation: 5,
            },
        }),
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    permissionText: {
        fontSize: 18,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    permissionButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.lg,
    },
    permissionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
