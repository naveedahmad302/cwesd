import React, { useEffect } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';

interface LDRSBouncyProps {
  /** Overall size (default 45). Dot diameter ≈ size/3, spacing scales with size. */
  size?: number;
  /** Animation speed – duration of one cycle in seconds (default 1.75). Higher = faster. */
  speed?: number;
  color?: string;
}

interface BouncyDotProps {
  index: number;
  dotSize: number;
  spacing: number;
  amplitude: number;
  color: string;
  progress: SharedValue<number>;
}

const DOT_COUNT = 3;
const BOUNCE_AMPLITUDE = 0.35; // fraction of dot size
const TAU = 2 * Math.PI;

function BouncyDot({ index, dotSize, spacing, amplitude, color, progress }: BouncyDotProps) {
  const phase = (index / DOT_COUNT) * TAU;
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const angle = progress.value + phase;
    const y = amplitude * Math.sin(angle);
    return { transform: [{ translateY: y }] };
  });
  return (
    <Animated.View
      style={[
        styles.dotWrap,
        { width: dotSize, height: dotSize, marginHorizontal: spacing / 2 },
        animatedStyle,
      ]}
    >
      <View
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: color,
          },
        ]}
      />
    </Animated.View>
  );
}

/**
 * LDRS Bouncy loader (https://uiball.com/ldrs/) – three dots with wave bounce.
 * React Native implementation with Reanimated + react-native-svg.
 */
export const LDRSBouncy: React.FC<LDRSBouncyProps> = ({
  size = 45,
  speed = 1.75,
  color = 'black',
}) => {
  const progress = useSharedValue(0);
  const dotSize = Math.max(8, size / 4);
  const spacing = size / 8;
  const amplitude = dotSize * BOUNCE_AMPLITUDE;
  const durationMs = speed * 1000;

  useEffect(() => {
    cancelAnimation(progress);
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(TAU, { duration: durationMs, easing: Easing.linear }),
      -1,
      false
    );
    return () => cancelAnimation(progress);
  }, [progress, durationMs]);

  return (
    <View style={[styles.row, { height: size, width: size }]}>
      {[0, 1, 2].map((i) => (
        <BouncyDot
          key={i}
          index={i}
          dotSize={dotSize}
          spacing={spacing}
          amplitude={amplitude}
          color={color}
          progress={progress}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
  },
});
