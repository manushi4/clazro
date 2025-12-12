import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../context/ThemeContext';
import { presenceService, UserPresence } from '../../services/realtime/PresenceService';

interface PresenceIndicatorProps {
  userIds?: string[];
  roomId?: string;
  showCount?: boolean;
  showStatus?: boolean;
  maxAvatars?: number;
  size?: 'small' | 'medium' | 'large';
  onPress?: (presences: UserPresence[]) => void;
}

const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({
  userIds,
  roomId,
  showCount = true,
  showStatus = false,
  maxAvatars = 5,
  size = 'medium',
  onPress,
}) => {
  const { theme } = useTheme();
  const [presences, setPresences] = useState<UserPresence[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);

  const sizes = {
    small: { avatar: 24, status: 8, font: 12 },
    medium: { avatar: 32, status: 10, font: 14 },
    large: { avatar: 40, status: 12, font: 16 },
  };

  const currentSize = sizes[size];

  useEffect(() => {
    loadPresences();
    
    const subscription = presenceService.subscribeToPresence(
      { user_ids: userIds, room_id: roomId },
      handlePresenceUpdate
    );

    return () => {
      presenceService.unsubscribeFromPresence(roomId || 'global');
    };
  }, [userIds, roomId]);

  const loadPresences = async () => {
    try {
      let userPresences: UserPresence[] = [];
      
      if (roomId) {
        userPresences = await presenceService.getRoomParticipantsPresence(roomId);
      } else if (userIds && userIds.length > 0) {
        userPresences = await presenceService.getUsersPresence({ user_ids: userIds });
      } else {
        // Get general online count
        const count = await presenceService.getOnlineCount();
        setOnlineCount(count);
        return;
      }

      setPresences(userPresences);
      setOnlineCount(userPresences.filter(p => p.status === 'online').length);
    } catch (error) {
      console.error('Failed to load presences:', error);
    }
  };

  const handlePresenceUpdate = (presence: UserPresence, action: 'update' | 'join' | 'leave') => {
    setPresences(prev => {
      const filtered = prev.filter(p => p.user_id !== presence.user_id);
      
      if (action === 'leave' || presence.status === 'offline') {
        return filtered;
      } else {
        return [...filtered, presence];
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return theme.success;
      case 'away':
        return theme.warning;
      case 'busy':
        return theme.error;
      default:
        return theme.OnSurface;
    }
  };

  const renderAvatar = (presence: UserPresence, index: number) => {
    const isVisible = index < maxAvatars;
    const zIndex = maxAvatars - index;
    const marginLeft = index > 0 ? -(currentSize.avatar * 0.3) : 0;

    if (!isVisible) return null;

    return (
      <View
        key={presence.user_id}
        style={[
          styles.avatarContainer,
          {
            width: currentSize.avatar,
            height: currentSize.avatar,
            marginLeft,
            zIndex,
          },
        ]}
      >
        {presence.user?.avatar_url ? (
          <Image
            source={{ uri: presence.user.avatar_url }}
            style={[
              styles.avatar,
              {
                width: currentSize.avatar,
                height: currentSize.avatar,
                borderRadius: currentSize.avatar / 2,
                borderColor: theme.Surface,
              },
            ]}
          />
        ) : (
          <View
            style={[
              styles.avatar,
              styles.avatarPlaceholder,
              {
                width: currentSize.avatar,
                height: currentSize.avatar,
                borderRadius: currentSize.avatar / 2,
                backgroundColor: theme.primary,
                borderColor: theme.Surface,
              },
            ]}
          >
            <Text
              style={[
                styles.avatarText,
                {
                  color: theme.OnPrimary,
                  fontSize: currentSize.font * 0.8,
                },
              ]}
            >
              {presence.user?.full_name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
        )}

        {showStatus && (
          <View
            style={[
              styles.statusIndicator,
              {
                width: currentSize.status,
                height: currentSize.status,
                borderRadius: currentSize.status / 2,
                backgroundColor: getStatusColor(presence.status),
                borderColor: theme.Surface,
                bottom: -2,
                right: -2,
              },
            ]}
          />
        )}
      </View>
    );
  };

  const renderOverflowCount = () => {
    const overflowCount = presences.length - maxAvatars;
    if (overflowCount <= 0) return null;

    return (
      <View
        style={[
          styles.overflowContainer,
          {
            width: currentSize.avatar,
            height: currentSize.avatar,
            borderRadius: currentSize.avatar / 2,
            backgroundColor: theme.background,
            borderColor: theme.Outline,
            marginLeft: -(currentSize.avatar * 0.3),
          },
        ]}
      >
        <Text
          style={[
            styles.overflowText,
            {
              color: theme.OnSurface,
              fontSize: currentSize.font * 0.7,
            },
          ]}
        >
          +{overflowCount}
        </Text>
      </View>
    );
  };

  const renderOnlineIndicator = () => {
    if (!showCount && presences.length === 0) return null;

    return (
      <View style={styles.onlineContainer}>
        <View
          style={[
            styles.onlineDot,
            {
              backgroundColor: onlineCount > 0 ? theme.success : theme.OnSurface,
            },
          ]}
        />
        <Text
          style={[
            styles.onlineText,
            {
              color: theme.OnSurfaceVariant,
              fontSize: currentSize.font * 0.9,
            },
          ]}
        >
          {onlineCount} online
        </Text>
      </View>
    );
  };

  const handlePress = () => {
    onPress?.(presences);
  };

  const content = (
    <View style={styles.container}>
      <View style={styles.avatarsContainer}>
        {presences.slice(0, maxAvatars).map(renderAvatar)}
        {renderOverflowCount()}
      </View>
      {showCount && renderOnlineIndicator()}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={handlePress} style={styles.touchable}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = {
  container: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  touchable: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  avatarsContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  avatarContainer: {
    position: 'relative' as const,
  },
  avatar: {
    borderWidth: 2,
  },
  avatarPlaceholder: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  avatarText: {
    fontWeight: 'bold' as const,
  },
  statusIndicator: {
    position: 'absolute' as const,
    borderWidth: 2,
  },
  overflowContainer: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 2,
  },
  overflowText: {
    fontWeight: 'bold' as const,
  },
  onlineContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginLeft: 8,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  onlineText: {
    fontWeight: '500' as const,
  },
};

export default PresenceIndicator;