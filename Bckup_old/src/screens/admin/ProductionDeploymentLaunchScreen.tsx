/**
 * ProductionDeploymentLaunchScreen - Phase 60: Production Deployment & Launch
 * Complete production environment setup, deployment management, and launch preparation
 * Monitoring systems, backup strategies, and comprehensive launch execution
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
  Modal,
  Switch,
  Platform,
} from 'react-native';
import Animated, { FadeIn, FadeInUp, FadeInDown, FadeOut, SlideInUp, SlideInDown, ZoomIn, BounceIn } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';

const { width } = Dimensions.get('window');

interface DeploymentEnvironment {
  id: string;
  name: string;
  type: 'development' | 'staging' | 'production';
  status: 'active' | 'inactive' | 'deploying' | 'failed' | 'maintenance';
  url: string;
  version: string;
  lastDeployment: Date;
  uptime: number;
  performance: EnvironmentPerformance;
  resources: EnvironmentResources;
  healthChecks: HealthCheck[];
}

interface EnvironmentPerformance {
  responseTime: number;
  throughput: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
}

interface EnvironmentResources {
  instances: number;
  loadBalancers: number;
  databases: number;
  cacheNodes: number;
  storageGB: number;
  bandwidth: number;
}

interface HealthCheck {
  id: string;
  name: string;
  endpoint: string;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  lastCheck: Date;
  responseTime: number;
  details: string;
}

interface DeploymentPipeline {
  id: string;
  name: string;
  stages: PipelineStage[];
  status: 'idle' | 'running' | 'completed' | 'failed' | 'paused';
  currentStage: number;
  progress: number;
  startTime?: Date;
  endTime?: Date;
  triggeredBy: string;
}

interface PipelineStage {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  duration?: number;
  logs?: string[];
  artifacts?: string[];
}

interface LaunchChecklist {
  id: string;
  category: 'technical' | 'business' | 'marketing' | 'support' | 'legal';
  item: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority: 'critical' | 'high' | 'medium' | 'low';
  assignee: string;
  dueDate: Date;
  dependencies: string[];
}

interface MonitoringAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  source: string;
  timestamp: Date;
  status: 'active' | 'acknowledged' | 'resolved';
  assignee?: string;
}

interface ProductionDeploymentLaunchScreenProps {
  adminId: string;
  onNavigate: (screen: string) => void;
}

const ProductionDeploymentLaunchScreen: React.FC<ProductionDeploymentLaunchScreenProps> = ({
  adminId,
  onNavigate,
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();

  const [selectedTab, setSelectedTab] = useState<'overview' | 'environments' | 'pipeline' | 'monitoring' | 'launch'>('overview');
  const [environments, setEnvironments] = useState<DeploymentEnvironment[]>(generateEnvironments());
  const [deploymentPipelines, setDeploymentPipelines] = useState<DeploymentPipeline[]>(generatePipelines());
  const [launchChecklist, setLaunchChecklist] = useState<LaunchChecklist[]>(generateLaunchChecklist());
  const [monitoringAlerts, setMonitoringAlerts] = useState<MonitoringAlert[]>(generateMonitoringAlerts());
  const [refreshing, setRefreshing] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [selectedEnvironment, setSelectedEnvironment] = useState<DeploymentEnvironment | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [autoDeployment, setAutoDeployment] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [productionReady, setProductionReady] = useState(false);

  useEffect(() => {
    // Simulate real-time monitoring updates
    const interval = setInterval(() => {
      setEnvironments(prev => prev.map(env => ({
        ...env,
        performance: {
          ...env.performance,
          responseTime: Math.max(50, env.performance.responseTime + Math.random() * 20 - 10),
          cpuUsage: Math.max(0, Math.min(100, env.performance.cpuUsage + Math.random() * 10 - 5)),
          memoryUsage: Math.max(0, Math.min(100, env.performance.memoryUsage + Math.random() * 8 - 4)),
        }
      })));

      // Update alerts
      if (Math.random() < 0.1) { // 10% chance of new alert
        const alertTypes = ['error', 'warning', 'info'];
        const severities = ['critical', 'high', 'medium', 'low'];
        setMonitoringAlerts(prev => [
          {
            id: Date.now().toString(),
            type: alertTypes[Math.floor(Math.random() * alertTypes.length)] as any,
            severity: severities[Math.floor(Math.random() * severities.length)] as any,
            title: 'System Alert',
            description: 'Automated monitoring detected an issue',
            source: 'Monitoring System',
            timestamp: new Date(),
            status: 'active',
          },
          ...prev.slice(0, 9) // Keep only last 10 alerts
        ]);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setEnvironments(generateEnvironments());
      setDeploymentPipelines(generatePipelines());
      setLaunchChecklist(generateLaunchChecklist());
      setRefreshing(false);
    }, 2000);
  };

  const handleDeploy = (environment: DeploymentEnvironment) => {
    Alert.alert(
      'Deploy to ' + environment.name,
      `Deploy the latest version to ${environment.name} environment? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Deploy', 
          style: 'destructive',
          onPress: () => {
            setIsDeploying(true);
            setEnvironments(prev => prev.map(env => 
              env.id === environment.id 
                ? { ...env, status: 'deploying' }
                : env
            ));
            
            // Simulate deployment process
            setTimeout(() => {
              setEnvironments(prev => prev.map(env => 
                env.id === environment.id 
                  ? { 
                      ...env, 
                      status: 'active',
                      version: `v${parseFloat(env.version.substring(1)) + 0.1}`,
                      lastDeployment: new Date()
                    }
                  : env
              ));
              setIsDeploying(false);
              Alert.alert('Deployment Complete', `Successfully deployed to ${environment.name}`);
            }, 8000);
          }
        }
      ]
    );
  };

  const handleProductionLaunch = () => {
    const completedItems = launchChecklist.filter(item => item.status === 'completed').length;
    const totalItems = launchChecklist.length;
    const completionRate = (completedItems / totalItems) * 100;

    if (completionRate < 95) {
      Alert.alert(
        'Launch Not Ready',
        `Only ${completionRate.toFixed(0)}% of launch checklist completed. Complete at least 95% before production launch.`
      );
      return;
    }

    Alert.alert(
      'Production Launch',
      'Launch the application to production? This will make the app available to all users worldwide.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Launch to Production', 
          style: 'destructive',
          onPress: () => {
            setProductionReady(true);
            Alert.alert(
              'Launch Initiated',
              'Production launch sequence started. Monitor the deployment progress and system health closely.',
              [{ text: 'OK' }]
            );
          }
        }
      ]
    );
  };

  const handleRollback = () => {
    Alert.alert(
      'Emergency Rollback',
      'Roll back to the previous stable version? This will revert all recent changes.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Rollback', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('Rollback Initiated', 'Rolling back to previous stable version. ETA: 3-5 minutes.');
          }
        }
      ]
    );
  };

  const renderOverview = () => (
    <View>
      <Text style={[styles.sectionTitle, { color: theme.OnBackground }]}>
        Production Deployment Overview
      </Text>
      
      {/* System Status */}
      <Animated.View entering={FadeInUp} style={[styles.statusCard, { backgroundColor: theme.Surface }]}>
        <View style={styles.statusHeader}>
          <Text style={[styles.cardTitle, { color: theme.OnSurface }]}>
            System Status
          </Text>
          <View style={[
            styles.overallStatus,
            { 
              backgroundColor: productionReady ? '#4CAF50' : 
                             isDeploying ? '#FF9800' : 
                             maintenanceMode ? '#F44336' : '#2196F3'
            }
          ]}>
            <Text style={styles.overallStatusText}>
              {productionReady ? 'LIVE' : 
               isDeploying ? 'DEPLOYING' : 
               maintenanceMode ? 'MAINTENANCE' : 'STAGING'}
            </Text>
          </View>
        </View>
        
        <View style={styles.statusMetrics}>
          <View style={styles.statusMetric}>
            <Text style={[styles.metricValue, { color: theme.primary }]}>
              {environments.filter(env => env.status === 'active').length}
            </Text>
            <Text style={[styles.metricLabel, { color: theme.OnSurfaceVariant }]}>
              Active Environments
            </Text>
          </View>
          
          <View style={styles.statusMetric}>
            <Text style={[styles.metricValue, { color: theme.primary }]}>
              {Math.round(environments.reduce((acc, env) => acc + env.uptime, 0) / environments.length)}%
            </Text>
            <Text style={[styles.metricLabel, { color: theme.OnSurfaceVariant }]}>
              Average Uptime
            </Text>
          </View>
          
          <View style={styles.statusMetric}>
            <Text style={[styles.metricValue, { color: theme.primary }]}>
              {monitoringAlerts.filter(alert => alert.status === 'active').length}
            </Text>
            <Text style={[styles.metricLabel, { color: theme.OnSurfaceVariant }]}>
              Active Alerts
            </Text>
          </View>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[
              styles.launchButton, 
              { 
                backgroundColor: productionReady ? theme.error : theme.primary,
                opacity: isDeploying ? 0.6 : 1
              }
            ]}
            onPress={productionReady ? handleRollback : handleProductionLaunch}
            disabled={isDeploying}
          >
            <Text style={[styles.launchButtonText, { color: productionReady ? theme.OnError : theme.OnPrimary }]}>
              {productionReady ? 'Emergency Rollback' : 'Launch to Production'}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Environment Health */}
      <Animated.View entering={FadeInUp.delay(200)} style={[styles.healthCard, { backgroundColor: theme.Surface }]}>
        <Text style={[styles.cardTitle, { color: theme.OnSurface }]}>
          Environment Health
        </Text>
        
        {environments.map((env, index) => (
          <Animated.View
            key={env.id}
            animation="fadeInLeft"
            delay={index * 100}
            style={styles.envHealthRow}
          >
            <View style={styles.envInfo}>
              <Text style={[styles.envName, { color: theme.OnSurface }]}>
                {env.name}
              </Text>
              <Text style={[styles.envVersion, { color: theme.OnSurfaceVariant }]}>
                {env.version} • {env.uptime}% uptime
              </Text>
            </View>
            
            <View style={styles.envMetrics}>
              <Text style={[styles.envMetric, { color: theme.OnSurfaceVariant }]}>
                {env.performance.responseTime}ms
              </Text>
              <Text style={[styles.envMetric, { color: theme.OnSurfaceVariant }]}>
                {env.performance.cpuUsage}% CPU
              </Text>
            </View>
            
            <View style={[
              styles.envStatus,
              {
                backgroundColor: 
                  env.status === 'active' ? '#4CAF50' :
                  env.status === 'deploying' ? '#FF9800' :
                  env.status === 'failed' ? '#F44336' :
                  env.status === 'maintenance' ? '#2196F3' : '#9E9E9E'
              }
            ]}>
              <Text style={styles.envStatusText}>
                {env.status === 'active' ? '●' :
                 env.status === 'deploying' ? '⟳' :
                 env.status === 'failed' ? '✗' :
                 env.status === 'maintenance' ? '⚙' : '○'}
              </Text>
            </View>
          </Animated.View>
        ))}
      </Animated.View>

      {/* Launch Readiness */}
      <Animated.View entering={FadeInUp.delay(400)} style={[styles.readinessCard, { backgroundColor: theme.Surface }]}>
        <Text style={[styles.cardTitle, { color: theme.OnSurface }]}>
          Launch Readiness
        </Text>
        
        <View style={styles.readinessProgress}>
          <View style={styles.progressInfo}>
            <Text style={[styles.progressText, { color: theme.OnSurface }]}>
              {launchChecklist.filter(item => item.status === 'completed').length} of {launchChecklist.length} items completed
            </Text>
            <Text style={[styles.progressPercentage, { color: theme.primary }]}>
              {Math.round((launchChecklist.filter(item => item.status === 'completed').length / launchChecklist.length) * 100)}%
            </Text>
          </View>
          
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${(launchChecklist.filter(item => item.status === 'completed').length / launchChecklist.length) * 100}%`,
                  backgroundColor: theme.primary
                }
              ]}
            />
          </View>
        </View>
        
        <View style={styles.readinessCategories}>
          {['Technical', 'Business', 'Marketing', 'Support'].map(category => {
            const categoryItems = launchChecklist.filter(item => 
              item.category === category.toLowerCase()
            );
            const completed = categoryItems.filter(item => item.status === 'completed').length;
            const percentage = categoryItems.length > 0 ? (completed / categoryItems.length) * 100 : 0;
            
            return (
              <View key={category} style={styles.readinessCategory}>
                <Text style={[styles.categoryName, { color: theme.OnSurface }]}>
                  {category}
                </Text>
                <Text style={[
                  styles.categoryProgress,
                  { 
                    color: percentage >= 90 ? '#4CAF50' : 
                          percentage >= 70 ? '#FF9800' : '#F44336'
                  }
                ]}>
                  {Math.round(percentage)}%
                </Text>
              </View>
            );
          })}
        </View>
      </Animated.View>
    </View>
  );

  const renderEnvironments = () => (
    <View>
      <Text style={[styles.sectionTitle, { color: theme.OnBackground }]}>
        Deployment Environments
      </Text>
      
      {environments.map((environment, index) => (
        <Animated.View
          key={environment.id}
          animation="fadeInRight"
          delay={index * 100}
        >
          <TouchableOpacity
            style={[styles.environmentCard, { backgroundColor: theme.Surface }]}
            onPress={() => {
              setSelectedEnvironment(environment);
              setShowDeployModal(true);
            }}
          >
            <View style={styles.environmentHeader}>
              <View style={styles.environmentInfo}>
                <Text style={[styles.environmentName, { color: theme.OnSurface }]}>
                  {environment.name}
                </Text>
                <Text style={[styles.environmentType, { color: theme.OnSurfaceVariant }]}>
                  {environment.type.toUpperCase()} • {environment.version}
                </Text>
              </View>
              
              <View style={[
                styles.environmentStatus,
                {
                  backgroundColor: 
                    environment.status === 'active' ? '#4CAF50' :
                    environment.status === 'deploying' ? '#FF9800' :
                    environment.status === 'failed' ? '#F44336' :
                    environment.status === 'maintenance' ? '#2196F3' : '#9E9E9E'
                }
              ]}>
                <Text style={styles.environmentStatusText}>
                  {environment.status === 'active' ? '✓' :
                   environment.status === 'deploying' ? '⟳' :
                   environment.status === 'failed' ? '✗' :
                   environment.status === 'maintenance' ? '⚙' : '○'}
                </Text>
              </View>
            </View>
            
            <View style={styles.performanceMetrics}>
              <View style={styles.performanceMetric}>
                <Text style={[styles.performanceValue, { color: theme.primary }]}>
                  {environment.performance.responseTime}ms
                </Text>
                <Text style={[styles.performanceLabel, { color: theme.OnSurfaceVariant }]}>
                  Response
                </Text>
              </View>
              
              <View style={styles.performanceMetric}>
                <Text style={[styles.performanceValue, { color: theme.primary }]}>
                  {environment.performance.cpuUsage}%
                </Text>
                <Text style={[styles.performanceLabel, { color: theme.OnSurfaceVariant }]}>
                  CPU
                </Text>
              </View>
              
              <View style={styles.performanceMetric}>
                <Text style={[styles.performanceValue, { color: theme.primary }]}>
                  {environment.performance.memoryUsage}%
                </Text>
                <Text style={[styles.performanceLabel, { color: theme.OnSurfaceVariant }]}>
                  Memory
                </Text>
              </View>
              
              <View style={styles.performanceMetric}>
                <Text style={[styles.performanceValue, { color: theme.primary }]}>
                  {environment.uptime}%
                </Text>
                <Text style={[styles.performanceLabel, { color: theme.OnSurfaceVariant }]}>
                  Uptime
                </Text>
              </View>
            </View>
            
            <View style={styles.resourceInfo}>
              <Text style={[styles.resourceText, { color: theme.OnSurfaceVariant }]}>
                {environment.resources.instances} instances • {environment.resources.databases} DBs • {environment.resources.storageGB}GB storage
              </Text>
            </View>
            
            <View style={styles.environmentActions}>
              <TouchableOpacity
                style={[styles.deployButton, { backgroundColor: theme.primaryContainer }]}
                onPress={() => handleDeploy(environment)}
                disabled={environment.status === 'deploying'}
              >
                <Text style={[styles.deployButtonText, { color: theme.OnPrimaryContainer }]}>
                  {environment.status === 'deploying' ? 'Deploying...' : 'Deploy'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.manageButton, { backgroundColor: theme.secondaryContainer }]}
                onPress={() => Alert.alert('Management', `Managing ${environment.name} environment...`)}
              >
                <Text style={[styles.manageButtonText, { color: theme.OnSecondaryContainer }]}>
                  Manage
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Animated.View>
      ))}
    </View>
  );

  const renderLaunch = () => (
    <View>
      <View style={styles.launchHeader}>
        <Text style={[styles.sectionTitle, { color: theme.OnBackground }]}>
          Launch Checklist
        </Text>
        <TouchableOpacity
          style={[styles.addItemButton, { backgroundColor: theme.primary }]}
          onPress={() => Alert.alert('Add Item', 'Add new checklist item interface coming soon.')}
        >
          <Text style={[styles.addItemButtonText, { color: theme.OnPrimary }]}>
            Add Item
          </Text>
        </TouchableOpacity>
      </View>

      {launchChecklist.map((item, index) => (
        <Animated.View
          key={item.id}
          animation="fadeInLeft"
          delay={index * 50}
          style={[styles.checklistCard, { backgroundColor: theme.Surface }]}
        >
          <View style={styles.checklistHeader}>
            <TouchableOpacity
              style={[
                styles.checkbox,
                {
                  backgroundColor: item.status === 'completed' ? theme.primary : 'transparent',
                  borderColor: item.status === 'completed' ? theme.primary : theme.Outline,
                }
              ]}
              onPress={() => {
                setLaunchChecklist(prev => prev.map(checkItem => 
                  checkItem.id === item.id 
                    ? { ...checkItem, status: checkItem.status === 'completed' ? 'pending' : 'completed' }
                    : checkItem
                ));
              }}
            >
              {item.status === 'completed' && (
                <Text style={[styles.checkmark, { color: theme.OnPrimary }]}>✓</Text>
              )}
            </TouchableOpacity>
            
            <View style={styles.checklistInfo}>
              <Text style={[
                styles.checklistItem,
                { 
                  color: theme.OnSurface,
                  textDecorationLine: item.status === 'completed' ? 'line-through' : 'none',
                  opacity: item.status === 'completed' ? 0.7 : 1,
                }
              ]}>
                {item.item}
              </Text>
              <Text style={[styles.checklistDescription, { color: theme.OnSurfaceVariant }]}>
                {item.description}
              </Text>
            </View>
            
            <View style={[
              styles.priorityIndicator,
              {
                backgroundColor: 
                  item.priority === 'critical' ? '#F44336' :
                  item.priority === 'high' ? '#FF9800' :
                  item.priority === 'medium' ? '#2196F3' : '#4CAF50'
              }
            ]}>
              <Text style={styles.priorityText}>
                {item.priority === 'critical' ? '!!!' :
                 item.priority === 'high' ? '!!' :
                 item.priority === 'medium' ? '!' : '○'}
              </Text>
            </View>
          </View>
          
          <View style={styles.checklistMeta}>
            <View style={[styles.categoryTag, { backgroundColor: theme.primaryContainer }]}>
              <Text style={[styles.categoryTagText, { color: theme.OnPrimaryContainer }]}>
                {item.category}
              </Text>
            </View>
            
            <Text style={[styles.assignee, { color: theme.OnSurfaceVariant }]}>
              {item.assignee}
            </Text>
            
            <Text style={[styles.dueDate, { color: theme.OnSurfaceVariant }]}>
              Due: {item.dueDate.toLocaleDateString()}
            </Text>
          </View>
        </Animated.View>
      ))}
    </View>
  );

  const renderMonitoring = () => (
    <View>
      <Text style={[styles.sectionTitle, { color: theme.OnBackground }]}>
        System Monitoring
      </Text>
      
      {monitoringAlerts.slice(0, 10).map((alert, index) => (
        <Animated.View
          key={alert.id}
          entering={FadeInUp.delay(index * 50)}
          style={[styles.alertCard, { backgroundColor: theme.Surface }]}
        >
          <View style={styles.alertHeader}>
            <View style={[
              styles.alertIcon,
              {
                backgroundColor: 
                  alert.severity === 'critical' ? '#F44336' :
                  alert.severity === 'high' ? '#FF9800' :
                  alert.severity === 'medium' ? '#2196F3' : '#4CAF50'
              }
            ]}>
              <Text style={styles.alertIconText}>
                {alert.type === 'error' ? '✗' :
                 alert.type === 'warning' ? '⚠' : 'ℹ'}
              </Text>
            </View>
            
            <View style={styles.alertInfo}>
              <Text style={[styles.alertTitle, { color: theme.OnSurface }]}>
                {alert.title}
              </Text>
              <Text style={[styles.alertDescription, { color: theme.OnSurfaceVariant }]}>
                {alert.description}
              </Text>
            </View>
            
            <View style={styles.alertMeta}>
              <Text style={[styles.alertTime, { color: theme.OnSurfaceVariant }]}>
                {alert.timestamp.toLocaleTimeString()}
              </Text>
              <View style={[
                styles.alertStatus,
                {
                  backgroundColor: 
                    alert.status === 'resolved' ? '#4CAF50' :
                    alert.status === 'acknowledged' ? '#FF9800' : '#F44336'
                }
              ]}>
                <Text style={styles.alertStatusText}>
                  {alert.status.toUpperCase()}
                </Text>
              </View>
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
            Production Deployment & Launch
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.OnSurfaceVariant }]}>
            Complete deployment management and launch preparation
          </Text>
        </View>

        <View style={styles.headerActions}>
          <Switch
            value={maintenanceMode}
            onValueChange={setMaintenanceMode}
            trackColor={{ false: theme.Outline, true: theme.error }}
          />
        </View>
      </View>

      <View style={styles.tabContainer}>
        {['overview', 'environments', 'pipeline', 'monitoring', 'launch'].map(tab => (
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
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
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
        {selectedTab === 'environments' && renderEnvironments()}
        {selectedTab === 'monitoring' && renderMonitoring()}
        {selectedTab === 'launch' && renderLaunch()}
        
        {selectedTab === 'pipeline' && (
          <View>
            <Text style={[styles.sectionTitle, { color: theme.OnBackground }]}>
              Deployment Pipeline
            </Text>
            <Text style={[styles.comingSoon, { color: theme.OnSurfaceVariant }]}>
              Advanced deployment pipeline interface coming soon...
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Environment Detail Modal */}
      <Modal
        visible={showDeployModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.Surface }]}>
            <Text style={[styles.modalTitle, { color: theme.OnSurface }]}>
              {selectedEnvironment?.name}
            </Text>
            <TouchableOpacity onPress={() => setShowDeployModal(false)}>
              <Text style={[styles.modalCloseButton, { color: theme.primary }]}>
                Done
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {selectedEnvironment && (
              <View>
                <Text style={[styles.modalDescription, { color: theme.OnBackground }]}>
                  Environment Details: {selectedEnvironment.type.toUpperCase()}
                </Text>
                
                <View style={styles.modalSection}>
                  <Text style={[styles.modalSectionTitle, { color: theme.OnBackground }]}>
                    Performance Metrics
                  </Text>
                  <Text style={[styles.modalDetail, { color: theme.OnSurfaceVariant }]}>
                    Response Time: {selectedEnvironment.performance.responseTime}ms
                  </Text>
                  <Text style={[styles.modalDetail, { color: theme.OnSurfaceVariant }]}>
                    CPU Usage: {selectedEnvironment.performance.cpuUsage}%
                  </Text>
                  <Text style={[styles.modalDetail, { color: theme.OnSurfaceVariant }]}>
                    Memory Usage: {selectedEnvironment.performance.memoryUsage}%
                  </Text>
                  <Text style={[styles.modalDetail, { color: theme.OnSurfaceVariant }]}>
                    Uptime: {selectedEnvironment.uptime}%
                  </Text>
                </View>
                
                <View style={styles.modalSection}>
                  <Text style={[styles.modalSectionTitle, { color: theme.OnBackground }]}>
                    Resources
                  </Text>
                  <Text style={[styles.modalDetail, { color: theme.OnSurfaceVariant }]}>
                    Instances: {selectedEnvironment.resources.instances}
                  </Text>
                  <Text style={[styles.modalDetail, { color: theme.OnSurfaceVariant }]}>
                    Load Balancers: {selectedEnvironment.resources.loadBalancers}
                  </Text>
                  <Text style={[styles.modalDetail, { color: theme.OnSurfaceVariant }]}>
                    Databases: {selectedEnvironment.resources.databases}
                  </Text>
                  <Text style={[styles.modalDetail, { color: theme.OnSurfaceVariant }]}>
                    Storage: {selectedEnvironment.resources.storageGB}GB
                  </Text>
                </View>
                
                <TouchableOpacity
                  style={[styles.modalActionButton, { backgroundColor: theme.primary }]}
                  onPress={() => {
                    setShowDeployModal(false);
                    handleDeploy(selectedEnvironment);
                  }}
                  disabled={selectedEnvironment.status === 'deploying'}
                >
                  <Text style={[styles.modalActionButtonText, { color: theme.OnPrimary }]}>
                    {selectedEnvironment.status === 'deploying' ? 'Deploying...' : 'Deploy to This Environment'}
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
function generateEnvironments(): DeploymentEnvironment[] {
  return [
    {
      id: '1',
      name: 'Production',
      type: 'production',
      status: 'active',
      url: 'https://app.manushi.com',
      version: 'v2.1.0',
      lastDeployment: new Date(2025, 8, 5),
      uptime: 99.97,
      performance: {
        responseTime: 145,
        throughput: 1247,
        errorRate: 0.02,
        cpuUsage: 32,
        memoryUsage: 68,
        diskUsage: 45,
      },
      resources: {
        instances: 8,
        loadBalancers: 2,
        databases: 3,
        cacheNodes: 4,
        storageGB: 2048,
        bandwidth: 1000,
      },
      healthChecks: [],
    },
    {
      id: '2',
      name: 'Staging',
      type: 'staging',
      status: 'active',
      url: 'https://staging.manushi.com',
      version: 'v2.2.0-beta',
      lastDeployment: new Date(2025, 8, 7),
      uptime: 98.5,
      performance: {
        responseTime: 187,
        throughput: 423,
        errorRate: 0.15,
        cpuUsage: 28,
        memoryUsage: 52,
        diskUsage: 38,
      },
      resources: {
        instances: 4,
        loadBalancers: 1,
        databases: 2,
        cacheNodes: 2,
        storageGB: 512,
        bandwidth: 500,
      },
      healthChecks: [],
    },
    {
      id: '3',
      name: 'Development',
      type: 'development',
      status: 'active',
      url: 'https://dev.manushi.com',
      version: 'v2.3.0-dev',
      lastDeployment: new Date(2025, 8, 7),
      uptime: 95.2,
      performance: {
        responseTime: 256,
        throughput: 156,
        errorRate: 1.2,
        cpuUsage: 45,
        memoryUsage: 71,
        diskUsage: 62,
      },
      resources: {
        instances: 2,
        loadBalancers: 1,
        databases: 1,
        cacheNodes: 1,
        storageGB: 256,
        bandwidth: 200,
      },
      healthChecks: [],
    },
  ];
}

function generatePipelines(): DeploymentPipeline[] {
  return [
    {
      id: '1',
      name: 'Production Release Pipeline',
      stages: [
        { id: '1', name: 'Build', status: 'completed' },
        { id: '2', name: 'Test', status: 'completed' },
        { id: '3', name: 'Security Scan', status: 'completed' },
        { id: '4', name: 'Deploy to Staging', status: 'completed' },
        { id: '5', name: 'Integration Tests', status: 'running' },
        { id: '6', name: 'Deploy to Production', status: 'pending' },
      ],
      status: 'running',
      currentStage: 4,
      progress: 75,
      startTime: new Date(),
      triggeredBy: 'admin',
    },
  ];
}

function generateLaunchChecklist(): LaunchChecklist[] {
  return [
    {
      id: '1',
      category: 'technical',
      item: 'Production environment setup complete',
      description: 'All production infrastructure configured and tested',
      status: 'completed',
      priority: 'critical',
      assignee: 'DevOps Team',
      dueDate: new Date(2025, 8, 10),
      dependencies: [],
    },
    {
      id: '2',
      category: 'technical',
      item: 'Database migration tested',
      description: 'Production database migration scripts tested and verified',
      status: 'completed',
      priority: 'critical',
      assignee: 'Database Team',
      dueDate: new Date(2025, 8, 10),
      dependencies: [],
    },
    {
      id: '3',
      category: 'technical',
      item: 'CDN configuration active',
      description: 'Content delivery network configured for global performance',
      status: 'completed',
      priority: 'high',
      assignee: 'Infrastructure Team',
      dueDate: new Date(2025, 8, 12),
      dependencies: [],
    },
    {
      id: '4',
      category: 'technical',
      item: 'Monitoring systems active',
      description: 'All monitoring and alerting systems configured and tested',
      status: 'completed',
      priority: 'critical',
      assignee: 'DevOps Team',
      dueDate: new Date(2025, 8, 12),
      dependencies: [],
    },
    {
      id: '5',
      category: 'business',
      item: 'User onboarding materials ready',
      description: 'All user training and onboarding materials completed',
      status: 'in_progress',
      priority: 'high',
      assignee: 'Content Team',
      dueDate: new Date(2025, 8, 15),
      dependencies: [],
    },
    {
      id: '6',
      category: 'marketing',
      item: 'Marketing campaign ready',
      description: 'Launch marketing campaign prepared and scheduled',
      status: 'pending',
      priority: 'medium',
      assignee: 'Marketing Team',
      dueDate: new Date(2025, 8, 20),
      dependencies: [],
    },
    {
      id: '7',
      category: 'support',
      item: 'Support team trained',
      description: 'Customer support team trained on all new features',
      status: 'completed',
      priority: 'high',
      assignee: 'Support Manager',
      dueDate: new Date(2025, 8, 15),
      dependencies: [],
    },
    {
      id: '8',
      category: 'legal',
      item: 'Legal compliance review',
      description: 'Legal team review of terms, privacy policy, and compliance',
      status: 'completed',
      priority: 'critical',
      assignee: 'Legal Team',
      dueDate: new Date(2025, 8, 10),
      dependencies: [],
    },
  ];
}

function generateMonitoringAlerts(): MonitoringAlert[] {
  return [
    {
      id: '1',
      type: 'warning',
      severity: 'medium',
      title: 'High Memory Usage',
      description: 'Production server memory usage above 80%',
      source: 'Infrastructure Monitoring',
      timestamp: new Date(Date.now() - 300000),
      status: 'active',
    },
    {
      id: '2',
      type: 'info',
      severity: 'low',
      title: 'Deployment Completed',
      description: 'Staging environment deployment completed successfully',
      source: 'CI/CD Pipeline',
      timestamp: new Date(Date.now() - 600000),
      status: 'resolved',
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
  headerActions: {
    alignItems: 'center',
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
  overallStatus: {
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.XS,
    borderRadius: 16,
  },
  overallStatusText: {
    color: 'white',
    fontSize: Typography.bodySmall.fontSize,
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
    textAlign: 'center',
  },
  quickActions: {
    marginTop: Spacing.MD,
  },
  launchButton: {
    paddingVertical: Spacing.MD,
    borderRadius: 8,
    alignItems: 'center',
  },
  launchButtonText: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: 'bold',
  },
  healthCard: {
    padding: Spacing.MD,
    borderRadius: 12,
    marginBottom: Spacing.MD,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  envHealthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.SM,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  envInfo: {
    flex: 1,
  },
  envName: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '600',
    marginBottom: 2,
  },
  envVersion: {
    fontSize: Typography.bodySmall.fontSize,
  },
  envMetrics: {
    flexDirection: 'row',
    gap: Spacing.MD,
  },
  envMetric: {
    fontSize: Typography.bodySmall.fontSize,
  },
  envStatus: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.MD,
  },
  envStatusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  readinessCard: {
    padding: Spacing.MD,
    borderRadius: 12,
    marginBottom: Spacing.MD,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  readinessProgress: {
    marginBottom: Spacing.MD,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  progressText: {
    fontSize: Typography.bodyMedium.fontSize,
  },
  progressPercentage: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  readinessCategories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.MD,
  },
  readinessCategory: {
    alignItems: 'center',
    minWidth: 80,
  },
  categoryName: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryProgress: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
  },
  environmentCard: {
    padding: Spacing.MD,
    borderRadius: 12,
    marginBottom: Spacing.MD,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  environmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  environmentInfo: {
    flex: 1,
  },
  environmentName: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
    marginBottom: 2,
  },
  environmentType: {
    fontSize: Typography.bodySmall.fontSize,
  },
  environmentStatus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  environmentStatusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  performanceMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.MD,
  },
  performanceMetric: {
    alignItems: 'center',
  },
  performanceValue: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '600',
  },
  performanceLabel: {
    fontSize: Typography.bodySmall.fontSize,
    marginTop: 2,
  },
  resourceInfo: {
    marginBottom: Spacing.MD,
  },
  resourceText: {
    fontSize: Typography.bodySmall.fontSize,
  },
  environmentActions: {
    flexDirection: 'row',
    gap: Spacing.SM,
  },
  deployButton: {
    flex: 1,
    paddingVertical: Spacing.SM,
    borderRadius: 6,
    alignItems: 'center',
  },
  deployButtonText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
  manageButton: {
    flex: 1,
    paddingVertical: Spacing.SM,
    borderRadius: 6,
    alignItems: 'center',
  },
  manageButtonText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
  launchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  addItemButton: {
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: 8,
  },
  addItemButtonText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
  checklistCard: {
    padding: Spacing.MD,
    borderRadius: 12,
    marginBottom: Spacing.SM,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  checklistHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.SM,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.SM,
  },
  checkmark: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  checklistInfo: {
    flex: 1,
    marginRight: Spacing.SM,
  },
  checklistItem: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '600',
    marginBottom: 4,
  },
  checklistDescription: {
    fontSize: Typography.bodyMedium.fontSize,
  },
  priorityIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  checklistMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.MD,
  },
  categoryTag: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryTagText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  assignee: {
    fontSize: Typography.bodySmall.fontSize,
  },
  dueDate: {
    fontSize: Typography.bodySmall.fontSize,
  },
  alertCard: {
    padding: Spacing.MD,
    borderRadius: 12,
    marginBottom: Spacing.SM,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.MD,
  },
  alertIconText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  alertInfo: {
    flex: 1,
    marginRight: Spacing.MD,
  },
  alertTitle: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '600',
    marginBottom: 2,
  },
  alertDescription: {
    fontSize: Typography.bodyMedium.fontSize,
  },
  alertMeta: {
    alignItems: 'flex-end',
  },
  alertTime: {
    fontSize: Typography.bodySmall.fontSize,
    marginBottom: 4,
  },
  alertStatus: {
    paddingHorizontal: Spacing.XS,
    paddingVertical: 2,
    borderRadius: 8,
  },
  alertStatusText: {
    color: 'white',
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: 'bold',
  },
  comingSoon: {
    fontSize: Typography.bodyLarge.fontSize,
    textAlign: 'center',
    marginTop: Spacing.XL,
    fontStyle: 'italic',
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
  modalDetail: {
    fontSize: Typography.bodyMedium.fontSize,
    marginBottom: 4,
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

export default ProductionDeploymentLaunchScreen;