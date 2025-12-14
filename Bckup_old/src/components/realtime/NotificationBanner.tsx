import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Linking,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../context/ThemeContext';
import { Notification } from '../../services/realtime/NotificationService';
import { format, isToday, isYesterday } from 'date-fns';

interface NotificationBannerProps {
  notification: Notification;
  onDismiss?: () => void;
  onPress?: () => void;
  autoHideDuration?: number;
  position?: 'top' | 'bottom';
}

const NotificationBanner: React.FC<NotificationBannerProps> = ({
  notification,
  onDismiss,
  onPress,
  autoHideDuration = 5000,
  position = 'top',
}) => {
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(true);
  
  const slideAnim = useRef(new Animated.Value(position === 'top' ? -100 : 100)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const panAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slide in
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();

    // Progress animation for auto-hide
    if (autoHideDuration > 0) {
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: autoHideDuration,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) {
          handleDismiss();
        }
      });
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    
    // Slide out
    Animated.timing(slideAnim, {
      toValue: position === 'top' ? -100 : 100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onDismiss?.();
    });
  };

  const handlePress = () => {
    if (notification.action_url) {
      Linking.openURL(notification.action_url);
    }
    onPress?.();
    handleDismiss();
  };

  const handlePanGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: panAnim } }],
    { useNativeDriver: false }
  );

  const handlePanStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, velocityX } = event.nativeEvent;
      
      // If swiped far enough or fast enough, dismiss
      if (Math.abs(translationX) > 100 || Math.abs(velocityX) > 1000) {
        handleDismiss();
      } else {
        // Spring back to original position
        Animated.spring(panAnim, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
      }
    }
  };

  const getIcon = () => {
    switch (notification.category) {
      case 'class':
        return 'school';
      case 'assignment':
        return 'assignment';
      case 'message':
        return 'message';
      case 'announcement':
        return 'campaign';
      case 'payment':
        return 'payment';
      case 'system':
        return 'settings';
      default:
        return 'notifications';
    }
  };

  const getBackgroundColor = () => {
    switch (notification.priority) {
      case 'urgent':
        return theme.error;
      case 'high':
        return theme.warning;
      case 'normal':
        return theme.primary;
      case 'low':
        return theme.info;
      default:
        return theme.Surface;
    }
  };

  const getTextColor = () => {
    switch (notification.priority) {
      case 'urgent':
      case 'high':
        return theme.OnPrimary;
      default:
        return theme.OnSurface;
    }
  };

  const formatTime = () => {
    const date = new Date(notification.created_at);
    
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d');
    }
  };

  if (!isVisible) return null;

  return (
    <PanGestureHandler
      onGestureEvent={handlePanGestureEvent}
      onHandlerStateChange={handlePanStateChange}
    >
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: getBackgroundColor(),
            transform: [
              { translateY: slideAnim },
              { translateX: panAnim },
            ],
            [position]: 0,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.content}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <View style={styles.iconContainer}>
            <Icon
              name={getIcon()}
              size={24}
              color={getTextColor()}
            />
          </View>
          
          <View style={styles.textContainer}>
            <Text
              style={[
                styles.title,
                { color: getTextColor() }
              ]}
              numberOfLines={1}
            >
              {notification.title}
            </Text>
            <Text
              style={[
                styles.content,
                { color: getTextColor() + 'CC' }
              ]}
              numberOfLines={2}
            >
              {notification.content}
            </Text>
            <Text
              style={[
                styles.time,
                { color: getTextColor() + '80' }
              ]}
            >
              {formatTime()}
            </Text>
          </View>

          {notification.is_urgent && (
            <View style={styles.urgentBadge}>
              <Icon name="priority-high" size={16} color={theme.OnError} />
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dismissButton}
          onPress={handleDismiss}
        >
          <Icon name="close" size={20} color={getTextColor() + '80'} />
        </TouchableOpacity>

        {/* Progress indicator for auto-hide */}
        {autoHideDuration > 0 && (
          <Animated.View
            style={[
              styles.progressBar,
              {
                backgroundColor: getTextColor() + '40',
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        )}

        {/* Swipe indicator */}
        <View style={[styles.swipeIndicator, { backgroundColor: getTextColor() + '20' }]} />
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = {
  container: {
    position: 'absolute' as const,
    left: 8,
    right: 8,
    borderRadius: 12,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000,
    overflow: 'hidden' as const,
  },
  content: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    marginBottom: 2,
  },
  content: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
  },
  urgentBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginLeft: 8,
  },
  dismissButton: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  progressBar: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    height: 2,
  },
  swipeIndicator: {
    position: 'absolute' as const,
    left: '50%',
    bottom: 4,
    width: 40,
    height: 4,
    borderRadius: 2,
    transform: [{ translateX: -20 }],
  },
};

export default NotificationBanner;