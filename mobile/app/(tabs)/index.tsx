import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    Pressable,
    SafeAreaView,
    Alert,
    ScrollView,
    TextInput,
    Animated
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Plus, User, Search, Menu, MessageCircle } from 'lucide-react-native';
import { useThreads } from '@/hooks/use-threads-store';
import { ThreadListCard } from '@/components/ThreadListCard';
import { ActionButton } from '@/components/ActionButton';
import { GradientBackground } from '@/components/GradientBackground';
import { CustomPrompt } from '@/components/CustomPrompt';
import { BackendTest } from '@/components/BackendTest';
import { colors } from '@/constants/colors';
import { borderRadius, fontSize, fontWeight, spacing } from '@/constants/theme';

const suggestedPrompts = [
    "Help me describe my pain",
    "Track daily symptoms",
    "Pain intensity scale",
    "Exercise recommendations",
    "Sleep quality impact",
    "Medication tracking",
    "Doctor visit prep",
    "Pain triggers",
];

export default function HomeScreen() {
    const router = useRouter();
    const { threads, setCurrentThreadId, deleteThread } = useThreads();
    const [refreshing, setRefreshing] = useState(false);
    const [showPrompt, setShowPrompt] = useState(false);
    const [showBackendTest, setShowBackendTest] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const scrollRef = useRef<ScrollView>(null);

    // Auto-scroll effect for suggested prompts
    useEffect(() => {
        const scrollAnimation = () => {
            if (scrollRef.current) {
                let scrollPosition = 0;
                const scrollSpeed = 0.5;
                const interval = setInterval(() => {
                    scrollPosition += scrollSpeed;
                    scrollRef.current?.scrollTo({ x: scrollPosition, animated: false });

                    // Reset when reaching end (approximation)
                    if (scrollPosition > 800) {
                        scrollPosition = 0;
                    }
                }, 50);

                return interval;
            }
        };

        const interval = scrollAnimation();
        return () => {
            if (interval) clearInterval(interval);
        };
    }, []);

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

    const handlePromptSelect = (prompt: string) => {
        // Pre-fill the title with the selected prompt
        setShowPrompt(false);
        createThread(prompt);
        router.push('/session');
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
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <SafeAreaView style={styles.header}>
                <View style={styles.headerContent}>
                    <Pressable style={styles.headerButton}>
                        <Menu size={20} color={colors.primary} />
                    </Pressable>
                    <Text style={styles.headerTitle}>AI Assistant</Text>
                    <Pressable
                        style={styles.headerButton}
                        onPress={handleNewSession}
                    >
                        <Plus size={20} color={colors.primary} />
                    </Pressable>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Search size={16} color={colors.textSecondary} style={styles.searchIcon} />
                    <TextInput
                        placeholder="Ask me anything..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={styles.searchInput}
                        placeholderTextColor={colors.textSecondary}
                    />
                </View>
            </SafeAreaView>

            {/* Suggested Prompts */}
            <View style={styles.promptsSection}>
                <Text style={styles.sectionTitle}>SUGGESTED PROMPTS</Text>
                <ScrollView
                    ref={scrollRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.promptsScrollView}
                    contentContainerStyle={styles.promptsContent}
                >
                    {suggestedPrompts.map((prompt, index) => (
                        <Pressable
                            key={index}
                            style={styles.promptButton}
                            onPress={() => handlePromptSelect(prompt)}
                        >
                            <Text style={styles.promptText}>{prompt}</Text>
                        </Pressable>
                    ))}
                </ScrollView>
            </View>

            {/* Recent Conversations */}
            <View style={styles.threadsSection}>
                <View style={styles.threadsHeader}>
                    <Text style={styles.sectionTitle}>RECENT CONVERSATIONS</Text>
                </View>

                <FlatList
                    data={threads}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <Pressable
                            style={styles.threadItem}
                            onPress={() => handleThreadPress(item.id)}
                        >
                            <View style={styles.threadIcon}>
                                <MessageCircle size={24} color="#fff" />
                            </View>
                            <View style={styles.threadContent}>
                                <View style={styles.threadHeader}>
                                    <Text style={styles.threadTitle} numberOfLines={1}>
                                        {item.title}
                                    </Text>
                                    <Text style={styles.threadTimestamp}>
                                        {new Date(item.lastUpdated).toLocaleDateString()}
                                    </Text>
                                </View>
                                <Text style={styles.threadMessage} numberOfLines={2}>
                                    {item.lastMessage}
                                </Text>
                                <View style={styles.threadFooter}>
                                    <Text style={styles.messageCount}>
                                        {item.messages.length} messages
                                    </Text>
                                </View>
                            </View>
                        </Pressable>
                    )}
                    contentContainerStyle={styles.threadsList}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyTitle}>No Conversations Yet</Text>
                            <Text style={styles.emptyText}>
                                Start a new conversation to track and document your pain.
                            </Text>
                        </View>
                    }
                />
            </View>

            {/* Bottom Action Button */}
            <SafeAreaView style={styles.bottomSection}>
                <Pressable
                    style={styles.newConversationButton}
                    onPress={handleNewSession}
                >
                    <Plus size={20} color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.buttonText}>Start New Conversation</Text>
                </Pressable>
            </SafeAreaView>

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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#faf5ff', // purple-50 equivalent
    },
    header: {
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#e9d5ff', // purple-100 equivalent
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    headerTitle: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.primary,
        textAlign: 'center',
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.full,
        backgroundColor: 'rgba(147, 51, 234, 0.1)', // purple-50 equivalent
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchContainer: {
        position: 'relative',
        marginTop: spacing.sm,
    },
    searchIcon: {
        position: 'absolute',
        left: spacing.md,
        top: '50%',
        transform: [{ translateY: -8 }],
        zIndex: 1,
    },
    searchInput: {
        height: 48,
        backgroundColor: '#f3e8ff', // purple-50 equivalent
        borderRadius: 24,
        paddingLeft: 48,
        paddingRight: spacing.md,
        fontSize: fontSize.md,
        color: '#374151', // gray-700
        borderWidth: 1,
        borderColor: '#c4b5fd', // purple-200 equivalent
    },
    promptsSection: {
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#e9d5ff',
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: fontWeight.semibold,
        color: '#7c3aed', // purple-700
        marginBottom: spacing.md,
        letterSpacing: 1,
    },
    promptsScrollView: {
        marginHorizontal: -spacing.lg,
    },
    promptsContent: {
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
    },
    promptButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 12,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderWidth: 1,
        borderColor: '#c4b5fd',
        marginRight: spacing.sm,
        minWidth: 120,
    },
    promptText: {
        fontSize: 14,
        color: '#7c3aed',
        fontWeight: fontWeight.medium,
        textAlign: 'center',
    },
    threadsSection: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
    },
    threadsHeader: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#e9d5ff',
    },
    threadsList: {
        paddingVertical: 0,
    },
    threadItem: {
        flexDirection: 'row',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#f3e8ff',
        backgroundColor: 'transparent',
    },
    threadIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    threadContent: {
        flex: 1,
        minWidth: 0,
    },
    threadHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    threadTitle: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: '#1f2937', // gray-800
        flex: 1,
    },
    threadTimestamp: {
        fontSize: 12,
        color: colors.primary,
        fontWeight: fontWeight.medium,
        marginLeft: spacing.sm,
    },
    threadMessage: {
        fontSize: 14,
        color: '#6b7280', // gray-600
        lineHeight: 20,
        marginBottom: spacing.sm,
    },
    threadFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    messageCount: {
        fontSize: 12,
        color: '#a855f7', // purple-400
        fontWeight: fontWeight.medium,
        backgroundColor: '#f3e8ff',
        paddingHorizontal: spacing.xs,
        paddingVertical: 2,
        borderRadius: 12,
    },
    bottomSection: {
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: '#e9d5ff',
    },
    newConversationButton: {
        flexDirection: 'row',
        backgroundColor: colors.primary,
        borderRadius: 24,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonIcon: {
        marginRight: spacing.sm,
    },
    buttonText: {
        color: '#fff',
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.xxl,
    },
    emptyTitle: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.semibold,
        color: '#374151',
        marginBottom: spacing.md,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: fontSize.md,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 22,
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
