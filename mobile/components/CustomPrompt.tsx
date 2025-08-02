import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    Pressable,
    StyleSheet,
    Platform,
} from 'react-native';
import { colors } from '@/constants/colors';
import { borderRadius, fontSize, fontWeight, spacing } from '@/constants/theme';

interface CustomPromptProps {
    visible: boolean;
    title: string;
    message: string;
    placeholder?: string;
    onCancel: () => void;
    onConfirm: (text: string) => void;
}

export function CustomPrompt({
    visible,
    title,
    message,
    placeholder = '',
    onCancel,
    onConfirm,
}: CustomPromptProps) {
    const [inputValue, setInputValue] = useState('');

    const handleConfirm = () => {
        onConfirm(inputValue.trim());
        setInputValue('');
    };

    const handleCancel = () => {
        onCancel();
        setInputValue('');
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleCancel}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>

                    <TextInput
                        style={styles.input}
                        value={inputValue}
                        onChangeText={setInputValue}
                        placeholder={placeholder}
                        placeholderTextColor={colors.textSecondary}
                        autoFocus={Platform.OS !== 'web'}
                        returnKeyType="done"
                        onSubmitEditing={handleConfirm}
                    />

                    <View style={styles.buttonContainer}>
                        <Pressable
                            style={[styles.button, styles.cancelButton]}
                            onPress={handleCancel}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </Pressable>

                        <Pressable
                            style={[styles.button, styles.confirmButton]}
                            onPress={handleConfirm}
                        >
                            <Text style={styles.confirmButtonText}>Start</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    container: {
        backgroundColor: colors.card,
        borderRadius: borderRadius.lg,
        padding: spacing.xl,
        width: '100%',
        maxWidth: 320,
    },
    title: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.text,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    message: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        fontSize: fontSize.md,
        color: colors.text,
        backgroundColor: colors.background,
        marginBottom: spacing.lg,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    button: {
        flex: 1,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: colors.surface,
    },
    confirmButton: {
        backgroundColor: colors.primary,
    },
    cancelButtonText: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.medium,
        color: colors.text,
    },
    confirmButtonText: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.medium,
        color: '#fff',
    },
});
