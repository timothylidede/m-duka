import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  Easing,
  interpolate,
  runOnJS,
  withRepeat,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

interface SplashScreenProps {
  onAnimationComplete: () => void;
  isAppReady: boolean;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onAnimationComplete, isAppReady }) => {
  // Shared values for various animations
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const slideMy = useSharedValue(-50);
  const slideShop = useSharedValue(50);
  const rotateMy = useSharedValue(0);
  const shimmer = useSharedValue(0);
  const loadingDots = useSharedValue(0);

  useEffect(() => {
    // Entry animations
    const startEntryAnimation = () => {
      scale.value = withSequence(
        withTiming(1.2, { duration: 800, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
        withTiming(1, { duration: 300 })
      );

      opacity.value = withTiming(1, { duration: 1000 });

      slideMy.value = withSpring(0, {
        damping: 8,
        stiffness: 100,
        mass: 0.5,
      });

      slideShop.value = withSpring(0, {
        damping: 8,
        stiffness: 100,
        mass: 0.5,
      });

      // Continuous rotation for the "my" text
      rotateMy.value = withRepeat(
        withSequence(
          withTiming(360, { duration: 2000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
          withTiming(360, { duration: 1000 })
        ),
        -1,
        true
      );

      // Shimmer effect animation
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

    // Exit animation – now delayed by 5 seconds
    const startExitAnimation = () => {
      scale.value = withSequence(
        withTiming(1.1, { duration: 300, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
        withTiming(0, { duration: 500 })
      );

      opacity.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.ease) }, () => {
        runOnJS(onAnimationComplete)();
      });
    };

    startEntryAnimation();

    // Delay exit animation for 5 seconds if the app is ready
    if (isAppReady) {
      setTimeout(startExitAnimation, 5000);
    }
  }, [isAppReady]);

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const myStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: slideMy.value },
      { rotate: `${interpolate(rotateMy.value, [0, 360], [0, 360])}deg` },
    ],
  }));

  const shopStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: slideShop.value },
      { scale: interpolate(shimmer.value, [0, 0.5, 1], [1, 1.05, 1]) },
    ],
  }));

  const gradientStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(shimmer.value, [0, 1], [-width * 0.5, width * 0.5]),
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
          <Animated.Text style={[styles.my, myStyle]}>my</Animated.Text>
          <Animated.Text style={[styles.shop, shopStyle]}>shop</Animated.Text>
        </View>

        {/* Show loading dots only if the app is not ready */}
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
  my: {
    fontSize: 72,
    fontWeight: '900',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  shop: {
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
