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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import {
    Mic,
    MicOff,
    Eye,
    EyeOff,
    ArrowLeft,
    Camera,
    CameraOff,
    RotateCcw,
    RotateCw,
    CheckCircle,
    Circle,
    Edit3,
    Undo,
    Redo,
    Home,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useThreads } from '@/hooks/use-threads-store';
import { ChatOverlay } from '@/components/ChatOverlay';
import { DepthToggle } from '@/components/DepthToggle';
import { PoseOverlay } from '@/components/PoseOverlay';
import { BodyPartMask } from '@/components/BodyPartMask';
import { Skeleton3D } from '@/components/Skeleton3D';
import { DrawingOverlay } from '@/components/DrawingOverlay';
import { useRealPoseDetection, TensorCamera } from '@/hooks/useRealPoseDetection';
import { useBodySegmentation } from '@/hooks/useBodySegmentation';
import { colors } from '@/constants/colors';
import { borderRadius, spacing, fontSize } from '@/constants/theme';

interface DrawingPoint {
    x: number;
    y: number;
    bodyPart?: string;
    painLevel?: number;
}

interface DrawingPath {
    id: string;
    points: DrawingPoint[];
    bodyPart?: string;
    painLevel?: number;
    isClosedLoop?: boolean;
}

type DepthLevel = 'skin' | 'muscle' | 'deep';
type VisualizationMode = 'none' | 'muscles' | 'bodyParts';

