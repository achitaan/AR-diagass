import React, { useRef, useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    Pressable,
    Animated,
    PanResponder,
    Dimensions
} from 'react-native';
import { Message } from '@/types/thread';
import { colors } from '@/constants/colors';
import { borderRadius, fontSize, spacing } from '@/constants/theme';
import { GripHorizontal } from 'lucide-react-native';

interface ChatOverlayProps {
    messages: Message[];
    visible: boolean;
    onSendMessage?: (message: string) => void;
}

export const ChatOverlay = ({ messages, visible, onSendMessage }: ChatOverlayProps) => {
    const [expanded, setExpanded] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);
    const panY = useRef(new Animated.Value(0)).current;
    const { height: screenHeight } = Dimensions.get('window');

    const collapsedHeight = 120;
    const expandedHeight = screenHeight * 0.7;

    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gestureState) => {
            panY.setValue(gestureState.dy);
        },
        onPanResponderRelease: (_, gestureState) => {
            if (gestureState.dy < -50 && !expanded) {
                // Swipe up - expand
                Animated.spring(panY, {
                    toValue: 0,
                    useNativeDriver: false,
                }).start();
                setExpanded(true);
            } else if (gestureState.dy > 50 && expanded) {
                // Swipe down - collapse
                Animated.spring(panY, {
                    toValue: 0,
                    useNativeDriver: false,
                }).start();
                setExpanded(false);
            } else {
                // Return to original position
                Animated.spring(panY, {
                    toValue: 0,
                    useNativeDriver: false,
                }).start();
            }
        },
    });

    // Calculate height based on expanded state
    const animatedHeight = panY.interpolate({
        inputRange: [-200, 200],
        outputRange: [
            expanded ? expandedHeight + 100 : expandedHeight,
            expanded ? collapsedHeight : collapsedHeight - 50,
        ],
        extrapolate: 'clamp',
    });

    if (!visible) {
        return (
            <Pressable
                style={styles.peekBar}
                onPress={() => setExpanded(true)}
                testID="chat-peek-bar"
            >
                <Text style={styles.peekText}>Chat Messages</Text>
            </Pressable>
        );
    }

    return (
        <Animated.View
            style={[
                styles.container,
                { height: animatedHeight }
            ]}
            testID="chat-overlay"
        >
            <Pressable
                style={styles.handleContainer}
                {...panResponder.panHandlers}
                testID="chat-handle"
            >
                <GripHorizontal size={20} color={colors.textSecondary} />
            </Pressable>

            <ScrollView
                ref={scrollViewRef}
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesContent}
                onContentSizeChange={() => {
                    if (scrollViewRef.current && messages.length > 0) {
                        scrollViewRef.current.scrollToEnd({ animated: true });
                    }
                }}
            >
                {messages.length > 0 ? (
                    messages.map((message) => (
                        <View
                            key={message.id}
                            style={[
                                styles.messageBubble,
                                message.isUser ? styles.userMessage : styles.systemMessage
                            ]}
                            testID={`message-${message.id}`}
                        >
                            <Text style={styles.messageText}>{message.content}</Text>
                        </View>
                    ))
                ) : (
                    // Placeholder messages when no real messages exist
                    <>
                        <View style={[styles.messageBubble, styles.systemMessage, styles.placeholderMessage]}>
                            <Text style={[styles.messageText, styles.placeholderText]}>
                                I can see you&apos;re pointing to your shoulder area. Can you describe the type of pain you&apos;re experiencing?
                            </Text>
                        </View>

                        <View style={[styles.messageBubble, styles.userMessage, styles.placeholderMessage]}>
                            <Text style={[styles.messageText, styles.placeholderText]}>
                                It&apos;s a sharp pain that gets worse when I lift my arm
                            </Text>
                        </View>

                        <View style={[styles.messageBubble, styles.systemMessage, styles.placeholderMessage]}>
                            <Text style={[styles.messageText, styles.placeholderText]}>
                                That sounds like it could be related to your rotator cuff. How long have you been experiencing this pain?
                            </Text>
                        </View>

                        <View style={[styles.messageBubble, styles.userMessage, styles.placeholderMessage]}>
                            <Text style={[styles.messageText, styles.placeholderText]}>
                                About two weeks now, started after I went to the gym
                            </Text>
                        </View>

                        <View style={[styles.messageBubble, styles.systemMessage, styles.placeholderMessage]}>
                            <Text style={[styles.messageText, styles.placeholderText]}>
                                I see. Try marking the exact areas where you feel the pain on the camera view. This will help me better understand your condition.
                            </Text>
                        </View>

                        <View style={[styles.messageBubble, styles.userMessage, styles.placeholderMessage]}>
                            <Text style={[styles.messageText, styles.placeholderText]}>
                                Okay, I&apos;ll trace the painful areas now
                            </Text>
                        </View>
                    </>
                )}
            </ScrollView>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        overflow: 'hidden',
    },
    handleContainer: {
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: colors.divider,
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: spacing.md,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
    },
    userMessage: {
        alignSelf: 'flex-end',
        backgroundColor: colors.primary,
    },
    systemMessage: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    messageText: {
        color: '#fff',
        fontSize: fontSize.md,
    },
    peekBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 40,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        borderTopLeftRadius: borderRadius.md,
        borderTopRightRadius: borderRadius.md,
    },
    peekText: {
        color: '#fff',
        fontSize: fontSize.sm,
    },
    placeholderMessage: {
        opacity: 0.7,
    },
    placeholderText: {
        fontStyle: 'italic',
    },
});
