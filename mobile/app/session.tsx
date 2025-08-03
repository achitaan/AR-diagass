import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Pressable,
    SafeAreaView,
    PanResponder,
    Dimensions
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
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useThreads } from '@/hooks/use-threads-store';
import { ChatOverlay } from '@/components/ChatOverlay';
import { DepthToggle } from '@/components/DepthToggle';
import { PoseOverlay } from '@/components/PoseOverlay';
import { BodyPartMask } from '@/components/BodyPartMask';
import { useRealPoseDetection, TensorCamera } from '@/hooks/useRealPoseDetection';
import { colors } from '@/constants/colors';
import { borderRadius, spacing, fontSize } from '@/constants/theme';

type DepthLevel = 'skin' | 'muscle' | 'deep';
type VisualizationMode = 'none' | 'muscles' | 'bodyParts';

export default function SessionScreen() {
    const router = useRouter();
    const [permission, requestPermission] = useCameraPermissions();
    const [cameraType] = useState<CameraType>('back');
    const [micEnabled, setMicEnabled] = useState(false);
    const [chatVisible, setChatVisible] = useState(true);
    const [currentDepth, setCurrentDepth] = useState<DepthLevel>('skin');
    const [drawingPoints, setDrawingPoints] = useState<{ x: number, y: number }[]>([]);
    const [isLoadingMessage, setIsLoadingMessage] = useState(false);
    const [visualizationMode, setVisualizationMode] = useState<VisualizationMode>('none');
    const [showLabels, setShowLabels] = useState(true);
    const [useRealTracking, setUseRealTracking] = useState(true);

    const { getCurrentThread, addMessage, addDrawingStroke } = useThreads();
    const currentThread = getCurrentThread();

    // Real TensorFlow pose detection
    const {
        poses, 
        isModelReady, 
        tfReady, 
        isTracking, 
        handleCameraStream, 
        startTracking, 
        stopTracking,
        generateDemoPose
    } = useRealPoseDetection();

    const depthLevels: DepthLevel[] = ['skin', 'muscle', 'deep'];

    const getNextDepth = () => {
        const currentIndex = depthLevels.indexOf(currentDepth);
        return depthLevels[(currentIndex + 1) % depthLevels.length];
    };

    const getPrevDepth = () => {
        const currentIndex = depthLevels.indexOf(currentDepth);
        return depthLevels[(currentIndex - 1 + depthLevels.length) % depthLevels.length];
    };

    const handleSendMessage = async (message: string) => {
        setIsLoadingMessage(true);
        try {
            await addMessage(message, true);
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setIsLoadingMessage(false);
        }
    };

    // Handle pose tracking state
    useEffect(() => {
        if (isModelReady && useRealTracking) {
            startTracking();
        } else if (isModelReady && !useRealTracking) {
            stopTracking();
        }
        
        return () => {
            if (isTracking) {
                stopTracking();
            }
        };
    }, [isModelReady, useRealTracking]);

    // Control handlers
    const handleMicToggle = () => {
        setMicEnabled(!micEnabled);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleVisualizationCycle = () => {
        const modes: VisualizationMode[] = ['none', 'muscles', 'bodyParts'];
        const currentIndex = modes.indexOf(visualizationMode);
        const nextMode = modes[(currentIndex + 1) % modes.length];
        setVisualizationMode(nextMode);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    const handleTrackingToggle = () => {
        setUseRealTracking(!useRealTracking);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    const handleDepthUp = () => {
        setCurrentDepth(getNextDepth());
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleDepthDown = () => {
        setCurrentDepth(getPrevDepth());
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    // Drawing functionality
    const handleDrawingTouch = (x: number, y: number) => {
        const newPoint = { x, y };
        setDrawingPoints(prev => [...prev, newPoint]);
        addDrawingStroke([newPoint], currentDepth);
    };

    const panResponder = PanResponder.create({
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
            const { locationX, locationY } = evt.nativeEvent;
            handleDrawingTouch(locationX, locationY);
        },
        onPanResponderMove: (evt) => {
            const { locationX, locationY } = evt.nativeEvent;
            handleDrawingTouch(locationX, locationY);
        },
        onPanResponderRelease: () => {},
    });

    if (!permission) {
        return (
            <View style={styles.container}>
                <Text style={styles.permissionText}>Loading camera permissions...</Text>
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.permissionText}>
                    We need camera permission to use the AR features.
                </Text>
                <Pressable style={styles.permissionButton} onPress={requestPermission}>
                    <Text style={styles.permissionButtonText}>Grant Permission</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Camera */}
            {permission?.granted && tfReady && useRealTracking ? (
                <TensorCamera
                    style={styles.camera}
                    type={'back'}
                    cameraTextureHeight={1920}
                    cameraTextureWidth={1080}
                    resizeHeight={480}
                    resizeWidth={640}
                    resizeDepth={3}
                    autorender={true}
                    useCustomShadersToResize={false}
                    onReady={handleCameraStream}
                    testID="tensor-camera-view"
                />
            ) : (
                <CameraView
                    style={styles.camera}
                    facing={cameraType}
                    testID="camera-view"
                />
            )}

            {/* Overlays */}
            {visualizationMode === 'muscles' && (
                <PoseOverlay
                    poses={useRealTracking ? poses : [generateDemoPose()]}
                    useRealTracking={useRealTracking}
                    mode="muscles"
                    style={styles.poseOverlay}
                />
            )}

            {visualizationMode === 'bodyParts' && (
                <BodyPartMask
                    poses={useRealTracking ? poses : [generateDemoPose()]}
                    mode={currentDepth}
                    showLabels={showLabels}
                    style={styles.bodyMask}
                />
            )}

            {/* Drawing Canvas */}
            <View style={styles.drawingCanvas} {...panResponder.panHandlers} pointerEvents="box-none">
                {drawingPoints.map((point, index) => (
                    <View
                        key={index}
                        style={[
                            styles.drawingPoint,
                            {
                                left: point.x - 2,
                                top: point.y - 2,
                                backgroundColor: currentDepth === 'skin' ? colors.accent :
                                               currentDepth === 'muscle' ? colors.secondary :
                                               colors.primary
                            }
                        ]}
                    />
                ))}
            </View>

            {/* Status Indicators */}
            {visualizationMode !== 'none' && (
                <View style={styles.visualizationTag}>
                    <Text style={styles.visualizationTagText}>
                        {visualizationMode === 'muscles' ? 'MUSCLE VIEW' : 'BODY PARTS'}
                    </Text>
                </View>
            )}

            {useRealTracking && (
                <View style={styles.statusIndicator}>
                    <Text style={styles.statusText}>
                        {!tfReady ? '🔄 Loading TensorFlow...' :
                         !isModelReady ? '🔄 Loading Pose Model...' :
                         !isTracking ? '⏸️ Pose Detection Ready' :
                         poses && poses.length > 0 ? '✅ Human Detected' : '🔍 Searching for Human...'}
                    </Text>
                </View>
            )}

            {/* Top Controls */}
            <SafeAreaView style={styles.topbar}>
                <View style={styles.topbarContent}>
                    <Pressable style={styles.controlButton} onPress={() => router.back()}>
                        <ArrowUpDown size={20} color={colors.text} />
                        <Text style={styles.controlButtonText}>Back</Text>
                    </Pressable>

                    <View style={styles.centerControls}>
                        <Pressable
                            style={[styles.mainButton, visualizationMode !== 'none' && styles.mainButtonActive]}
                            onPress={handleVisualizationCycle}
                        >
                            <Eye size={24} color={visualizationMode !== 'none' ? colors.background : colors.text} />
                            <Text style={[styles.mainButtonText, visualizationMode !== 'none' && styles.mainButtonTextActive]}>
                                {visualizationMode === 'none' ? 'V' : 
                                 visualizationMode === 'muscles' ? 'M' : 'B'}
                            </Text>
                        </Pressable>

                        <Pressable
                            style={[styles.mainButton, useRealTracking && styles.mainButtonActive]}
                            onPress={handleTrackingToggle}
                        >
                            <RotateCcw size={24} color={useRealTracking ? colors.background : colors.text} />
                            <Text style={[styles.mainButtonText, useRealTracking && styles.mainButtonTextActive]}>
                                {useRealTracking ? 'R' : 'D'}
                            </Text>
                        </Pressable>
                    </View>

                    <Pressable
                        style={[styles.controlButton, micEnabled && styles.controlButtonActive]}
                        onPress={handleMicToggle}
                    >
                        {micEnabled ? (
                            <Mic size={20} color={colors.background} />
                        ) : (
                            <MicOff size={20} color={colors.text} />
                        )}
                        <Text style={[styles.controlButtonText, micEnabled && styles.controlButtonTextActive]}>
                            Mic
                        </Text>
                    </Pressable>
                </View>
            </SafeAreaView>

            {/* Bottom Controls */}
            <SafeAreaView style={styles.bottombar}>
                <View style={styles.bottombarContent}>
                    <View style={styles.depthControls}>
                        <Pressable style={styles.depthButton} onPress={handleDepthDown}>
                            <RotateCcw size={16} color={colors.text} />
                        </Pressable>
                        
                        <DepthToggle 
                            currentDepth={currentDepth}
                            onDepthChange={setCurrentDepth}
                        />
                        
                        <Pressable style={styles.depthButton} onPress={handleDepthUp}>
                            <RotateCw size={16} color={colors.text} />
                        </Pressable>
                    </View>

                    <Pressable
                        style={[styles.chatToggleButton, chatVisible && styles.chatToggleActive]}
                        onPress={() => setChatVisible(!chatVisible)}
                    >
                        <Text style={[styles.chatToggleText, chatVisible && styles.chatToggleTextActive]}>
                            Chat
                        </Text>
                        {chatVisible ? (
                            <EyeOff size={16} color={colors.background} />
                        ) : (
                            <Eye size={16} color={colors.text} />
                        )}
                    </Pressable>
                </View>
            </SafeAreaView>

            {/* Chat */}
            {chatVisible && (
                <ChatOverlay
                    messages={currentThread?.messages || []}
                    visible={chatVisible}
                    onSendMessage={handleSendMessage}
                    isLoading={isLoadingMessage}
                />
            )}
        </View>
    );
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    camera: {
        flex: 1,
    },
    permissionText: {
        textAlign: 'center',
        marginVertical: 20,
        fontSize: fontSize.md,
        color: colors.text,
    },
    permissionButton: {
        backgroundColor: colors.primary,
        padding: spacing.md,
        margin: spacing.lg,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    permissionButtonText: {
        color: 'white',
        fontSize: fontSize.md,
        fontWeight: '600',
    },
    poseOverlay: {
        pointerEvents: 'none',
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    bodyMask: {
        pointerEvents: 'none',
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    drawingCanvas: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        zIndex: 1,
    },
    drawingPoint: {
        position: 'absolute',
        width: 4,
        height: 4,
        borderRadius: 2,
    },
    visualizationTag: {
        position: 'absolute',
        top: 60,
        right: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    visualizationTagText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    statusIndicator: {
        position: 'absolute',
        bottom: 140,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        alignItems: 'center',
    },
    statusText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
    },
    topbar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    topbarContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    centerControls: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    controlButton: {
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.sm,
        alignItems: 'center',
        minWidth: 60,
    },
    controlButtonActive: {
        backgroundColor: colors.primary,
    },
    controlButtonText: {
        color: colors.text,
        fontSize: fontSize.xs,
        marginTop: 2,
    },
    controlButtonTextActive: {
        color: colors.background,
    },
    mainButton: {
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mainButtonActive: {
        backgroundColor: colors.primary,
    },
    mainButtonText: {
        color: colors.text,
        fontSize: fontSize.xs,
        fontWeight: 'bold',
        position: 'absolute',
        bottom: 4,
    },
    mainButtonTextActive: {
        color: colors.background,
    },
    bottombar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    bottombarContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
    },
    depthControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
    },
    depthButton: {
        padding: spacing.sm,
    },
    chatToggleButton: {
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    chatToggleActive: {
        backgroundColor: colors.secondary,
    },
    chatToggleText: {
        color: colors.text,
        fontSize: fontSize.md,
    },
    chatToggleTextActive: {
        color: colors.background,
    },
});
