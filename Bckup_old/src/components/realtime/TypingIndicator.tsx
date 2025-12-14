import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface TypingIndicatorProps {
  users: string[];
  maxUsers?: number;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  users,
  maxUsers = 3,
}) => {
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dotAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    if (users.length > 0) {
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Animate dots
      const animateDots = () => {
        const animations = dotAnims.map((anim, index) =>
          Animated.sequence([
            Animated.delay(index * 200),
            Animated.timing(anim, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        );

        Animated.loop(
          Animated.sequence([
            Animated.parallel(animations),
            Animated.delay(200),
          ])
        ).start();
      };

      animateDots();
    } else {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      dotAnims.forEach(anim => anim.stopAnimation());
    };
  }, [users.length]);

  if (users.length === 0) return null;

  const getTypingText = () => {
    const visibleUsers = users.slice(0, maxUsers);
    const remainingCount = users.length - maxUsers;

    if (users.length === 1) {
      return `${visibleUsers[0]} is typing`;
    } else if (users.length === 2) {
      return `${visibleUsers[0]} and ${visibleUsers[1]} are typing`;
    } else if (users.length <= maxUsers) {
      const lastUser = visibleUsers.pop();
      return `${visibleUsers.join(', ')}, and ${lastUser} are typing`;
    } else {
      return `${visibleUsers.join(', ')}, and ${remainingCount} other${remainingCount > 1 ? 's' : ''} are typing`;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: theme.Surface,
          opacity: fadeAnim,
        },
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.text, { color: theme.OnSurfaceVariant }]}>
          {getTypingText()}
        </Text>
        <View style={styles.dots}>
          {dotAnims.map((anim, index) => (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: theme.primary,
                  opacity: anim,
                  transform: [
                    {
                      scale: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1.2],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = {
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 4,
  },
  content: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  text: {
    fontSize: 12,
    fontStyle: 'italic' as const,
    marginRight: 8,
  },
  dots: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 1,
  },
};

export default TypingIndicator;