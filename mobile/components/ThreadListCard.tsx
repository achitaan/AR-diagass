import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Trash2, Share } from 'lucide-react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Thread } from '@/types/thread';
import { colors } from '@/constants/colors';
import { borderRadius, fontSize, fontWeight, spacing } from '@/constants/theme';

interface ThreadListCardProps {
    thread: Thread;
    onPress: (threadId: string) => void;
    onDelete: (threadId: string) => void;
    onShare: (threadId: string) => void;
}

export const ThreadListCard = ({ thread, onPress, onDelete, onShare }: ThreadListCardProps) => {
    const renderRightActions = () => {
        return (
            <View style={styles.actionsContainer}>
                <Pressable
                    style={[styles.actionButton, styles.shareButton]}
                    onPress={() => onShare(thread.id)}
                    testID={`share-thread-${thread.id}`}
                >
                    <Share size={20} color="#fff" />
                    <Text style={styles.actionText}>Share</Text>
                </Pressable>
                <Pressable
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => onDelete(thread.id)}
                    testID={`delete-thread-${thread.id}`}
                >
                    <Trash2 size={20} color="#fff" />
                    <Text style={styles.actionText}>Delete</Text>
                </Pressable>
            </View>
        );
    };

    // Format the date
    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        if (isToday) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    return (
        <Swipeable renderRightActions={renderRightActions}>
            <Pressable
                style={({ pressed }) => [
                    styles.container,
                    pressed && styles.pressed
                ]}
                onPress={() => onPress(thread.id)}
                testID={`thread-card-${thread.id}`}
            >
                <View style={styles.emojiContainer}>
                    <Text style={styles.emoji}>{thread.emoji}</Text>
                </View>
                <View style={styles.contentContainer}>
                    <View style={styles.headerContainer}>
                        <Text style={styles.title} numberOfLines={1}>{thread.title}</Text>
                        <Text style={styles.date}>{formatDate(thread.lastUpdated)}</Text>
                    </View>
                    <Text style={styles.message} numberOfLines={1}>{thread.lastMessage}</Text>
                </View>
            </Pressable>
        </Swipeable>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: colors.card,
        borderRadius: borderRadius.lg,
        marginHorizontal: spacing.md,
        marginVertical: spacing.sm,
        padding: spacing.md,
        alignItems: 'center',
    },
    pressed: {
        backgroundColor: colors.cardActive,
        transform: [{ scale: 0.98 }],
    },
    emojiContainer: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.full,
        backgroundColor: colors.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    emoji: {
        fontSize: fontSize.xl,
    },
    contentContainer: {
        flex: 1,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    title: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.text,
        flex: 1,
    },
    date: {
        fontSize: fontSize.xs,
        color: colors.textSecondary,
        marginLeft: spacing.sm,
    },
    message: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
    },
    actionsContainer: {
        flexDirection: 'row',
        width: 160,
    },
    actionButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: spacing.sm,
        borderRadius: borderRadius.lg,
    },
    shareButton: {
        backgroundColor: colors.info,
        marginRight: spacing.xs,
    },
    deleteButton: {
        backgroundColor: colors.error,
        marginLeft: spacing.xs,
    },
    actionText: {
        color: '#fff',
        fontSize: fontSize.xs,
        marginTop: spacing.xs,
    },
});
