import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { SafeAreaView, View, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { T, Row } from '../../ui';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme/designSystem';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';

type Props = NativeStackScreenProps<any, 'ClassFeedScreen'>;

type PostAuthorRole = 'teacher' | 'student' | 'me';

interface ClassPost {
  id: string;
  classId: string;
  authorName: string;
  authorRole: PostAuthorRole;
  createdAtLabel: string;
  text: string;
  likes: number;
  comments: number;
}

const MOCK_POSTS: Record<string, ClassPost[]> = {
  algebra_class_11: [
    {
      id: 'p1',
      classId: 'algebra_class_11',
      authorName: 'Teacher A',
      authorRole: 'teacher',
      createdAtLabel: '5m ago',
      text: "Welcome to today's Algebra sprint! Quiz tomorrow on linear equations.",
      likes: 10,
      comments: 3,
    },
    {
      id: 'p2',
      classId: 'algebra_class_11',
      authorName: 'You',
      authorRole: 'me',
      createdAtLabel: '4m ago',
      text: 'Hi everyone ??',
      likes: 2,
      comments: 1,
    },
    {
      id: 'p3',
      classId: 'algebra_class_11',
      authorName: 'Riya',
      authorRole: 'student',
      createdAtLabel: '3m ago',
      text: 'Ready for some linear equations?',
      likes: 5,
      comments: 2,
    },
  ],
};

export default function ClassFeedScreen({ route, navigation }: Props) {
  const { classId } = route.params || { classId: 'algebra_class_11' };
  const initialPosts = useMemo(() => MOCK_POSTS[classId] ?? MOCK_POSTS.algebra_class_11, [classId]);

  const [posts, setPosts] = useState<ClassPost[]>(initialPosts);
  const [composer, setComposer] = useState('');

  useEffect(() => {
    trackScreenView('ClassFeedScreen', { classId });
  }, [classId]);

  const handlePost = useCallback(() => {
    const text = composer.trim();
    if (!text) {
      Alert.alert('Empty message', 'Please type something.');
      return;
    }
    const newPost: ClassPost = {
      id: `local-${Date.now()}`,
      classId,
      authorName: 'You',
      authorRole: 'me',
      createdAtLabel: 'Just now',
      text,
      likes: 0,
      comments: 0,
    };
    setPosts((prev) => [...prev, newPost]);
    setComposer('');
    trackAction('class_feed_post', 'ClassFeedScreen', { classId });
  }, [classId, composer]);

  const handleLike = useCallback(
    (postId: string) => {
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, likes: p.likes + 1 } : p)));
      trackAction('class_feed_like', 'ClassFeedScreen', { classId, postId });
    },
    [classId]
  );

  return (
    <BaseScreen scrollable={false}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <T variant="title">?</T>
            </TouchableOpacity>
            <T variant="title" weight="bold">
              Class feed
            </T>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView
            style={styles.messagesContainer}
            contentContainerStyle={{ paddingVertical: Spacing.sm }}
            showsVerticalScrollIndicator={false}
          >
            {posts.map((post) => {
              const isMe = post.authorRole === 'me';
              return (
                <View key={post.id} style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
                  <T variant="caption" color="textSecondary" style={styles.bubbleMeta}>
                    {post.authorName} • {post.createdAtLabel}
                  </T>
                  <T variant="body">{post.text}</T>
                  <Row style={styles.bubbleActions}>
                    <TouchableOpacity
                      onPress={() => handleLike(post.id)}
                      accessibilityRole="button"
                      accessibilityLabel="Like post"
                    >
                      <T variant="caption" style={styles.actionText}>
                        ?? {post.likes}
                      </T>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        trackAction('class_feed_comment', 'ClassFeedScreen', { classId, postId: post.id });
                        Alert.alert('Comments', 'Comments view placeholder.');
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="View comments"
                    >
                      <T variant="caption" style={styles.actionText}>
                        ?? {post.comments}
                      </T>
                    </TouchableOpacity>
                  </Row>
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.inputBar}>
            <TextInput
              value={composer}
              onChangeText={setComposer}
              placeholder="Type a message..."
              placeholderTextColor={Colors.textTertiary}
              multiline
              style={styles.input}
            />
            <TouchableOpacity
              onPress={handlePost}
              style={styles.sendButton}
              accessibilityRole="button"
              accessibilityLabel="Send message"
            >
              <T variant="body" weight="medium" style={{ color: Colors.onPrimary }}>
                Send
              </T>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  messagesContainer: {
    flex: 1,
  },
  bubble: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    maxWidth: '85%',
    ...Shadows.resting,
  },
  bubbleMe: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primaryContainer,
  },
  bubbleOther: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
  },
  bubbleMeta: {
    marginBottom: 2,
  },
  bubbleActions: {
    justifyContent: 'flex-start',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  actionText: {
    color: Colors.primary,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    ...Shadows.resting,
  },
  input: {
    flex: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surfaceVariant,
    color: Colors.textPrimary,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
  },
});
