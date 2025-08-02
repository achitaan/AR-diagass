import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';

interface GradientBackgroundProps {
    children: React.ReactNode;
}

export const GradientBackground = ({ children }: GradientBackgroundProps) => {
    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        opacity: 0.8,
    },
});
