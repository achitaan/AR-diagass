import React from 'react';
import { StyleSheet, Pressable, Text, View } from 'react-native';
import { colors } from '@/constants/colors';
import { borderRadius, fontSize, fontWeight, spacing } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

interface ActionButtonProps {
    label: string;
    icon?: React.ReactNode;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
    size?: 'small' | 'medium' | 'large';
    fullWidth?: boolean;
    testID?: string;
}

export const ActionButton = ({
    label,
    icon,
    onPress,
    variant = 'primary',
    size = 'medium',
    fullWidth = false,
    testID,
}: ActionButtonProps) => {
    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
    };

    return (
        <Pressable
            style={({ pressed }) => [
                styles.button,
                styles[variant],
                styles[size],
                fullWidth && styles.fullWidth,
                pressed && styles.pressed,
            ]}
            onPress={handlePress}
            testID={testID}
        >
            {icon && <View style={styles.iconContainer}>{icon}</View>}
            <Text style={[styles.label, styles[`${variant}Text`]]}>{label}</Text>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: borderRadius.full,
    },
    primary: {
        backgroundColor: colors.primary,
    },
    secondary: {
        backgroundColor: colors.secondary,
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.primary,
    },
    small: {
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
    },
    medium: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
    },
    large: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
    },
    fullWidth: {
        width: '100%',
    },
    pressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    iconContainer: {
        marginRight: spacing.xs,
    },
    label: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.medium,
    },
    primaryText: {
        color: '#fff',
    },
    secondaryText: {
        color: colors.text,
    },
    outlineText: {
        color: colors.primary,
    },
});
