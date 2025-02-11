import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  interpolate,
  runOnJS,
  withRepeat,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

interface SplashScreenProps {
  onAnimationComplete: () => void;
  isAppReady: boolean;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onAnimationComplete, isAppReady }) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const slideM = useSharedValue(-50);
  const slideDuka = useSharedValue(50);
  const rotateM = useSharedValue(0);
  const gradientPosition = useSharedValue(0);
  const loadingDots = useSharedValue(0);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    // Initial animations
    const startEntryAnimation = () => {
      scale.value = withSequence(
        withTiming(1.2, { duration: 800, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
        withTiming(1, { duration: 300 })
      );
      
      opacity.value = withTiming(1, { duration: 1000 });
      
      slideM.value = withSpring(0, {
        damping: 8,
        stiffness: 100,
        mass: 0.5,
      });
      
      slideDuka.value = withSpring(0, {
        damping: 8,
        stiffness: 100,
        mass: 0.5,
      });
      
      // Continuous rotation with pause
      rotateM.value = withRepeat(
        withSequence(
          withTiming(360, {
            duration: 2000,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          }),
          withTiming(360, { duration: 1000 })
        ),
        -1,
        true
      );

      // Shimmer effect
      shimmer.value = withRepeat(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      );

      // Loading dots animation
      loadingDots.value = withRepeat(
        withTiming(3, { duration: 1000, easing: Easing.linear }),
        -1,
        true
      );
    };

    // Exit animation when app is ready
    const startExitAnimation = () => {
      scale.value = withSequence(
        withTiming(1.1, { duration: 300, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
        withTiming(0, { duration: 500 })
      );
      
      opacity.value = withTiming(0, {
        duration: 400,
        easing: Easing.out(Easing.ease),
      }, () => {
        runOnJS(onAnimationComplete)();
      });
    };

    startEntryAnimation();

    // When app is ready, start exit animation after a small delay
    if (isAppReady) {
      setTimeout(startExitAnimation, 500);
    }
  }, [isAppReady]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const mStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: slideM.value },
      { rotate: `${interpolate(rotateM.value, [0, 360], [0, 360])}deg` },
    ],
  }));

  const dukaStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: slideDuka.value },
      { scale: interpolate(shimmer.value, [0, 0.5, 1], [1, 1.05, 1]) },
    ],
  }));

  const gradientStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          shimmer.value,
          [0, 1],
          [-width * 0.5, width * 0.5]
        ),
      },
    ],
  }));

  const loadingDotsStyle = useAnimatedStyle(() => ({
    opacity: interpolate(loadingDots.value, [0, 1, 2, 3], [0.3, 0.6, 0.9, 0.3]),
  }));

  return (
    <View style={styles.container}>
      <AnimatedLinearGradient
        colors={['#2E3192', '#1BFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, containerStyle]}
      >
        <View style={styles.logoContainer}>
          <Animated.Text style={[styles.m, mStyle]}>m</Animated.Text>
          <Animated.Text style={[styles.duka, dukaStyle]}>Duka</Animated.Text>
        </View>
        
        {!isAppReady && (
          <View style={styles.loadingContainer}>
            <Animated.View style={[styles.loadingDot, loadingDotsStyle]} />
            <Animated.View style={[styles.loadingDot, loadingDotsStyle]} />
            <Animated.View style={[styles.loadingDot, loadingDotsStyle]} />
          </View>
        )}
        
        <Animated.View style={[styles.shimmer, gradientStyle]} />
      </AnimatedLinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  m: {
    fontSize: 72,
    fontWeight: '900',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  duka: {
    fontSize: 64,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  loadingContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 100,
  },
  loadingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    marginHorizontal: 5,
  },
});

export default SplashScreen;