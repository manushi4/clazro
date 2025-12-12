/**
 * MessagesListScreen
 * View all parent-teacher messages and communications
 *
 * Features:
 * - Real-time messages from Supabase
 * - Filter by priority (3 levels: High, Medium, Low)
 * - Filter by read status (All, Unread, Read)
 * - Search by subject or sender name
 * - Mark individual messages as read
 * - Mark all as read
 * - Navigate to message detail
 * - Compose new message (floating button)
 * - Pull to refresh
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Col, Row, T, Card, CardContent, Badge, Button } from '../../ui';
import { Colors, Spacing } from '../../theme/designSystem';
import { FilterDropdowns } from '../../components/common/FilterDropdowns';
import type { ParentStackParamList } from '../../types/navigation';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';
import { safeNavigate } from '../../utils/navigationService';

type Props = NativeStackScreenProps<ParentStackParamList, 'MessagesList'>;

type PriorityFilter = 'all' | 'high' | 'medium' | 'low';
type ReadFilter = 'all' | 'unread' | 'read';
type Priority = 'low' | 'medium' | 'high';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  body: string;
  priority: Priority;
  is_read: boolean;
  read_at: string | null;
  has_attachment: boolean;
  attachment_url: string | null;
  student_id: string | null;
  related_type: string | null;
  sent_at: string;
  sender: {
    full_name: string;
    role: string;
  } | null;
}

const MessagesListScreen: React.FC<Props> = () => {
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const queryClient = useQueryClient();

  // Track screen view
  useEffect(() => {
    trackScreenView('MessagesList', { from: 'Dashboard' });
  }, []);

  // Get current user
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
    };
    getUser();
  }, []);

  // Fetch messages
  const {
    data: messages = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['messages', userId],
    queryFn: async () => {
      if (!userId) return [];

      console.log('🔍 [MessagesList] Fetching messages for user', userId);
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id (
            full_name,
            role
          )
        `)
        .eq('recipient_id', userId)
        .order('sent_at', { ascending: false });

      if (error) {
        console.error('❌ [MessagesList] Error:', error);
        throw error;
      }

      console.log('✅ [MessagesList] Loaded', data?.length || 0, 'messages');
      return data as Message[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes (messages should be fresh)
    enabled: !!userId,
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', userId] });
    },
    onError: (error) => {
      console.error('❌ [MessagesList] Mark as read failed:', error);
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!userId) return;

      const { error } = await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('recipient_id', userId)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', userId] });
      trackAction('mark_all_messages_read', 'MessagesList', { count: unreadCount });
    },
    onError: (error) => {
      console.error('❌ [MessagesList] Mark all as read failed:', error);
    },
  });

  // Filter messages
  const filteredMessages = useMemo(() => {
    let filtered = messages;

    // Filter by priority
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(m => m.priority === priorityFilter);
    }

    // Filter by read status
    if (readFilter === 'unread') {
      filtered = filtered.filter(m => !m.is_read);
    } else if (readFilter === 'read') {
      filtered = filtered.filter(m => m.is_read);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        m =>
          m.subject.toLowerCase().includes(query) ||
          m.sender?.full_name?.toLowerCase().includes(query) ||
          m.body.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [messages, priorityFilter, readFilter, searchQuery]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = messages.length;
    const unread = messages.filter(m => !m.is_read).length;
    const read = total - unread;
    const highPriority = messages.filter(m => m.priority === 'high' && !m.is_read).length;

    return { total, unread, read, highPriority };
  }, [messages]);

  const unreadCount = stats.unread;

  // Get priority color
  const getPriorityColor = (priority: Priority): string => {
    switch (priority) {
      case 'high':
        return Colors.error;
      case 'medium':
        return Colors.warning;
      case 'low':
        return Colors.success;
      default:
        return Colors.textSecondary;
    }
  };

  // Format time ago
  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  // Handle message tap
  const handleMessageTap = (message: Message) => {
    // Mark as read if unread
    if (!message.is_read) {
      markAsReadMutation.mutate(message.id);
    }

    trackAction('tap_message', 'MessagesList', {
      priority: message.priority,
      has_attachment: message.has_attachment,
      related_type: message.related_type,
    });

    // Navigate to message detail
    safeNavigate('MessageDetail', { messageId: message.id });
  };

  // Handle compose button
  const handleCompose = () => {
    trackAction('compose_message', 'MessagesList');
    safeNavigate('ComposeMessage', {});
  };

  return (
    <BaseScreen
      scrollable={true}
      loading={isLoading}
      error={error ? 'Failed to load messages' : null}
      empty={!isLoading && messages.length === 0}
      emptyBody="No messages yet. You'll see communications from teachers and school here."
      onRetry={refetch}
    >
      <Col sx={{ p: 'md' }} gap="md">
        {/* Header & Stats Card */}
        <Card variant="elevated">
          <CardContent>
            <Row spaceBetween centerV style={{ marginBottom: Spacing.sm }}>
              <T variant="title" weight="bold">
                Messages
              </T>
              {unreadCount > 0 && (
                <Badge variant="error" label={`${unreadCount} unread`} />
              )}
            </Row>

            {/* Stats Summary */}
            <Row spaceBetween style={{ marginTop: Spacing.md }}>
              <View style={styles.statBox}>
                <T variant="display" weight="bold" style={{ fontSize: 24, color: Colors.primary }}>
                  {stats.total}
                </T>
                <T variant="caption" color="textSecondary">Total</T>
              </View>

              <View style={styles.statBox}>
                <T variant="display" weight="bold" style={{ fontSize: 24, color: Colors.error }}>
                  {stats.unread}
                </T>
                <T variant="caption" color="textSecondary">Unread</T>
              </View>

              <View style={styles.statBox}>
                <T variant="display" weight="bold" style={{ fontSize: 24, color: Colors.success }}>
                  {stats.read}
                </T>
                <T variant="caption" color="textSecondary">Read</T>
              </View>

              {stats.highPriority > 0 && (
                <View style={styles.statBox}>
                  <T variant="display" weight="bold" style={{ fontSize: 24, color: Colors.warning }}>
                    {stats.highPriority}
                  </T>
                  <T variant="caption" color="textSecondary">Urgent</T>
                </View>
              )}
            </Row>

            {/* Mark All as Read Button */}
            {unreadCount > 0 && (
              <Button
                variant="outline"
                onPress={() => markAllAsReadMutation.mutate()}
                style={{ marginTop: Spacing.md }}
              >
                Mark All as Read ({unreadCount})
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Search Input */}
        <Card variant="outlined">
          <CardContent>
            <T variant="caption" color="textSecondary" style={{ marginBottom: Spacing.xs }}>
              Search messages
            </T>
            <View style={styles.searchContainer}>
              <T variant="body">🔍</T>
              <TextInput
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  trackAction('search_messages', 'MessagesList', { query: text });
                }}
                placeholder="Search by subject or sender..."
                style={styles.searchInput}
                placeholderTextColor={Colors.textTertiary}
              />
              {searchQuery && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <T variant="body">✖️</T>
                </TouchableOpacity>
              )}
            </View>
          </CardContent>
        </Card>

        {/* Filter by Read Status */}
        <Row style={{ gap: Spacing.xs }}>
          {(['all', 'unread', 'read'] as ReadFilter[]).map(filter => (
            <Button
              key={filter}
              variant={readFilter === filter ? 'primary' : 'outline'}
              onPress={() => {
                setReadFilter(filter);
                trackAction('filter_read_status', 'MessagesList', { filter });
              }}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Button>
          ))}
        </Row>

        {/* Filter by Priority */}
        {/* Filters */}
        <FilterDropdowns
          filters={[
            {
              label: 'Priority',
              value: priorityFilter,
              options: [
                { value: 'all', label: 'All' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' },
              ],
              onChange: (value) => {
                setPriorityFilter(value as PriorityFilter);
                trackAction('filter_priority', 'MessagesList', { priority: value });
              },
            },
            {
              label: 'Status',
              value: readFilter,
              options: [
                { value: 'all', label: 'All' },
                { value: 'unread', label: 'Unread' },
                { value: 'read', label: 'Read' },
              ],
              onChange: (value) => {
                setReadFilter(value as ReadFilter);
                trackAction('filter_status', 'MessagesList', { status: value });
              },
            },
          ]}
          activeFilters={[
            priorityFilter !== 'all' && { label: priorityFilter.charAt(0).toUpperCase() + priorityFilter.slice(1), variant: 'warning' as const },
            readFilter !== 'all' && { label: readFilter.charAt(0).toUpperCase() + readFilter.slice(1), variant: 'info' as const },
          ].filter(Boolean) as any}
          onClearAll={() => {
            setPriorityFilter('all');
            setReadFilter('all');
            trackAction('clear_filters', 'MessagesList');
          }}
        />

        {/* Messages List */}
        <Col gap="sm">
          {filteredMessages.map(message => (
            <TouchableOpacity
              key={message.id}
              onPress={() => handleMessageTap(message)}
              activeOpacity={0.7}
            >
              <Card
                variant="elevated"
                style={!message.is_read ? styles.unreadCard : {}}
              >
                <CardContent>
                  {/* Header Row */}
                  <Row spaceBetween centerV style={{ marginBottom: Spacing.xs }}>
                    <Row centerV style={{ gap: Spacing.xs, flex: 1 }}>
                      <T variant="caption" weight="semiBold" color="primary">
                        {message.sender?.full_name || 'Unknown Sender'}
                      </T>
                      {message.sender?.role && (
                        <T variant="caption" color="textSecondary">
                          • {message.sender.role}
                        </T>
                      )}
                    </Row>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
                      <View
                        style={[
                          styles.priorityIndicator,
                          { backgroundColor: getPriorityColor(message.priority) },
                        ]}
                      />
                      <T variant="caption" color="textSecondary">
                        {getTimeAgo(message.sent_at)}
                      </T>
                    </View>
                  </Row>

                  {/* Subject */}
                  <T variant="body" weight="semiBold" style={{ marginBottom: Spacing.xs }}>
                    {message.subject}
                  </T>

                  {/* Message Preview */}
                  <T
                    variant="body"
                    color="textSecondary"
                    numberOfLines={2}
                    style={{ marginBottom: Spacing.xs }}
                  >
                    {message.body}
                  </T>

                  {/* Footer Row */}
                  <Row spaceBetween centerV style={{ marginTop: Spacing.sm }}>
                    <Row centerV style={{ gap: Spacing.xs }}>
                      {!message.is_read && (
                        <Badge variant="error" label="🔴 New" />
                      )}
                      {message.priority === 'high' && (
                        <Badge variant="error" label="⚠️ High Priority" />
                      )}
                      {message.has_attachment && (
                        <Badge variant="info" label="📎 Attachment" />
                      )}
                    </Row>

                    {message.related_type && (
                      <T variant="caption" color="textSecondary">
                        {message.related_type}
                      </T>
                    )}
                  </Row>
                </CardContent>
              </Card>
            </TouchableOpacity>
          ))}
        </Col>

        {/* Empty State for Filters */}
        {filteredMessages.length === 0 && messages.length > 0 && (
          <Card variant="outlined">
            <CardContent>
              <View style={{ alignItems: 'center', paddingVertical: Spacing.lg }}>
                <T variant="body" color="textSecondary" style={{ textAlign: 'center' }}>
                  No messages match your filters
                </T>
                <Button
                  variant="outline"
                  onPress={() => {
                    setPriorityFilter('all');
                    setReadFilter('all');
                    setSearchQuery('');
                  }}
                  style={{ marginTop: Spacing.md }}
                >
                  Clear Filters
                </Button>
              </View>
            </CardContent>
          </Card>
        )}

        {/* Compose Button (Floating) */}
        <View style={styles.fab}>
          <Button
            variant="primary"
            onPress={handleCompose}
          >
            ✉️ Compose Message
          </Button>
        </View>
      </Col>
    </BaseScreen>
  );
};

const styles = StyleSheet.create({
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    padding: Spacing.xs,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  fab: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
});

export default MessagesListScreen;
