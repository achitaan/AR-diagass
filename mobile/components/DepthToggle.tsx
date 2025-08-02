import React from 'react';
import { StyleSheet, Pressable, Text } from 'react-native';
import { Layers } from 'lucide-react-native';
import { DepthLevel } from '@/types/thread';
import { colors } from '@/constants/colors';
import { borderRadius, fontSize, fontWeight, spacing } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

interface DepthToggleProps {
    currentDepth: DepthLevel;
    onDepthChange: (depth: DepthLevel) => void;
}

export const DepthToggle = ({ currentDepth, onDepthChange }: DepthToggleProps) => {
    const handleToggle = () => {
        // Cycle through depth levels
        const depthLevels: DepthLevel[] = ['skin', 'muscle', 'deep'];
        const currentIndex = depthLevels.indexOf(currentDepth);
        const nextIndex = (currentIndex + 1) % depthLevels.length;

        // Trigger haptic feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        onDepthChange(depthLevels[nextIndex]);
    };

    // Get label and color based on current depth
    const getDepthInfo = () => {
        switch (currentDepth) {
            case 'skin':
                return { label: 'Skin', color: colors.skin };
            case 'muscle':
                return { label: 'Muscle', color: colors.muscle };
            case 'deep':
                return { label: 'Deep', color: colors.deep };
            default:
                return { label: 'Skin', color: colors.skin };
        }
    };

    const { label, color } = getDepthInfo();

    return (
        <Pressable
            style={({ pressed }) => [
                styles.container,
                { backgroundColor: color },
                pressed && styles.pressed
            ]}
            onPress={handleToggle}
            testID="depth-toggle"
        >
            <Layers size={20} color="#fff" />
            <Text style={styles.label}>{label}</Text>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.full,
        marginBottom: spacing.md,
    },
    pressed: {
        opacity: 0.8,
        transform: [{ scale: 0.95 }],
    },
    label: {
        color: '#fff',
        fontSize: fontSize.sm,
        fontWeight: fontWeight.medium,
        marginLeft: spacing.xs,
    },
});
