/**
 * WebAdminLayout - Layout wrapper for admin screens on web
 *
 * Provides consistent header with breadcrumbs, title, and actions area.
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { AppText } from '../../ui/components/AppText';
import { useAppTheme } from '../../theme/useAppTheme';
import { useResponsiveContext } from '../../context/ResponsiveContext';
import { ResponsiveContainer } from '../layout/ResponsiveContainer';
import { BreadcrumbNav, BreadcrumbItem } from './BreadcrumbNav';

interface WebAdminLayoutProps {
  /** Screen title */
  title: string;
  /** Screen subtitle */
  subtitle?: string;
  /** Breadcrumb items */
  breadcrumbs?: BreadcrumbItem[];
  /** Actions (buttons, etc.) rendered in header */
  actions?: React.ReactNode;
  /** Header content below title */
  headerContent?: React.ReactNode;
  /** Main content */
  children: React.ReactNode;
  /** Whether to use a scrollable container */
  scrollable?: boolean;
  /** Max width for content */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Custom padding */
  padding?: number;
  /** Style overrides */
  style?: object;
}

export const WebAdminLayout: React.FC<WebAdminLayoutProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
  headerContent,
  children,
  scrollable = true,
  maxWidth = 'xl',
  padding,
  style,
}) => {
  const { colors } = useAppTheme();
  const { isDesktop, isMobile } = useResponsiveContext();

  const contentPadding = padding ?? (isDesktop ? 24 : 16);

  const content = (
    <>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <BreadcrumbNav items={breadcrumbs} style={styles.breadcrumbs} />
        )}

        {/* Title row */}
        <View style={styles.titleRow}>
          <View style={styles.titleContent}>
            <AppText style={[styles.title, { color: colors.onSurface }]}>
              {title}
            </AppText>
            {subtitle && (
              <AppText style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
                {subtitle}
              </AppText>
            )}
          </View>

          {/* Actions */}
          {actions && (
            <View style={styles.actions}>
              {actions}
            </View>
          )}
        </View>

        {/* Header content */}
        {headerContent && (
          <View style={styles.headerContent}>
            {headerContent}
          </View>
        )}
      </View>

      {/* Main content */}
      <View style={[styles.content, style]}>
        {children}
      </View>
    </>
  );

  if (scrollable) {
    return (
      <ResponsiveContainer
        maxWidth={maxWidth}
        padding={contentPadding}
        style={styles.container}
      >
        {content}
      </ResponsiveContainer>
    );
  }

  return (
    <View style={[styles.container, { padding: contentPadding }]}>
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  breadcrumbs: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  titleContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerContent: {
    marginTop: 16,
  },
  content: {
    flex: 1,
  },
});

export default WebAdminLayout;
