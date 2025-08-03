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
import { Plus, Search, MessageCircle, Send } from 'lucide-react-native';
import { useThreads } from '@/hooks/use-threads-store';
import { ThreadListCard } from '@/components/ThreadListCard';
import { ActionButton } from '@/components/ActionButton';
import { GradientBackground } from '@/components/GradientBackground';
import { CustomPrompt } from '@/components/CustomPrompt';
import { BackendTest } from '@/components/BackendTest';
import { colors } from '@/constants/colors';
import { borderRadius, fontSize, fontWeight, spacing } from '@/constants/theme';

const examplePrompts = [
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

    const handleAskSubmit = () => {
        if (searchQuery.trim()) {
            createThread(searchQuery.trim());
            setSearchQuery(""); // Clear the input
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
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <SafeAreaView style={styles.header}>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>PainAR</Text>
                </View>

                {/* Ask Me Anything Input */}
                <View style={styles.searchContainer}>
                    <Search size={18} color={colors.primary} style={styles.searchIcon} />
                    <TextInput
                        placeholder="Ask me anything about your pain or symptoms..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={styles.searchInput}
                        placeholderTextColor={colors.textSecondary}
                        onSubmitEditing={handleAskSubmit}
                        returnKeyType="send"
                        multiline={false}
                    />
                    {searchQuery.trim() && (
                        <Pressable style={styles.sendButton} onPress={handleAskSubmit}>
                            <Send size={16} color={colors.primary} />
                        </Pressable>
                    )}
                </View>
            </SafeAreaView>

            {/* Example Prompts */}
            <View style={styles.promptsSection}>
                <Text style={styles.sectionTitle}>EXAMPLE PROMPTS</Text>
                <ScrollView
                    ref={scrollRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.promptsScrollView}
                    contentContainerStyle={styles.promptsContent}
                >
                    {examplePrompts.map((prompt, index) => (
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
                                Ask anything about your pain using the search bar above to start your first conversation.
                            </Text>
                        </View>
                    }
                />
            </View>

            {/* Bottom Section - Keep minimal or remove */}
            <SafeAreaView style={styles.bottomSection}>
                <Text style={styles.bottomHint}>
                    💡 Try the example prompts above or ask anything about your pain
                </Text>
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
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    headerTitle: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.primary,
        textAlign: 'center',
    },
    searchContainer: {
        position: 'relative',
        marginTop: spacing.sm,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 5,
    },
    searchIcon: {
        position: 'absolute',
        left: spacing.md,
        top: '50%',
        transform: [{ translateY: -9 }],
        zIndex: 1,
    },
    searchInput: {
        height: 52,
        backgroundColor: '#ffffff',
        borderRadius: 26,
        paddingLeft: 48,
        paddingRight: 56, // Extra space for send button
        fontSize: fontSize.md,
        color: '#1f2937', // darker text
        borderWidth: 2,
        borderColor: '#d1d5db',
        fontWeight: fontWeight.medium,
        textAlignVertical: 'center',
    },
    sendButton: {
        position: 'absolute',
        right: 10,
        top: '50%',
        transform: [{ translateY: -16 }],
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 3,
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
    bottomHint: {
        fontSize: fontSize.sm,
        color: '#7c3aed',
        textAlign: 'center',
        fontWeight: fontWeight.medium,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.lg,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        marginHorizontal: spacing.lg,
        marginBottom: spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e9d5ff',
        lineHeight: 20,
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
