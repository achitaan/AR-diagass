import React, { useState } from 'react';
import { StyleSheet, View, Text, FlatList, Pressable, SafeAreaView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Plus, User, Wifi } from 'lucide-react-native';
import { useThreads } from '@/hooks/use-threads-store';
import { ThreadListCard } from '@/components/ThreadListCard';
import { ActionButton } from '@/components/ActionButton';
import { GradientBackground } from '@/components/GradientBackground';
import { CustomPrompt } from '@/components/CustomPrompt';
import { BackendTest } from '@/components/BackendTest';
import { colors } from '@/constants/colors';
import { borderRadius, fontSize, fontWeight, spacing } from '@/constants/theme';

export default function HomeScreen() {
    const router = useRouter();
    const { threads, setCurrentThreadId, deleteThread } = useThreads();
    const [refreshing, setRefreshing] = useState(false);
    const [showPrompt, setShowPrompt] = useState(false);
    const [showBackendTest, setShowBackendTest] = useState(false);

    const handleThreadPress = (threadId: string) => {
        setCurrentThreadId(threadId);
        router.push('/session');
    };

    const { createThread } = useThreads();

    const handleNewSession = () => {
        setShowPrompt(true);
    };

    const handlePromptConfirm = (title: string) => {
        setShowPrompt(false);
        if (title && title.trim()) {
            createThread(title.trim());
            router.push('/session');
        }
    };

    const handlePromptCancel = () => {
        setShowPrompt(false);
    };

    const handleDeleteThread = (threadId: string) => {
        Alert.alert(
            'Delete Thread',
            'Are you sure you want to delete this thread? This action cannot be undone.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => deleteThread(threadId),
                },
            ]
        );
    };

    const handleShareThread = (threadId: string) => {
        // In a real app, this would generate and share a PDF
        Alert.alert('Share', 'PDF export functionality would be implemented here.');
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        // In a real app, this would refresh data from a server
        setTimeout(() => {
            setRefreshing(false);
        }, 1000);
    };

    return (
        <GradientBackground>
            <StatusBar style="light" />
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Pain Tracker</Text>
                    <View style={styles.headerButtons}>
                        <Pressable
                            style={styles.headerButton}
                            onPress={() => setShowBackendTest(true)}
                            testID="backend-test-button"
                        >
                            <Wifi size={20} color={colors.text} />
                        </Pressable>
                        <Pressable
                            style={styles.profileButton}
                            testID="profile-button"
                        >
                            <User size={24} color={colors.text} />
                        </Pressable>
                    </View>
                </View>

                <FlatList
                    data={threads}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <ThreadListCard
                            thread={item}
                            onPress={handleThreadPress}
                            onDelete={handleDeleteThread}
                            onShare={handleShareThread}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyTitle}>No Pain Sessions Yet</Text>
                            <Text style={styles.emptyText}>
                                Start a new session to track and document your pain.
                            </Text>
                        </View>
                    }
                />

                <View style={styles.buttonContainer}>
                    <ActionButton
                        label="Start New Session"
                        icon={<Plus size={20} color="#fff" />}
                        onPress={handleNewSession}
                        size="large"
                        testID="new-session-button"
                    />
                </View>

                <CustomPrompt
                    visible={showPrompt}
                    title="New Session"
                    message="Enter a title for your pain session:"
                    placeholder="e.g., Left Shoulder Pain"
                    onConfirm={handlePromptConfirm}
                    onCancel={handlePromptCancel}
                />

                {/* Backend Connection Test Modal */}
                {showBackendTest && (
                    <View style={styles.modalOverlay}>
                        <BackendTest onClose={() => setShowBackendTest(false)} />
                    </View>
                )}
            </SafeAreaView>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    headerTitle: {
        fontSize: fontSize.xxl,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    headerButton: {
        width: 36,
        height: 36,
        borderRadius: borderRadius.full,
        backgroundColor: colors.card,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileButton: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.full,
        backgroundColor: colors.card,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingVertical: spacing.md,
        flexGrow: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    emptyTitle: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.semibold,
        color: colors.text,
        marginBottom: spacing.md,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    buttonContainer: {
        padding: spacing.lg,
        alignItems: 'center',
    },
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
});
