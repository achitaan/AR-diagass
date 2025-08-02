import React, { useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView
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
}

export const ChatOverlay = ({ messages, visible, onSendMessage, messageStyle, micEnabled, onToggleMic }: ChatOverlayProps) => {
    const scrollViewRef = useRef<ScrollView>(null);

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
                                message.isUser ? styles.userMessage : styles.systemMessage,
                                // Apply custom message style if provided
                                typeof messageStyle === 'object' ? messageStyle : null
                            ]}
                            testID={`message-${message.id}`}
                        >
                            <Text style={styles.messageText}>{message.content}</Text>
                        </View>
                    ))
                ) : (
                    // Placeholder messages when no real messages exist
                    <>
                        <View style={[styles.messageBubble, styles.systemMessage, styles.placeholderMessage, messageStyle]}>
                            <Text style={[styles.messageText, styles.placeholderText]}>
                                I can see you&apos;re pointing to your shoulder area. Can you describe the type of pain you&apos;re experiencing?
                            </Text>
                        </View>

                        <View style={[styles.messageBubble, styles.userMessage, styles.placeholderMessage, messageStyle]}>
                            <Text style={[styles.messageText, styles.placeholderText]}>
                                It&apos;s a sharp pain that gets worse when I lift my arm
                            </Text>
                        </View>

                        <View style={[styles.messageBubble, styles.systemMessage, styles.placeholderMessage, messageStyle]}>
                            <Text style={[styles.messageText, styles.placeholderText]}>
                                That sounds like it could be related to your rotator cuff. How long have you been experiencing this pain?
                            </Text>
                        </View>

                        <View style={[styles.messageBubble, styles.userMessage, styles.placeholderMessage, messageStyle]}>
                            <Text style={[styles.messageText, styles.placeholderText]}>
                                About two weeks now, started after I went to the gym
                            </Text>
                        </View>

                        <View style={[styles.messageBubble, styles.systemMessage, styles.placeholderMessage, messageStyle]}>
                            <Text style={[styles.messageText, styles.placeholderText]}>
                                I see. Try marking the exact areas where you feel the pain on the camera view. This will help me better understand your condition.
                            </Text>
                        </View>

                        <View style={[styles.messageBubble, styles.userMessage, styles.placeholderMessage, messageStyle]}>
                            <Text style={[styles.messageText, styles.placeholderText]}>
                                Okay, I&apos;ll trace the painful areas now
                            </Text>
                        </View>
                    </>
                )}
            </ScrollView>
            {/* Chat Input at the bottom */}
            <ChatInput
                onSendMessage={onSendMessage || (() => { })}
                placeholder="Describe your pain or ask a question..."
                micEnabled={micEnabled}
                onToggleMic={onToggleMic}
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
        backgroundColor: 'transparent',
        justifyContent: 'flex-start',
        pointerEvents: 'box-none', // Allow touches to pass through to camera
        flexDirection: 'column',
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
});
