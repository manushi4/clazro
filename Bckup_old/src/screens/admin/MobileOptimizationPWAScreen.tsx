/**
 * MobileOptimizationPWAScreen - Phase 58: Mobile Optimization & PWA
 * Progressive Web App implementation and cross-platform mobile optimization
 * Performance enhancement, offline functionality, and app store optimization
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Dimensions,
  Alert,
  Switch,
  Platform,
  Modal,
} from 'react-native';
import Animated, { FadeIn, FadeInUp, FadeInDown, FadeOut, SlideInUp, SlideInDown, ZoomIn, BounceIn } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';

const { width } = Dimensions.get('window');

interface PWAFeature {
  id: string;
  name: string;
  description: string;
  status: 'enabled' | 'disabled' | 'configuring' | 'testing';
  implementation: number;
  priority: 'high' | 'medium' | 'low';
  category: 'offline' | 'notifications' | 'installation' | 'performance' | 'security';
  benefits: string[];
  requirements: string[];
}

interface PlatformOptimization {
  id: string;
  platform: 'ios' | 'android' | 'web' | 'universal';
  optimization: string;
  impact: 'high' | 'medium' | 'low';
  status: 'implemented' | 'in_progress' | 'pending' | 'testing';
  performance_gain: number;
  description: string;
  metrics: OptimizationMetrics;
}

interface OptimizationMetrics {
  load_time_improvement: number;
  bundle_size_reduction: number;
  memory_usage_reduction: number;
  battery_impact_reduction: number;
  user_satisfaction_increase: number;
}

interface OfflineCapability {
  id: string;
  feature: string;
  description: string;
  offline_support: 'full' | 'partial' | 'none';
  cache_strategy: 'cache_first' | 'network_first' | 'stale_while_revalidate' | 'cache_only';
  data_sync: boolean;
  critical: boolean;
  size_impact: string;
}

interface AppStoreMetric {
  id: string;
  platform: 'google_play' | 'app_store' | 'pwa_stores';
  metric: string;
  current_value: number;
  target_value: number;
  unit: string;
  status: 'good' | 'needs_improvement' | 'critical';
  last_updated: Date;
}

interface MobileOptimizationPWAScreenProps {
  adminId: string;
  onNavigate: (screen: string) => void;
}

const MobileOptimizationPWAScreen: React.FC<MobileOptimizationPWAScreenProps> = ({
  adminId,
  onNavigate,
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();

  const [selectedTab, setSelectedTab] = useState<'overview' | 'pwa' | 'mobile' | 'offline' | 'appstore'>('overview');
  const [pwaFeatures, setPwaFeatures] = useState<PWAFeature[]>(generatePWAFeatures());
  const [platformOptimizations, setPlatformOptimizations] = useState<PlatformOptimization[]>(generatePlatformOptimizations());
  const [offlineCapabilities, setOfflineCapabilities] = useState<OfflineCapability[]>(generateOfflineCapabilities());
  const [appStoreMetrics, setAppStoreMetrics] = useState<AppStoreMetric[]>(generateAppStoreMetrics());
  const [refreshing, setRefreshing] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<PWAFeature | null>(null);
  const [pwaEnabled, setPwaEnabled] = useState(true);
  const [offlineMode, setOfflineMode] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  useEffect(() => {
    // Simulate real-time performance monitoring
    const interval = setInterval(() => {
      setPlatformOptimizations(prev => prev.map(opt => ({
        ...opt,
        metrics: {
          ...opt.metrics,
          load_time_improvement: opt.metrics.load_time_improvement + Math.random() * 2 - 1,
          user_satisfaction_increase: Math.min(100, opt.metrics.user_satisfaction_increase + Math.random()),
        }
      })));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setPwaFeatures(generatePWAFeatures());
      setPlatformOptimizations(generatePlatformOptimizations());
      setAppStoreMetrics(generateAppStoreMetrics());
      setRefreshing(false);
    }, 2000);
  };

  const handleEnablePWA = () => {
    Alert.alert(
      'Enable PWA Features',
      'This will configure service workers, offline capabilities, and install prompts. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Enable', 
          onPress: () => {
            setPwaEnabled(true);
            Alert.alert('PWA Enabled', 'Progressive Web App features have been configured successfully.');
          }
        }
      ]
    );
  };

  const handleOptimizeBundle = () => {
    Alert.alert(
      'Optimize App Bundle',
      'Run comprehensive bundle optimization? This will reduce app size and improve performance.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Optimize', 
          onPress: () => {
            Alert.alert('Optimization Started', 'Bundle optimization is in progress. This may take 10-15 minutes.');
          }
        }
      ]
    );
  };

  const handleTestOfflineMode = () => {
    Alert.alert(
      'Test Offline Mode',
      'Simulate offline conditions to test app functionality without network connection?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Test', 
          onPress: () => {
            Alert.alert('Offline Testing', 'Offline mode simulation started. Check app functionality across all screens.');
          }
        }
      ]
    );
  };

  const renderOverview = () => (
    <View>
      <Text style={[styles.sectionTitle, { color: theme.OnBackground }]}>
        Mobile Optimization Overview
      </Text>
      
      {/* PWA Status Card */}
      <Animated.View entering={FadeInUp} style={[styles.statusCard, { backgroundColor: theme.Surface }]}>
        <View style={styles.statusHeader}>
          <Text style={[styles.cardTitle, { color: theme.OnSurface }]}>
            PWA Implementation Status
          </Text>
          <View style={[styles.statusIndicator, { backgroundColor: pwaEnabled ? '#4CAF50' : '#FF9800' }]}>
            <Text style={styles.statusText}>
              {pwaEnabled ? '✓' : '⚠'}
            </Text>
          </View>
        </View>
        
        <View style={styles.statusMetrics}>
          <View style={styles.statusMetric}>
            <Text style={[styles.metricValue, { color: theme.primary }]}>
              {pwaFeatures.filter(f => f.status === 'enabled').length}/{pwaFeatures.length}
            </Text>
            <Text style={[styles.metricLabel, { color: theme.OnSurfaceVariant }]}>
              Features Active
            </Text>
          </View>
          
          <View style={styles.statusMetric}>
            <Text style={[styles.metricValue, { color: theme.primary }]}>
              {Math.round(pwaFeatures.reduce((acc, f) => acc + f.implementation, 0) / pwaFeatures.length)}%
            </Text>
            <Text style={[styles.metricLabel, { color: theme.OnSurfaceVariant }]}>
              Implementation
            </Text>
          </View>
          
          <View style={styles.statusMetric}>
            <Text style={[styles.metricValue, { color: theme.primary }]}>
              {Platform.OS}
            </Text>
            <Text style={[styles.metricLabel, { color: theme.OnSurfaceVariant }]}>
              Current Platform
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.primaryContainer }]}
          onPress={handleEnablePWA}
        >
          <Text style={[styles.actionButtonText, { color: theme.OnPrimaryContainer }]}>
            {pwaEnabled ? 'Reconfigure PWA' : 'Enable PWA'}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Performance Overview */}
      <Animated.View entering={FadeInUp.delay(200)} style={[styles.performanceCard, { backgroundColor: theme.Surface }]}>
        <Text style={[styles.cardTitle, { color: theme.OnSurface }]}>
          Performance Optimizations
        </Text>
        
        <View style={styles.performanceGrid}>
          {platformOptimizations.slice(0, 4).map((opt, index) => (
            <View key={opt.id} style={styles.performanceItem}>
              <Text style={[styles.performanceValue, { color: theme.primary }]}>
                +{opt.performance_gain}%
              </Text>
              <Text style={[styles.performanceLabel, { color: theme.OnSurfaceVariant }]}>
                {opt.optimization}
              </Text>
            </View>
          ))}
        </View>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.secondaryContainer }]}
          onPress={handleOptimizeBundle}
        >
          <Text style={[styles.actionButtonText, { color: theme.OnSecondaryContainer }]}>
            Optimize Bundle
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Quick Actions */}
      <Animated.View entering={FadeInUp.delay(400)} style={[styles.quickActions, { backgroundColor: theme.Surface }]}>
        <Text style={[styles.cardTitle, { color: theme.OnSurface }]}>
          Quick Actions
        </Text>
        
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: theme.primaryContainer }]}
            onPress={handleTestOfflineMode}
          >
            <Text style={[styles.quickActionIcon, { color: theme.OnPrimaryContainer }]}>📱</Text>
            <Text style={[styles.quickActionText, { color: theme.OnPrimaryContainer }]}>
              Test Offline
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: theme.secondaryContainer }]}
            onPress={() => Alert.alert('Performance', 'Performance audit will run comprehensive checks.')}
          >
            <Text style={[styles.quickActionIcon, { color: theme.OnSecondaryContainer }]}>⚡</Text>
            <Text style={[styles.quickActionText, { color: theme.OnSecondaryContainer }]}>
              Run Audit
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: theme.TertiaryContainer }]}
            onPress={() => Alert.alert('Cache', 'App cache will be cleared and rebuilt.')}
          >
            <Text style={[styles.quickActionIcon, { color: theme.OnTertiaryContainer }]}>🗂️</Text>
            <Text style={[styles.quickActionText, { color: theme.OnTertiaryContainer }]}>
              Clear Cache
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );

  const renderPWA = () => (
    <View>
      <View style={styles.pwaHeader}>
        <Text style={[styles.sectionTitle, { color: theme.OnBackground }]}>
          Progressive Web App Features
        </Text>
        <Switch
          value={pwaEnabled}
          onValueChange={setPwaEnabled}
          trackColor={{ false: theme.Outline, true: theme.primary }}
        />
      </View>

      {pwaFeatures.map((feature, index) => (
        <Animated.View
          key={feature.id}
          animation="fadeInLeft"
          delay={index * 100}
        >
          <TouchableOpacity
            style={[styles.featureCard, { backgroundColor: theme.Surface }]}
            onPress={() => {
              setSelectedFeature(feature);
              setShowFeatureModal(true);
            }}
          >
            <View style={styles.featureHeader}>
              <View style={styles.featureInfo}>
                <Text style={[styles.featureName, { color: theme.OnSurface }]}>
                  {feature.name}
                </Text>
                <Text style={[styles.featureCategory, { color: theme.OnSurfaceVariant }]}>
                  {feature.category} • {feature.priority} priority
                </Text>
              </View>
              
              <View style={[
                styles.featureStatus,
                {
                  backgroundColor: 
                    feature.status === 'enabled' ? '#4CAF50' :
                    feature.status === 'configuring' ? '#2196F3' :
                    feature.status === 'testing' ? '#FF9800' : '#9E9E9E'
                }
              ]}>
                <Text style={styles.featureStatusText}>
                  {feature.status === 'enabled' ? '✓' :
                   feature.status === 'configuring' ? '⚙' :
                   feature.status === 'testing' ? '🧪' : '○'}
                </Text>
              </View>
            </View>
            
            <Text style={[styles.featureDescription, { color: theme.OnSurfaceVariant }]}>
              {feature.description}
            </Text>
            
            <View style={styles.implementationBar}>
              <View style={styles.implementationTrack}>
                <View 
                  style={[
                    styles.implementationProgress,
                    { 
                      width: `${feature.implementation}%`,
                      backgroundColor: feature.implementation >= 90 ? '#4CAF50' : feature.implementation >= 70 ? '#FF9800' : '#F44336'
                    }
                  ]}
                />
              </View>
              <Text style={[styles.implementationText, { color: theme.OnSurfaceVariant }]}>
                {feature.implementation}% implemented
              </Text>
            </View>
            
            <View style={styles.featureBenefits}>
              {feature.benefits.slice(0, 2).map((benefit, idx) => (
                <View key={idx} style={[styles.benefitTag, { backgroundColor: theme.primaryContainer }]}>
                  <Text style={[styles.benefitText, { color: theme.OnPrimaryContainer }]}>
                    {benefit}
                  </Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        </Animated.View>
      ))}
    </View>
  );

  const renderMobile = () => (
    <View>
      <Text style={[styles.sectionTitle, { color: theme.OnBackground }]}>
        Mobile Platform Optimizations
      </Text>
      
      {platformOptimizations.map((optimization, index) => (
        <Animated.View
          key={optimization.id}
          animation="fadeInRight"
          delay={index * 100}
          style={[styles.optimizationCard, { backgroundColor: theme.Surface }]}
        >
          <View style={styles.optimizationHeader}>
            <View style={styles.optimizationInfo}>
              <Text style={[styles.optimizationName, { color: theme.OnSurface }]}>
                {optimization.optimization}
              </Text>
              <Text style={[styles.optimizationPlatform, { color: theme.OnSurfaceVariant }]}>
                {optimization.platform.toUpperCase()} • {optimization.impact} impact
              </Text>
            </View>
            
            <View style={[
              styles.optimizationStatus,
              {
                backgroundColor: 
                  optimization.status === 'implemented' ? '#4CAF50' :
                  optimization.status === 'in_progress' ? '#2196F3' :
                  optimization.status === 'testing' ? '#FF9800' : '#9E9E9E'
              }
            ]}>
              <Text style={styles.optimizationStatusText}>
                {optimization.status === 'implemented' ? '✓' :
                 optimization.status === 'in_progress' ? '⟳' :
                 optimization.status === 'testing' ? '🧪' : '○'}
              </Text>
            </View>
          </View>
          
          <Text style={[styles.optimizationDescription, { color: theme.OnSurfaceVariant }]}>
            {optimization.description}
          </Text>
          
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: theme.primary }]}>
                +{optimization.performance_gain}%
              </Text>
              <Text style={[styles.metricLabel, { color: theme.OnSurfaceVariant }]}>
                Performance
              </Text>
            </View>
            
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: theme.primary }]}>
                -{Math.round(optimization.metrics.load_time_improvement)}ms
              </Text>
              <Text style={[styles.metricLabel, { color: theme.OnSurfaceVariant }]}>
                Load Time
              </Text>
            </View>
            
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: theme.primary }]}>
                -{Math.round(optimization.metrics.bundle_size_reduction)}%
              </Text>
              <Text style={[styles.metricLabel, { color: theme.OnSurfaceVariant }]}>
                Bundle Size
              </Text>
            </View>
          </View>
        </Animated.View>
      ))}
    </View>
  );

  const renderOffline = () => (
    <View>
      <View style={styles.offlineHeader}>
        <Text style={[styles.sectionTitle, { color: theme.OnBackground }]}>
          Offline Capabilities
        </Text>
        <View style={styles.offlineControls}>
          <Switch
            value={offlineMode}
            onValueChange={setOfflineMode}
            trackColor={{ false: theme.Outline, true: theme.primary }}
          />
          <Text style={[styles.controlLabel, { color: theme.OnSurfaceVariant }]}>
            Enable Offline
          </Text>
        </View>
      </View>

      {offlineCapabilities.map((capability, index) => (
        <Animated.View
          key={capability.id}
          entering={FadeInUp.delay(index * 100)}
          style={[styles.capabilityCard, { backgroundColor: theme.Surface }]}
        >
          <View style={styles.capabilityHeader}>
            <View style={styles.capabilityInfo}>
              <Text style={[styles.capabilityName, { color: theme.OnSurface }]}>
                {capability.feature}
              </Text>
              <Text style={[styles.capabilityStrategy, { color: theme.OnSurfaceVariant }]}>
                {capability.cache_strategy.replace(/_/g, ' ')}
              </Text>
            </View>
            
            <View style={[
              styles.supportLevel,
              {
                backgroundColor: 
                  capability.offline_support === 'full' ? '#4CAF50' :
                  capability.offline_support === 'partial' ? '#FF9800' : '#F44336'
              }
            ]}>
              <Text style={styles.supportLevelText}>
                {capability.offline_support === 'full' ? 'Full' :
                 capability.offline_support === 'partial' ? 'Partial' : 'None'}
              </Text>
            </View>
          </View>
          
          <Text style={[styles.capabilityDescription, { color: theme.OnSurfaceVariant }]}>
            {capability.description}
          </Text>
          
          <View style={styles.capabilityFeatures}>
            {capability.data_sync && (
              <View style={[styles.featureChip, { backgroundColor: theme.primaryContainer }]}>
                <Text style={[styles.featureChipText, { color: theme.OnPrimaryContainer }]}>
                  Data Sync
                </Text>
              </View>
            )}
            {capability.critical && (
              <View style={[styles.featureChip, { backgroundColor: theme.errorContainer }]}>
                <Text style={[styles.featureChipText, { color: theme.OnErrorContainer }]}>
                  Critical
                </Text>
              </View>
            )}
            <View style={[styles.featureChip, { backgroundColor: theme.secondaryContainer }]}>
              <Text style={[styles.featureChipText, { color: theme.OnSecondaryContainer }]}>
                {capability.size_impact}
              </Text>
            </View>
          </View>
        </Animated.View>
      ))}
    </View>
  );

  const renderAppStore = () => (
    <View>
      <Text style={[styles.sectionTitle, { color: theme.OnBackground }]}>
        App Store Optimization
      </Text>
      
      {appStoreMetrics.map((metric, index) => (
        <Animated.View
          key={metric.id}
          animation="fadeInLeft"
          delay={index * 100}
          style={[styles.storeMetricCard, { backgroundColor: theme.Surface }]}
        >
          <View style={styles.storeMetricHeader}>
            <View style={styles.storeMetricInfo}>
              <Text style={[styles.storeMetricName, { color: theme.OnSurface }]}>
                {metric.metric}
              </Text>
              <Text style={[styles.storeMetricPlatform, { color: theme.OnSurfaceVariant }]}>
                {metric.platform.replace(/_/g, ' ').toUpperCase()}
              </Text>
            </View>
            
            <View style={[
              styles.storeMetricStatus,
              {
                backgroundColor: 
                  metric.status === 'good' ? '#4CAF50' :
                  metric.status === 'needs_improvement' ? '#FF9800' : '#F44336'
              }
            ]}>
              <Text style={styles.storeMetricStatusText}>
                {metric.status === 'good' ? '✓' :
                 metric.status === 'needs_improvement' ? '⚠' : '✗'}
              </Text>
            </View>
          </View>
          
          <View style={styles.storeMetricValues}>
            <View style={styles.currentValue}>
              <Text style={[styles.valueNumber, { color: theme.primary }]}>
                {metric.current_value}{metric.unit}
              </Text>
              <Text style={[styles.valueLabel, { color: theme.OnSurfaceVariant }]}>
                Current
              </Text>
            </View>
            
            <View style={styles.targetValue}>
              <Text style={[styles.valueNumber, { color: theme.OnSurfaceVariant }]}>
                {metric.target_value}{metric.unit}
              </Text>
              <Text style={[styles.valueLabel, { color: theme.OnSurfaceVariant }]}>
                Target
              </Text>
            </View>
          </View>
          
          <View style={styles.progressBar}>
            <View style={styles.progressTrack}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${Math.min(100, (metric.current_value / metric.target_value) * 100)}%`,
                    backgroundColor: metric.status === 'good' ? '#4CAF50' : metric.status === 'needs_improvement' ? '#FF9800' : '#F44336'
                  }
                ]}
              />
            </View>
          </View>
        </Animated.View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar backgroundColor={theme.Surface} barStyle="dark-content" />
      
      <View style={[styles.header, { backgroundColor: theme.Surface }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => onNavigate('back')}
        >
          <Text style={[styles.backButtonText, { color: theme.primary }]}>←</Text>
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: theme.OnSurface }]}>
            Mobile Optimization & PWA
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.OnSurfaceVariant }]}>
            Progressive Web App and cross-platform optimization
          </Text>
        </View>
      </View>

      <View style={styles.tabContainer}>
        {['overview', 'pwa', 'mobile', 'offline', 'appstore'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              selectedTab === tab && { backgroundColor: theme.primaryContainer }
            ]}
            onPress={() => setSelectedTab(tab as any)}
          >
            <Text style={[
              styles.tabText,
              { 
                color: selectedTab === tab 
                  ? theme.OnPrimaryContainer 
                  : theme.OnSurfaceVariant 
              }
            ]}>
              {tab === 'appstore' ? 'App Store' : tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {selectedTab === 'overview' && renderOverview()}
        {selectedTab === 'pwa' && renderPWA()}
        {selectedTab === 'mobile' && renderMobile()}
        {selectedTab === 'offline' && renderOffline()}
        {selectedTab === 'appstore' && renderAppStore()}
      </ScrollView>

      {/* Feature Detail Modal */}
      <Modal
        visible={showFeatureModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.Surface }]}>
            <Text style={[styles.modalTitle, { color: theme.OnSurface }]}>
              {selectedFeature?.name}
            </Text>
            <TouchableOpacity onPress={() => setShowFeatureModal(false)}>
              <Text style={[styles.modalCloseButton, { color: theme.primary }]}>
                Done
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {selectedFeature && (
              <View>
                <Text style={[styles.modalDescription, { color: theme.OnBackground }]}>
                  {selectedFeature.description}
                </Text>
                
                <View style={styles.modalSection}>
                  <Text style={[styles.modalSectionTitle, { color: theme.OnBackground }]}>
                    Benefits
                  </Text>
                  {selectedFeature.benefits.map((benefit, index) => (
                    <Text key={index} style={[styles.modalBenefit, { color: theme.OnSurfaceVariant }]}>
                      • {benefit}
                    </Text>
                  ))}
                </View>
                
                <View style={styles.modalSection}>
                  <Text style={[styles.modalSectionTitle, { color: theme.OnBackground }]}>
                    Requirements
                  </Text>
                  {selectedFeature.requirements.map((requirement, index) => (
                    <Text key={index} style={[styles.modalRequirement, { color: theme.OnSurfaceVariant }]}>
                      • {requirement}
                    </Text>
                  ))}
                </View>
                
                <TouchableOpacity
                  style={[styles.modalActionButton, { backgroundColor: theme.primary }]}
                  onPress={() => {
                    setShowFeatureModal(false);
                    Alert.alert('Configuration', `${selectedFeature.name} configuration will be updated.`);
                  }}
                >
                  <Text style={[styles.modalActionButtonText, { color: theme.OnPrimary }]}>
                    Configure Feature
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

// Helper functions to generate mock data
function generatePWAFeatures(): PWAFeature[] {
  return [
    {
      id: '1',
      name: 'Service Worker',
      description: 'Background script for offline functionality and caching',
      status: 'enabled',
      implementation: 95,
      priority: 'high',
      category: 'offline',
      benefits: ['Offline functionality', 'Background sync', 'Push notifications', 'Performance'],
      requirements: ['HTTPS', 'Modern browser', 'Storage quota'],
    },
    {
      id: '2',
      name: 'Web App Manifest',
      description: 'App metadata for installation and appearance',
      status: 'enabled',
      implementation: 100,
      priority: 'high',
      category: 'installation',
      benefits: ['App-like experience', 'Home screen installation', 'Full screen mode'],
      requirements: ['Manifest file', 'Icons', 'Display mode'],
    },
    {
      id: '3',
      name: 'Push Notifications',
      description: 'Real-time notifications for user engagement',
      status: 'configuring',
      implementation: 78,
      priority: 'medium',
      category: 'notifications',
      benefits: ['User engagement', 'Real-time updates', 'Re-engagement'],
      requirements: ['User permission', 'Service worker', 'Notification server'],
    },
    {
      id: '4',
      name: 'Background Sync',
      description: 'Sync data when connection is restored',
      status: 'testing',
      implementation: 65,
      priority: 'medium',
      category: 'offline',
      benefits: ['Data consistency', 'Offline actions', 'User experience'],
      requirements: ['Service worker', 'IndexedDB', 'Sync event'],
    },
    {
      id: '5',
      name: 'Add to Home Screen',
      description: 'Install prompt for native app-like experience',
      status: 'enabled',
      implementation: 88,
      priority: 'high',
      category: 'installation',
      benefits: ['Easy access', 'Native feel', 'User retention'],
      requirements: ['Engagement heuristics', 'Manifest', 'Service worker'],
    },
  ];
}

function generatePlatformOptimizations(): PlatformOptimization[] {
  return [
    {
      id: '1',
      platform: 'android',
      optimization: 'Bundle Optimization',
      impact: 'high',
      status: 'implemented',
      performance_gain: 32,
      description: 'Reduced app bundle size with code splitting and tree shaking',
      metrics: {
        load_time_improvement: 850,
        bundle_size_reduction: 32,
        memory_usage_reduction: 18,
        battery_impact_reduction: 12,
        user_satisfaction_increase: 87,
      },
    },
    {
      id: '2',
      platform: 'ios',
      optimization: 'Image Optimization',
      impact: 'medium',
      status: 'implemented',
      performance_gain: 28,
      description: 'WebP images with fallback, lazy loading, and compression',
      metrics: {
        load_time_improvement: 620,
        bundle_size_reduction: 28,
        memory_usage_reduction: 22,
        battery_impact_reduction: 8,
        user_satisfaction_increase: 82,
      },
    },
    {
      id: '3',
      platform: 'web',
      optimization: 'Code Splitting',
      impact: 'high',
      status: 'in_progress',
      performance_gain: 45,
      description: 'Dynamic imports and route-based code splitting',
      metrics: {
        load_time_improvement: 1200,
        bundle_size_reduction: 45,
        memory_usage_reduction: 25,
        battery_impact_reduction: 15,
        user_satisfaction_increase: 91,
      },
    },
    {
      id: '4',
      platform: 'universal',
      optimization: 'Caching Strategy',
      impact: 'high',
      status: 'implemented',
      performance_gain: 38,
      description: 'Multi-layer caching with smart invalidation',
      metrics: {
        load_time_improvement: 950,
        bundle_size_reduction: 0,
        memory_usage_reduction: 12,
        battery_impact_reduction: 20,
        user_satisfaction_increase: 89,
      },
    },
  ];
}

function generateOfflineCapabilities(): OfflineCapability[] {
  return [
    {
      id: '1',
      feature: 'Student Dashboard',
      description: 'View assignments, grades, and class schedule offline',
      offline_support: 'full',
      cache_strategy: 'cache_first',
      data_sync: true,
      critical: true,
      size_impact: '2.3MB',
    },
    {
      id: '2',
      feature: 'Assignment Submission',
      description: 'Create and save assignments for later submission',
      offline_support: 'partial',
      cache_strategy: 'network_first',
      data_sync: true,
      critical: true,
      size_impact: '1.8MB',
    },
    {
      id: '3',
      feature: 'Study Materials',
      description: 'Access downloaded PDFs and documents offline',
      offline_support: 'full',
      cache_strategy: 'cache_only',
      data_sync: false,
      critical: false,
      size_impact: '15MB',
    },
    {
      id: '4',
      feature: 'Teacher Gradebook',
      description: 'Grade assignments and provide feedback offline',
      offline_support: 'partial',
      cache_strategy: 'stale_while_revalidate',
      data_sync: true,
      critical: true,
      size_impact: '3.1MB',
    },
  ];
}

function generateAppStoreMetrics(): AppStoreMetric[] {
  return [
    {
      id: '1',
      platform: 'google_play',
      metric: 'App Rating',
      current_value: 4.6,
      target_value: 4.5,
      unit: '/5',
      status: 'good',
      last_updated: new Date(),
    },
    {
      id: '2',
      platform: 'app_store',
      metric: 'App Size',
      current_value: 48,
      target_value: 50,
      unit: 'MB',
      status: 'good',
      last_updated: new Date(),
    },
    {
      id: '3',
      platform: 'google_play',
      metric: 'Install Rate',
      current_value: 68,
      target_value: 70,
      unit: '%',
      status: 'needs_improvement',
      last_updated: new Date(),
    },
    {
      id: '4',
      platform: 'pwa_stores',
      metric: 'PWA Score',
      current_value: 92,
      target_value: 90,
      unit: '/100',
      status: 'good',
      last_updated: new Date(),
    },
  ];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    marginRight: Spacing.MD,
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.headlineSmall.fontSize,
    fontWeight: Typography.headlineSmall.fontWeight as any,
    lineHeight: Typography.headlineSmall.lineHeight,
  },
  headerSubtitle: {
    fontSize: Typography.bodyMedium.fontSize,
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    gap: Spacing.XS,
  },
  tab: {
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: 20,
  },
  tabText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.MD,
  },
  sectionTitle: {
    fontSize: Typography.headlineSmall.fontSize,
    fontWeight: Typography.headlineSmall.fontWeight as any,
    marginVertical: Spacing.MD,
  },
  statusCard: {
    padding: Spacing.MD,
    borderRadius: 12,
    marginBottom: Spacing.MD,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  cardTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
  },
  statusIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.MD,
  },
  statusMetric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: Typography.titleLarge.fontSize,
    fontWeight: Typography.titleLarge.fontWeight as any,
  },
  metricLabel: {
    fontSize: Typography.bodySmall.fontSize,
    marginTop: 2,
  },
  actionButton: {
    paddingVertical: Spacing.SM,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
  performanceCard: {
    padding: Spacing.MD,
    borderRadius: 12,
    marginBottom: Spacing.MD,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.MD,
  },
  performanceItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  performanceValue: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
  },
  performanceLabel: {
    fontSize: Typography.bodySmall.fontSize,
    textAlign: 'center',
    marginTop: 4,
  },
  quickActions: {
    padding: Spacing.MD,
    borderRadius: 12,
    marginBottom: Spacing.MD,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: '30%',
    padding: Spacing.MD,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: Spacing.XS,
  },
  quickActionText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    textAlign: 'center',
  },
  pwaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  featureCard: {
    padding: Spacing.MD,
    borderRadius: 12,
    marginBottom: Spacing.MD,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  featureInfo: {
    flex: 1,
  },
  featureName: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
    marginBottom: 2,
  },
  featureCategory: {
    fontSize: Typography.bodySmall.fontSize,
    textTransform: 'capitalize',
  },
  featureStatus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureStatusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  featureDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    marginBottom: Spacing.MD,
  },
  implementationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.SM,
    marginBottom: Spacing.SM,
  },
  implementationTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  implementationProgress: {
    height: '100%',
    borderRadius: 2,
  },
  implementationText: {
    fontSize: Typography.bodySmall.fontSize,
    minWidth: 90,
  },
  featureBenefits: {
    flexDirection: 'row',
    gap: Spacing.XS,
  },
  benefitTag: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: 4,
    borderRadius: 12,
  },
  benefitText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '500',
  },
  optimizationCard: {
    padding: Spacing.MD,
    borderRadius: 12,
    marginBottom: Spacing.MD,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  optimizationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  optimizationInfo: {
    flex: 1,
  },
  optimizationName: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
    marginBottom: 2,
  },
  optimizationPlatform: {
    fontSize: Typography.bodySmall.fontSize,
    textTransform: 'capitalize',
  },
  optimizationStatus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optimizationStatusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  optimizationDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    marginBottom: Spacing.MD,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'center',
  },
  offlineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  offlineControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.SM,
  },
  controlLabel: {
    fontSize: Typography.bodySmall.fontSize,
  },
  capabilityCard: {
    padding: Spacing.MD,
    borderRadius: 12,
    marginBottom: Spacing.MD,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  capabilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  capabilityInfo: {
    flex: 1,
  },
  capabilityName: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
    marginBottom: 2,
  },
  capabilityStrategy: {
    fontSize: Typography.bodySmall.fontSize,
    textTransform: 'capitalize',
  },
  supportLevel: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: 4,
    borderRadius: 12,
  },
  supportLevelText: {
    color: 'white',
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
  },
  capabilityDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    marginBottom: Spacing.MD,
  },
  capabilityFeatures: {
    flexDirection: 'row',
    gap: Spacing.XS,
  },
  featureChip: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featureChipText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '500',
  },
  storeMetricCard: {
    padding: Spacing.MD,
    borderRadius: 12,
    marginBottom: Spacing.MD,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  storeMetricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  storeMetricInfo: {
    flex: 1,
  },
  storeMetricName: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
    marginBottom: 2,
  },
  storeMetricPlatform: {
    fontSize: Typography.bodySmall.fontSize,
  },
  storeMetricStatus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeMetricStatusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  storeMetricValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.MD,
  },
  currentValue: {
    alignItems: 'center',
  },
  targetValue: {
    alignItems: 'center',
  },
  valueNumber: {
    fontSize: Typography.titleLarge.fontSize,
    fontWeight: Typography.titleLarge.fontWeight as any,
  },
  valueLabel: {
    fontSize: Typography.bodySmall.fontSize,
    marginTop: 2,
  },
  progressBar: {
    marginBottom: Spacing.SM,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.MD,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: Typography.headlineSmall.fontSize,
    fontWeight: Typography.headlineSmall.fontWeight as any,
    flex: 1,
  },
  modalCloseButton: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: Spacing.MD,
    paddingTop: Spacing.MD,
  },
  modalDescription: {
    fontSize: Typography.bodyLarge.fontSize,
    marginBottom: Spacing.LG,
  },
  modalSection: {
    marginBottom: Spacing.LG,
  },
  modalSectionTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
    marginBottom: Spacing.SM,
  },
  modalBenefit: {
    fontSize: Typography.bodyMedium.fontSize,
    marginBottom: 4,
    marginLeft: Spacing.SM,
  },
  modalRequirement: {
    fontSize: Typography.bodyMedium.fontSize,
    marginBottom: 4,
    marginLeft: Spacing.SM,
  },
  modalActionButton: {
    paddingVertical: Spacing.MD,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: Spacing.LG,
    marginBottom: Spacing.XL,
  },
  modalActionButtonText: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '600',
  },
});

export default MobileOptimizationPWAScreen;