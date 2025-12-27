/**
 * WebModalBody - Modal body/content component
 */

import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import type { ModalBodyProps } from '../../types/modal.types';

export const WebModalBody: React.FC<ModalBodyProps> = ({
  children,
  style,
  scrollable = true,
  padding = 24,
}) => {
  const contentStyle = [
    styles.body,
    { padding },
    style,
  ];

  if (scrollable) {
    return (
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={contentStyle}
        showsVerticalScrollIndicator={true}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View style={contentStyle}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    maxHeight: 500,
  },
  body: {
    flexGrow: 1,
  },
});

export default WebModalBody;
