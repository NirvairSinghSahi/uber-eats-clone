// Animation Utilities
import { Animated } from 'react-native';

/**
 * Fade in animation
 */
export const fadeIn = (value, duration = 300) => {
  return Animated.timing(value, {
    toValue: 1,
    duration,
    useNativeDriver: true,
  });
};

/**
 * Fade out animation
 */
export const fadeOut = (value, duration = 200) => {
  return Animated.timing(value, {
    toValue: 0,
    duration,
    useNativeDriver: true,
  });
};

/**
 * Scale animation
 */
export const scaleIn = (value, duration = 300) => {
  return Animated.spring(value, {
    toValue: 1,
    tension: 50,
    friction: 7,
    useNativeDriver: true,
  });
};

/**
 * Slide up animation
 */
export const slideUp = (value, distance = 50, duration = 300) => {
  return Animated.timing(value, {
    toValue: 0,
    duration,
    useNativeDriver: true,
  });
};

/**
 * Bounce animation
 */
export const bounce = (value) => {
  return Animated.sequence([
    Animated.timing(value, {
      toValue: 1.1,
      duration: 100,
      useNativeDriver: true,
    }),
    Animated.timing(value, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }),
  ]);
};

/**
 * Pulse animation
 */
export const pulse = (value) => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(value, {
        toValue: 1.05,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(value, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ])
  );
};

/**
 * Shake animation
 */
export const shake = (value) => {
  return Animated.sequence([
    Animated.timing(value, { toValue: 10, duration: 50, useNativeDriver: true }),
    Animated.timing(value, { toValue: -10, duration: 50, useNativeDriver: true }),
    Animated.timing(value, { toValue: 10, duration: 50, useNativeDriver: true }),
    Animated.timing(value, { toValue: 0, duration: 50, useNativeDriver: true }),
  ]);
};

export default {
  fadeIn,
  fadeOut,
  scaleIn,
  slideUp,
  bounce,
  pulse,
  shake,
};

