import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Animated } from 'react-native';
import { Card, CardContent, Button, T, Badge } from '../../ui';

interface StudentWelcomeScreenProps {
  onGetStarted: () => void;
}

const StudentWelcomeScreen: React.FC<StudentWelcomeScreenProps> = ({ onGetStarted }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const features = [
    {
      icon: '🏠',
      title: 'Home Dashboard',
      description: 'Your personalized learning hub with quick access to everything',
    },
    {
      icon: '📚',
      title: 'Live Classes',
      description: 'Join interactive sessions, take notes, and engage with teachers',
    },
    {
      icon: '📖',
      title: 'Study Library',
      description: 'Access comprehensive study materials, assignments, and resources',
    },
    {
      icon: '📊',
      title: 'Progress Tracking',
      description: 'Monitor your learning journey with detailed analytics and insights',
    },
    {
      icon: '👥',
      title: 'Peer Learning',
      description: 'Connect with classmates, collaborate, and learn together',
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Animated.View
        style={[
          styles.heroSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.header}>
          <T variant="display" style={styles.emoji}>
            🎓
          </T>
          <T variant="h1" style={styles.title}>
            Welcome to
          </T>
          <T variant="h1" style={styles.appName}>
            Manushi Coaching
          </T>
          <Badge variant="success" style={styles.badge}>
            Student Portal
          </Badge>
        </View>

        <T variant="body" style={styles.subtitle}>
          Your complete learning companion for academic excellence
        </T>
      </Animated.View>

      <Animated.View
        style={[
          styles.featuresSection,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <T variant="h3" style={styles.sectionTitle}>
          Everything You Need to Excel
        </T>

        {features.map((feature, index) => (
          <Animated.View
            key={index}
            style={[
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 50],
                      outputRange: [0, 50 + index * 10],
                    }),
                  },
                ],
              },
            ]}
          >
            <Card style={styles.featureCard}>
              <CardContent>
                <View style={styles.featureContent}>
                  <T variant="display" style={styles.featureIcon}>
                    {feature.icon}
                  </T>
                  <View style={styles.featureText}>
                    <T variant="subtitle" style={styles.featureTitle}>
                      {feature.title}
                    </T>
                    <T variant="caption" style={styles.featureDescription}>
                      {feature.description}
                    </T>
                  </View>
                </View>
              </CardContent>
            </Card>
          </Animated.View>
        ))}
      </Animated.View>

      <Animated.View
        style={[
          styles.ctaSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Button onPress={onGetStarted} style={styles.startButton} size="large">
          Start Learning
        </Button>
        <T variant="caption" style={styles.footerText}>
          Access your personalized dashboard and begin your learning journey
        </T>
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  heroSection: {
    marginBottom: 32,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  emoji: {
    fontSize: 72,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '300',
    color: '#495057',
    marginBottom: 4,
  },
  appName: {
    fontSize: 36,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 12,
  },
  badge: {
    marginTop: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  featuresSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 20,
    textAlign: 'center',
  },
  featureCard: {
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featureContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 20,
  },
  ctaSection: {
    alignItems: 'center',
    marginTop: 16,
  },
  startButton: {
    width: '100%',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#007BFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  footerText: {
    fontSize: 13,
    color: '#868E96',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 18,
  },
});

export default StudentWelcomeScreen;
