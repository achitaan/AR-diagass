import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Pressable,
    TouchableOpacity,
    Alert,
    Platform,
    SafeAreaView
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
    Check
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Voice from '@react-native-voice/voice';
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
                <TouchableOpacity
                    style={styles.permissionButton}
                    onPress={() => {
                        console.log('📷 Camera permission requested!');
                        requestPermission();
                    }}
                    activeOpacity={0.7}
                >
                    <Text style={styles.permissionButtonText}>Grant Permission</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Camera View */}
            <CameraView
                style={styles.camera}
                facing={cameraType}
                testID="camera-view"
            />

            {/* Drawing Canvas - Separate from CameraView to avoid children warning */}
            <View
                style={styles.drawingCanvas}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            />

            {/* Top Controls */}
            <SafeAreaView style={styles.topControls}>
                <View style={styles.controlsGroup}>
                    <TouchableOpacity
                        style={styles.controlButton}
                        onPress={() => {
                            console.log('🎤 Mic button pressed!');
                            handleToggleMic();
                        }}
                        activeOpacity={0.7}
                        testID="mic-toggle"
                    >
                        {micEnabled ? (
                            <Mic size={24} color="#fff" />
                        ) : (
                            <MicOff size={24} color="#fff" />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.controlButton}
                        onPress={() => {
                            console.log('👁️ Chat toggle pressed!');
                            handleToggleChat();
                        }}
                        activeOpacity={0.7}
                        testID="chat-toggle"
                    >
                        {chatVisible ? (
                            <Eye size={24} color="#fff" />
                        ) : (
                            <EyeOff size={24} color="#fff" />
                        )}
                    </TouchableOpacity>

                    <DepthToggle
                        currentDepth={currentDepth}
                        onDepthChange={handleDepthChange}
                    />
                </View>
            </SafeAreaView>

            {/* Left Side Controls */}
            <View style={styles.leftControls}>
                <TouchableOpacity
                    style={[
                        styles.controlButton,
                        radiatingMode && styles.activeControlButton
                    ]}
                    onPress={() => {
                        console.log('🔄 Radiating mode pressed!');
                        handleToggleRadiatingMode();
                    }}
                    activeOpacity={0.7}
                    testID="radiating-toggle"
                >
                    <ArrowUpDown size={24} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.controlButton}
                    onPress={() => {
                        console.log('↶ Undo pressed!');
                        handleUndo();
                    }}
                    activeOpacity={0.7}
                    testID="undo-button"
                >
                    <RotateCcw size={24} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.controlButton}
                    onPress={() => {
                        console.log('↷ Redo pressed!');
                        handleRedo();
                    }}
                    activeOpacity={0.7}
                    testID="redo-button"
                >
                    <RotateCw size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Save Button */}
            <SafeAreaView style={styles.bottomControls}>
                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={() => {
                        console.log('💾 Save button pressed!');
                        handleSave();
                    }}
                    activeOpacity={0.7}
                    testID="save-button"
                >
                    <Check size={24} color="#fff" />
                </TouchableOpacity>
            </SafeAreaView>

            {/* Chat Overlay */}
            {currentThread && (
                <ChatOverlay
                    messages={currentThread.messages}
                    visible={chatVisible}
                    onSendMessage={(message) => addMessage(message, true)}
                />
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
    topControls: {
        position: 'absolute',
        top: 0,
        right: 0,
        padding: spacing.md,
        zIndex: 1000,
        elevation: 1000,
    },
    controlsGroup: {
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: borderRadius.lg,
        padding: spacing.sm,
        zIndex: 1001,
        elevation: 1001,
    },
    leftControls: {
        position: 'absolute',
        left: spacing.md,
        top: '50%',
        transform: [{ translateY: -80 }],
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: borderRadius.lg,
        padding: spacing.sm,
        zIndex: 1000,
        elevation: 1000,
    },
    bottomControls: {
        position: 'absolute',
        bottom: spacing.xl,
        right: spacing.xl,
        zIndex: 1000,
        elevation: 1000,
    },
    controlButton: {
        width: 50,
        height: 50,
        borderRadius: borderRadius.full,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: spacing.xs,
        zIndex: 1002,
        elevation: 1002,
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