export default function SessionScreen() {
    const router = useRouter();
    const [permission, requestPermission] = useCameraPermissions();
    const [cameraType] = useState<CameraType>('back');
    const [micEnabled, setMicEnabled] = useState(false);
    const [chatVisible, setChatVisible] = useState(true);
    const [currentDepth, setCurrentDepth] = useState<DepthLevel>('skin');
    const [drawingPaths, setDrawingPaths] = useState<DrawingPath[]>([]);
    const [drawingHistory, setDrawingHistory] = useState<DrawingPath[][]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [isLoadingMessage, setIsLoadingMessage] = useState(false);
    const [visualizationMode, setVisualizationMode] = useState<VisualizationMode>('none');
    const [showLabels, setShowLabels] = useState(true);
    const [cameraEnabled, setCameraEnabled] = useState(false);
    const [selectedBodyPart, setSelectedBodyPart] = useState<string | null>(null);
    const [showNodes, setShowNodes] = useState(false);
    const [isDrawingMode, setIsDrawingMode] = useState(false);
    const [painAreas, setPainAreas] = useState<Map<string, number>>(new Map()); // Track pain levels for body parts
    const [skeletonNodes, setSkeletonNodes] = useState<DrawingPoint[]>([]); // Track skeleton node positions

    const { getCurrentThread, addMessage, addDrawingStroke } = useThreads();
    const currentThread = getCurrentThread();

    // Persistence functions for pain areas
    const savePainAreas = async (areas: Map<string, number>) => {
        try {
            const painData = JSON.stringify(Array.from(areas.entries()));
            await AsyncStorage.setItem('painAreas', painData);
        } catch (error) {
            console.error('Failed to save pain areas:', error);
        }
    };

    const loadPainAreas = async () => {
        try {
            const painData = await AsyncStorage.getItem('painAreas');
            if (painData) {
                const areas = new Map<string, number>(JSON.parse(painData));
                setPainAreas(areas);
            }
        } catch (error) {
            console.error('Failed to load pain areas:', error);
        }
    };

    // Load pain areas on component mount
    useEffect(() => {
        loadPainAreas();
    }, []);

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

    // Body segmentation for real camera mode
    const {
        isModelReady: segmentationModelReady,
        segmentation,
        handleCameraStream: handleSegmentationStream
    } = useBodySegmentation();

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
            // Convert pain areas to the format expected by the backend
            const painAreasData = Array.from(painAreas.entries()).map(([bodyPart, painLevel]) => {
                // Find the corresponding skeleton node to get coordinates
                const node = skeletonNodes.find(n => n.bodyPart === bodyPart);
                return {
                    body_part: bodyPart,
                    pain_level: painLevel,
                    x: node?.x || 0,
                    y: node?.y || 0
                };
            });

            // Convert drawing data to the format expected by the backend
            const drawingData = drawingPaths.map(path => ({
                path_points: path.points.map(p => ({ x: p.x, y: p.y })),
                pain_level: path.painLevel || 0,
                body_parts_affected: path.bodyPart ? [path.bodyPart] : []
            }));

            await addMessage(message, true, painAreasData, drawingData);
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setIsLoadingMessage(false);
        }
    };

    // Handle pose tracking state
    useEffect(() => {
        if (isModelReady && cameraEnabled) {
            startTracking();
        } else if (isModelReady && !cameraEnabled) {
            stopTracking();
        }
        
        return () => {
            if (isTracking) {
                stopTracking();
            }
        };
    }, [isModelReady, cameraEnabled]);

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

    const handleCameraToggle = () => {
        setCameraEnabled(!cameraEnabled);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    const handleCheckAction = () => {
        // Save progress
        // TODO: Save pain assessment data to backend
        console.log('Saving pain assessment...', Array.from(painAreas.entries()));
        
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        
        // Navigate to home
        router.replace('/');
    };

    const handleDepthUp = () => {
        setCurrentDepth(getNextDepth());
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleDepthDown = () => {
        setCurrentDepth(getPrevDepth());
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    // Handle body part selection for walking animation
    const handleBodyPartSelect = (partName: string) => {
        setSelectedBodyPart(partName);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    // Drawing functionality
    const handleDrawingComplete = (path: DrawingPath) => {
        // Only add to drawing paths if it has a pain level assigned
        if (path.painLevel !== undefined) {
            const newPaths = [...drawingPaths, path];
            setDrawingPaths(newPaths);
            
            // Update history for undo/redo
            const newHistory = drawingHistory.slice(0, historyIndex + 1);
            newHistory.push(newPaths);
            setDrawingHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
            
            addDrawingStroke(path.points, currentDepth);
        }
    };

    // Handle pain level assignment from drawing overlay
    const handlePainLevelAssigned = (painLevel: number, enclosedArea: DrawingPoint[]) => {
        // Find skeleton nodes that are inside the enclosed area
        const affectedNodes = findNodesInEnclosedArea(enclosedArea, skeletonNodes);
        
        // Update pain levels for affected nodes
        const newPainAreas = new Map(painAreas);
        affectedNodes.forEach(node => {
            if (node.bodyPart) {
                newPainAreas.set(node.bodyPart, painLevel);
            }
        });
        setPainAreas(newPainAreas);
        
        // Save to persistent storage
        savePainAreas(newPainAreas);
    };

    // Point-in-polygon algorithm to check if nodes are inside the drawn area
    const findNodesInEnclosedArea = (enclosedArea: DrawingPoint[], nodes: DrawingPoint[]): DrawingPoint[] => {
        // Debug logging
        console.log('🎯 Finding nodes in enclosed area...');
        console.log('📐 Screen dimensions:', { width: SCREEN_WIDTH, height: SCREEN_HEIGHT });
        console.log('🔸 Drawing polygon points:', enclosedArea.slice(0, 3)); // First 3 points
        console.log('🎭 Available skeleton nodes:', nodes.slice(0, 3)); // First 3 nodes
        
        const matchedNodes = nodes.filter(node => {
            // The skeleton is positioned in a container that's centered and has height SCREEN_HEIGHT * 0.8
            // The drawing overlay covers the full screen
            // We need to account for this difference in coordinate systems
            
            // Calculate the offset of the skeleton container
            // The walkingAnimationBackground is centered vertically
            const containerHeight = SCREEN_HEIGHT * 0.8;
            const containerTopOffset = (SCREEN_HEIGHT - containerHeight) / 2;
            
            console.log(`🔍 Checking node ${node.bodyPart} at (${node.x?.toFixed(0)}, ${node.y?.toFixed(0)})`);
            console.log(`📏 Container offset: ${containerTopOffset.toFixed(0)}px`);
            
            // Transform drawing coordinates to skeleton coordinate system
            const transformedPolygon = enclosedArea.map(point => ({
                x: point.x,
                y: point.y - containerTopOffset, // Adjust for container vertical offset
                bodyPart: point.bodyPart,
                painLevel: point.painLevel
            }));
            
            // Transform skeleton node to match the drawing coordinate system for comparison
            const adjustedNode = {
                x: node.x,
                y: node.y, // Keep skeleton Y as is since we adjusted the polygon instead
                bodyPart: node.bodyPart,
                painLevel: node.painLevel
            };
            
            const isInside = isPointInPolygon(adjustedNode, transformedPolygon);
            console.log(`✅ Node ${node.bodyPart} ${isInside ? 'IS' : 'NOT'} inside polygon`);
            
            return isInside;
        });
        
        console.log(`🎯 Found ${matchedNodes.length} nodes in enclosed area:`, matchedNodes.map(n => n.bodyPart));
        return matchedNodes;
    };

    const isPointInPolygon = (point: DrawingPoint, polygon: DrawingPoint[]): boolean => {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            if (((polygon[i].y > point.y) !== (polygon[j].y > point.y)) &&
                (point.x < (polygon[j].x - polygon[i].x) * (point.y - polygon[i].y) / (polygon[j].y - polygon[i].y) + polygon[i].x)) {
                inside = !inside;
            }
        }
        return inside;
    };

    const handlePainLevelSelect = (bodyPart: string, painLevel: number) => {
        // Update the last drawing path with pain level
        setDrawingPaths(prev => {
            const updated = [...prev];
            const lastPath = updated[updated.length - 1];
            if (lastPath) {
                lastPath.bodyPart = bodyPart;
                lastPath.painLevel = painLevel;
            }
            return updated;
        });
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            setDrawingPaths(drawingHistory[historyIndex - 1] || []);
        }
    };

    const handleRedo = () => {
        if (historyIndex < drawingHistory.length - 1) {
            setHistoryIndex(historyIndex + 1);
            setDrawingPaths(drawingHistory[historyIndex + 1]);
        }
    };

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

            {/* Camera or Walking Animation */}
            {cameraEnabled ? (
                permission?.granted ? (
                    <>
                        {/* Always show camera feed */}
                        <CameraView
                            style={styles.camera}
                            facing={cameraType}
                            mode="video"
                            testID="camera-view"
                        />
                        {/* TensorFlow processing overlay if ready */}
                        {tfReady && (
                            <TensorCamera
                                style={styles.tensorCameraOverlay}
                                facing={cameraType}
                                cameraTextureHeight={1920}
                                cameraTextureWidth={1080}
                                resizeHeight={480}
                                resizeWidth={640}
                                resizeDepth={3}
                                autorender={false}
                                useCustomShadersToResize={false}
                                onReady={(images, updatePreview, gl) => {
                                    // Handle both pose detection and segmentation
                                    handleCameraStream(images, updatePreview, gl);
                                    handleSegmentationStream(images);
                                }}
                                testID="tensor-camera-view"
                            />
                        )}
                    </>
                ) : (
                    <View style={styles.camera}>
                        <Text style={styles.permissionText}>Camera permission required</Text>
                    </View>
                )
            ) : (
                <View style={styles.walkingAnimationContainer}>
                    <View style={styles.walkingAnimationBackground}>
                        <Skeleton3D 
                            onBodyPartPress={handleBodyPartSelect}
                            selectedPart={selectedBodyPart}
                            showNodes={showNodes}
                            isDrawingMode={isDrawingMode}
                            drawingPoints={drawingPaths.flatMap(path => path.points)}
                            onPainLevelSelect={handlePainLevelSelect}
                            painAreas={painAreas}
                            onNodesUpdate={setSkeletonNodes}
                        />
                    </View>
                </View>
            )}

            {/* Drawing Overlay for both camera and skeleton modes */}
            <DrawingOverlay
                isDrawingMode={isDrawingMode}
                onDrawingComplete={handleDrawingComplete}
                onPainLevelAssigned={handlePainLevelAssigned}
                drawings={drawingPaths}
            />

            {/* Overlays for camera mode */}
            {cameraEnabled && visualizationMode === 'muscles' && (
                <PoseOverlay
                    poses={poses}
                    useRealTracking={true}
                    mode="muscles"
                    style={styles.poseOverlay}
                />
            )}

            {cameraEnabled && visualizationMode === 'bodyParts' && (
                <BodyPartMask
                    poses={poses}
                    mode={currentDepth}
                    showLabels={showLabels}
                    style={styles.bodyMask}
                />
            )}

            {/* Drawing Canvas - REMOVED - replaced with DrawingOverlay */}

            {/* Status Indicators */}
            {visualizationMode !== 'none' && (
                <View style={styles.visualizationTag}>
                    <Text style={styles.visualizationTagText}>
                        {visualizationMode === 'muscles' ? 'MUSCLE VIEW' : 'BODY PARTS'}
                    </Text>
                </View>
            )}

            {cameraEnabled && (
                <View style={styles.statusIndicator}>
                    <Text style={styles.statusText}>
                        {!tfReady ? '🔄 Loading TensorFlow...' :
                         !isModelReady ? '🔄 Loading Pose Model...' :
                         !isTracking ? '⏸️ Pose Detection Ready' :
                         poses && poses.length > 0 ? '✅ Human Detected' : '🔍 Searching for Human...'}
                    </Text>
                </View>
            )}

            {selectedBodyPart && (
                <View style={styles.bodyPartIndicator}>
                    <Text style={styles.bodyPartText}>Selected: {selectedBodyPart}</Text>
                </View>
            )}

            {/* Enhanced Top Bar */}
            <View style={styles.topBarBackground} />
            <SafeAreaView style={styles.topbar}>
                <View style={styles.topbarContent}>
                    <Pressable 
                        style={[styles.backButton, chatVisible && styles.backButtonActive]} 
                        onPress={() => setChatVisible(!chatVisible)}
                    >
                        {chatVisible ? (
                            <EyeOff size={20} color={chatVisible ? colors.background : colors.text} />
                        ) : (
                            <Eye size={20} color={colors.text} />
                        )}
                        <Text style={[styles.backButtonText, chatVisible && styles.backButtonTextActive]}>
                            {chatVisible ? 'Hide Chat' : 'Show Chat'}
                        </Text>
                    </Pressable>

                    <View style={styles.centerControls}>
                        <Pressable
                            style={[styles.controlIcon, showNodes && styles.controlIconActive]}
                            onPress={() => setShowNodes(!showNodes)}
                        >
                            <Circle size={22} color={showNodes ? colors.background : colors.text} />
                        </Pressable>

                        <Pressable
                            style={[styles.controlIcon, isDrawingMode && styles.controlIconActive]}
                            onPress={() => setIsDrawingMode(!isDrawingMode)}
                        >
                            <Edit3 size={22} color={isDrawingMode ? colors.background : colors.text} />
                        </Pressable>

                        <Pressable
                            style={[styles.controlIcon, cameraEnabled && styles.controlIconActive]}
                            onPress={handleCameraToggle}
                        >
                            {cameraEnabled ? (
                                <Camera size={22} color={colors.background} />
                            ) : (
                                <CameraOff size={22} color={colors.text} />
                            )}
                        </Pressable>

                        <Pressable
                            style={styles.checkButton}
                            onPress={handleCheckAction}
                        >
                            <CheckCircle size={22} color={colors.primary} />
                        </Pressable>
                    </View>

                    <View style={styles.rightControls}>
                        <Pressable
                            style={[styles.controlIcon, historyIndex <= 0 && styles.controlIconDisabled]}
                            onPress={handleUndo}
                            disabled={historyIndex <= 0}
                        >
                            <Undo size={20} color={historyIndex <= 0 ? colors.textSecondary : colors.text} />
                        </Pressable>

                        <Pressable
                            style={[styles.controlIcon, historyIndex >= drawingHistory.length - 1 && styles.controlIconDisabled]}
                            onPress={handleRedo}
                            disabled={historyIndex >= drawingHistory.length - 1}
                        >
                            <Redo size={20} color={historyIndex >= drawingHistory.length - 1 ? colors.textSecondary : colors.text} />
                        </Pressable>
                    </View>
                </View>
            </SafeAreaView>

            {/* Bottom Controls */}
            <SafeAreaView style={styles.bottombar}>
                <View style={styles.bottombarContent}>
                    {/* Removed depth controls - keeping bottom bar for future controls */}
                </View>
            </SafeAreaView>

            {/* Chat with topmost z-index */}
            {chatVisible && (
                <ChatOverlay
                    messages={currentThread?.messages || []}
                    visible={chatVisible}
                    onSendMessage={handleSendMessage}
                    isLoading={isLoadingMessage}
                    micEnabled={micEnabled}
                    onToggleMic={handleMicToggle}
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
    tensorCameraOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0, // Hidden but processing
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
        zIndex: 2000, // Highest z-index to ensure buttons are always accessible
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
    // New styles for enhanced UI
    walkingAnimationContainer: {
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    walkingAnimationBackground: {
        width: SCREEN_WIDTH * 0.95,
        height: SCREEN_HEIGHT * 0.8,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
        // Gradient-like border effect
        borderWidth: 2,
        borderColor: colors.gradientStart,
    },
    bodyPartIndicator: {
        position: 'absolute',
        top: 120,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        alignItems: 'center',
    },
    bodyPartText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    topBarBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 100,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        zIndex: 1999, // Just below the topbar but above chat
    },
    backButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    backButtonText: {
        color: colors.background,
        fontSize: fontSize.md,
        fontWeight: '600',
    },
    backButtonActive: {
        backgroundColor: colors.primary,
    },
    backButtonTextActive: {
        color: colors.background,
    },
    controlIcon: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    controlIconActive: {
        backgroundColor: colors.primary,
    },
    controlIconDisabled: {
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        opacity: 0.5,
    },
    checkButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    rightControls: {
        width: 80, // Balance the layout
    },
});
