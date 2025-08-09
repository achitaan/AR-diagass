import React, { useRef, useEffect, useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    Animated
} from 'react-native';
import { Message } from '@/types/thread';
import { colors } from '@/constants/colors';
import { borderRadius, fontSize, spacing } from '@/constants/theme';
import { ChatInput } from './ChatInput';

interface ChatOverlayProps {
    messages: Message[];
    visible: boolean;
    onSendMessage?: (message: string) => void;
    messageStyle?: object;
    micEnabled?: boolean;
    onToggleMic?: () => void;
    isLoading?: boolean;
}

export const ChatOverlay = ({ messages, visible, onSendMessage, messageStyle, micEnabled, onToggleMic, isLoading }: ChatOverlayProps) => {
    const scrollViewRef = useRef<ScrollView>(null);

    // Auto-scroll when loading state changes
    useEffect(() => {
        if (isLoading && scrollViewRef.current) {
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [isLoading]);

    // Typing indicator animation
    const TypingIndicator = () => {
        const [dot1] = useState(new Animated.Value(0));
        const [dot2] = useState(new Animated.Value(0));
        const [dot3] = useState(new Animated.Value(0));

        useEffect(() => {
            const animate = () => {
                const animation = Animated.loop(
                    Animated.sequence([
                        Animated.timing(dot1, { toValue: 1, duration: 400, useNativeDriver: true }),
                        Animated.timing(dot2, { toValue: 1, duration: 400, useNativeDriver: true }),
                        Animated.timing(dot3, { toValue: 1, duration: 400, useNativeDriver: true }),
                        Animated.parallel([
                            Animated.timing(dot1, { toValue: 0, duration: 400, useNativeDriver: true }),
                            Animated.timing(dot2, { toValue: 0, duration: 400, useNativeDriver: true }),
                            Animated.timing(dot3, { toValue: 0, duration: 400, useNativeDriver: true }),
                        ])
                    ])
                );
                animation.start();
                return animation;
            };

            const animation = animate();
            return () => animation.stop();
        }, []);

        return (
            <View style={[
                styles.messageBubble,
                styles.systemMessage,
                styles.typingContainer,
                typeof messageStyle === 'object' ? messageStyle : null
            ]}>
                <View style={styles.typingDots}>
                    <Animated.View style={[styles.dot, { opacity: dot1 }]} />
                    <Animated.View style={[styles.dot, { opacity: dot2 }]} />
                    <Animated.View style={[styles.dot, { opacity: dot3 }]} />
                </View>
                <Text style={[styles.messageText, styles.typingText]}>
                    {messages.length === 0 ? 'AI is analyzing your condition...' : 'AI is thinking...'}
                </Text>
            </View>
        );
    };

    if (!visible) {
        return null;
    }

    return (
        <View
            style={styles.container}
            testID="chat-overlay"
        >
            <ScrollView
                ref={scrollViewRef}
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesContent}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => {
                    if (scrollViewRef.current && (messages.length > 0 || isLoading)) {
                        scrollViewRef.current.scrollToEnd({ animated: true });
                    }
                }}
            >
                {messages.length > 0 ? (
                    <>
                        {messages.map((message) => (
                            <View
                                key={message.id}
                                style={[
                                    styles.messageBubble,
                                    message.isUser ? styles.userMessage : styles.systemMessage,
                                    // Apply custom message style if provided
                                    typeof messageStyle === 'object' ? messageStyle : null
                                ]}
                                testID={`message-${message.id}`}
                            >
                                <Text style={styles.messageText}>{message.content}</Text>
                            </View>
                        ))}
                        {isLoading && <TypingIndicator />}
                    </>
                ) : (
                    // Welcome message when no messages exist
                    <View style={[styles.messageBubble, styles.systemMessage, messageStyle]}>
                        <Text style={styles.messageText}>
                            Hello! I'm here to help you understand your pain and discomfort. Draw areas on the body where you feel pain, and I'll ask relevant questions to better assist you.
                        </Text>
                    </View>
                )}
            </ScrollView>
            {/* Chat Input at the bottom */}
            <ChatInput
                onSendMessage={onSendMessage || (() => { })}
                placeholder="Describe your pain or ask a question..."
                micEnabled={micEnabled}
                onToggleMic={onToggleMic}
                disabled={isLoading}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.05)', // Very subtle overlay
        justifyContent: 'flex-start',
        pointerEvents: 'box-none', // Allow touches to pass through to camera
        flexDirection: 'column',
        zIndex: 1500, // Below top bar (2000) but above other content
    },
    messagesContainer: {
        flex: 1,
        paddingTop: 20, // Reduced padding
        pointerEvents: 'auto', // Enable scrolling within messages
    },
    messagesContent: {
        padding: spacing.md,
        paddingBottom: spacing.xl, // Space for input
        paddingTop: spacing.sm, // Reduced top padding
        minHeight: '100%',
        justifyContent: 'flex-start',
    },
    messageBubble: {
        maxWidth: '80%', // Slightly smaller to leave more camera space
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
    },
    userMessage: {
        alignSelf: 'flex-end',
        backgroundColor: `${colors.primary}B3`, // Semi-transparent primary color (70% opacity)
    },
    systemMessage: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(0, 0, 0, 0.7)', // Semi-transparent black
    },
    messageText: {
        color: '#fff',
        fontSize: fontSize.md,
        fontWeight: '600',
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    placeholderMessage: {
        opacity: 0.6,
    },
    placeholderText: {
        fontStyle: 'italic',
    },
    typingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    typingDots: {
        flexDirection: 'row',
        marginRight: spacing.sm,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#fff',
        marginHorizontal: 2,
    },
    typingText: {
        fontSize: fontSize.sm,
        fontStyle: 'italic',
        opacity: 0.8,
    },
});
