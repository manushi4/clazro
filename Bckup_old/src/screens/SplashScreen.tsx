import React, {useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

const SplashScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6750A4" />
      
      {/* App Logo/Brand */}
      <Animated.View
        entering={FadeInUp.duration(1500)}
        style={styles.logoContainer}
      >
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>C</Text>
        </View>
        <Text style={styles.appName}>Coaching Manager</Text>
        <Text style={styles.tagline}>AI-Powered Coaching Platform</Text>
      </Animated.View>

      {/* Loading Indicator */}
      <Animated.View
        entering={FadeIn.delay(1000)}
        style={styles.loadingContainer}
      >
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Initializing...</Text>
      </Animated.View>

      {/* Version Info */}
      <View style={styles.footer}>
        <Text style={styles.versionText}>Version 1.0.0</Text>
        <Text style={styles.copyrightText}>© 2025 Coaching Manager</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6750A4', // Material Design 3 Primary Color
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 80,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#6750A4',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#E8DEF8', // Primary Container Variant
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    position: 'absolute',
    bottom: 120,
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 16,
    fontSize: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  versionText: {
    color: '#E8DEF8',
    fontSize: 14,
    marginBottom: 4,
  },
  copyrightText: {
    color: '#E8DEF8',
    fontSize: 12,
  },
});

export default SplashScreen;