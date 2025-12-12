import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
  SafeAreaView,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

interface StrategicGoal {
  id: string;
  title: string;
  category: 'growth' | 'efficiency' | 'innovation' | 'quality' | 'financial';
  status: 'planning' | 'active' | 'on_track' | 'at_risk' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  progress: number;
  targetDate: string;
  owner: string;
  description: string;
  kpis: KPI[];
  milestones: Milestone[];
}

interface KPI {
  id: string;
  name: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
}

interface Milestone {
  id: string;
  title: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  progress: number;
}

interface GrowthMetrics {
  studentEnrollment: { current: number; target: number; growth: number };
  revenueGrowth: { current: number; target: number; percentage: number };
  marketShare: { current: number; target: number; trend: string };
  customerSatisfaction: { score: number; target: number; trend: string };
}

interface Scenario {
  id: string;
  name: string;
  description: string;
  probability: number;
  impact: 'low' | 'medium' | 'high';
  strategies: string[];
  estimatedOutcome: {
    revenue: number;
    growth: number;
    timeline: string;
  };
}

interface StrategicPlanningScreenProps {
  onNavigate: (screen: string) => void;
}

export default function StrategicPlanningScreen({ onNavigate }: StrategicPlanningScreenProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'goals' | 'scenarios' | 'analytics'>('overview');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [strategicGoals, setStrategicGoals] = useState<StrategicGoal[]>([]);
  const [growthMetrics, setGrowthMetrics] = useState<GrowthMetrics>({
    studentEnrollment: { current: 0, target: 0, growth: 0 },
    revenueGrowth: { current: 0, target: 0, percentage: 0 },
    marketShare: { current: 0, target: 0, trend: 'stable' },
    customerSatisfaction: { score: 0, target: 0, trend: 'stable' }
  });
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStrategicData();
    
    if (autoRefresh) {
      const interval = setInterval(loadStrategicData, 60000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadStrategicData = async () => {
    try {
      setLoading(true);
      
      const mockGoals: StrategicGoal[] = [
        {
          id: 'SG001',
          title: 'Expand Student Base by 40%',
          category: 'growth',
          status: 'active',
          priority: 'high',
          progress: 68,
          targetDate: '2025-12-31',
          owner: 'Marketing Team',
          description: 'Increase student enrollment through digital marketing and referral programs',
          kpis: [
            { id: 'KPI001', name: 'New Enrollments', currentValue: 340, targetValue: 500, unit: 'students', trend: 'up' },
            { id: 'KPI002', name: 'Conversion Rate', currentValue: 15.2, targetValue: 20, unit: '%', trend: 'up' }
          ],
          milestones: [
            { id: 'M001', title: 'Launch Digital Campaign', dueDate: '2025-09-15', status: 'completed', progress: 100 },
            { id: 'M002', title: 'Implement Referral Program', dueDate: '2025-10-01', status: 'in_progress', progress: 75 },
            { id: 'M003', title: 'Achieve 400 Enrollments', dueDate: '2025-11-30', status: 'pending', progress: 0 }
          ]
        },
        {
          id: 'SG002',
          title: 'Improve Teaching Quality Score',
          category: 'quality',
          status: 'on_track',
          priority: 'critical',
          progress: 82,
          targetDate: '2025-10-31',
          owner: 'Academic Director',
          description: 'Enhance teaching methods and student satisfaction through continuous training',
          kpis: [
            { id: 'KPI003', name: 'Teaching Quality Score', currentValue: 4.1, targetValue: 4.5, unit: '/5', trend: 'up' },
            { id: 'KPI004', name: 'Student Satisfaction', currentValue: 87, targetValue: 90, unit: '%', trend: 'up' }
          ],
          milestones: [
            { id: 'M004', title: 'Teacher Training Program', dueDate: '2025-09-10', status: 'completed', progress: 100 },
            { id: 'M005', title: 'Implement Quality Framework', dueDate: '2025-10-15', status: 'in_progress', progress: 60 },
            { id: 'M006', title: 'Achieve Quality Score', dueDate: '2025-10-31', status: 'pending', progress: 0 }
          ]
        },
        {
          id: 'SG003',
          title: 'Technology Infrastructure Upgrade',
          category: 'innovation',
          status: 'at_risk',
          priority: 'high',
          progress: 45,
          targetDate: '2025-11-15',
          owner: 'IT Department',
          description: 'Modernize learning platform and implement AI-powered features',
          kpis: [
            { id: 'KPI005', name: 'Platform Uptime', currentValue: 98.2, targetValue: 99.5, unit: '%', trend: 'stable' },
            { id: 'KPI006', name: 'User Experience Score', currentValue: 7.8, targetValue: 9.0, unit: '/10', trend: 'up' }
          ],
          milestones: [
            { id: 'M007', title: 'Server Infrastructure Setup', dueDate: '2025-09-30', status: 'overdue', progress: 80 },
            { id: 'M008', title: 'AI Feature Development', dueDate: '2025-10-20', status: 'in_progress', progress: 30 },
            { id: 'M009', title: 'User Testing & Rollout', dueDate: '2025-11-15', status: 'pending', progress: 0 }
          ]
        },
        {
          id: 'SG004',
          title: 'Financial Sustainability Plan',
          category: 'financial',
          status: 'planning',
          priority: 'medium',
          progress: 25,
          targetDate: '2026-03-31',
          owner: 'Finance Team',
          description: 'Diversify revenue streams and optimize operational costs',
          kpis: [
            { id: 'KPI007', name: 'Revenue Growth', currentValue: 12.5, targetValue: 25, unit: '%', trend: 'up' },
            { id: 'KPI008', name: 'Cost Efficiency', currentValue: 78, targetValue: 85, unit: '%', trend: 'stable' }
          ],
          milestones: [
            { id: 'M010', title: 'Cost Analysis Report', dueDate: '2025-09-30', status: 'in_progress', progress: 70 },
            { id: 'M011', title: 'New Revenue Streams', dueDate: '2025-12-31', status: 'pending', progress: 0 },
            { id: 'M012', title: 'Financial Optimization', dueDate: '2026-03-31', status: 'pending', progress: 0 }
          ]
        }
      ];

      const mockMetrics: GrowthMetrics = {
        studentEnrollment: { current: 1240, target: 1750, growth: 15.2 },
        revenueGrowth: { current: 425000, target: 650000, percentage: 18.5 },
        marketShare: { current: 12.8, target: 18.0, trend: 'up' },
        customerSatisfaction: { score: 4.2, target: 4.5, trend: 'up' }
      };

      const mockScenarios: Scenario[] = [
        {
          id: 'SC001',
          name: 'Aggressive Expansion',
          description: 'Rapid scaling with significant investment in marketing and infrastructure',
          probability: 30,
          impact: 'high',
          strategies: ['Digital marketing campaign', 'New branch locations', 'Premium course offerings'],
          estimatedOutcome: {
            revenue: 850000,
            growth: 45,
            timeline: '12 months'
          }
        },
        {
          id: 'SC002',
          name: 'Steady Growth',
          description: 'Moderate expansion focusing on quality and sustainable growth',
          probability: 60,
          impact: 'medium',
          strategies: ['Organic growth', 'Quality improvements', 'Referral programs'],
          estimatedOutcome: {
            revenue: 650000,
            growth: 25,
            timeline: '18 months'
          }
        },
        {
          id: 'SC003',
          name: 'Conservative Approach',
          description: 'Focus on optimization and maintaining current market position',
          probability: 10,
          impact: 'low',
          strategies: ['Cost optimization', 'Process improvements', 'Technology upgrades'],
          estimatedOutcome: {
            revenue: 480000,
            growth: 12,
            timeline: '24 months'
          }
        }
      ];

      setStrategicGoals(mockGoals);
      setGrowthMetrics(mockMetrics);
      setScenarios(mockScenarios);
      
    } catch (error) {
      console.error('Error loading strategic data:', error);
      Alert.alert('error', 'Failed to load strategic planning data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = () => {
    Alert.alert('Create Goal', 'Strategic goal creation dialog would open here.');
  };

  const handleRunScenario = (scenarioId: string) => {
    Alert.alert('Run Scenario', `Running scenario analysis for ${scenarioId}`);
  };

  const handleBackNavigation = () => {
    onNavigate('back');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'on_track': return '#8BC34A';
      case 'active': return '#2196F3';
      case 'at_risk': return '#FF9800';
      case 'planning': return '#9C27B0';
      case 'overdue': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#D32F2F';
      case 'high': return '#F57C00';
      case 'medium': return '#FBC02D';
      case 'low': return '#388E3C';
      default: return '#9E9E9E';
    }
  };

  const renderOverview = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{growthMetrics.studentEnrollment.current}</Text>
          <Text style={styles.metricLabel}>Current Students</Text>
          <Text style={styles.metricSubtext}>Target: {growthMetrics.studentEnrollment.target}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>${(growthMetrics.revenueGrowth.current / 1000).toFixed(0)}K</Text>
          <Text style={styles.metricLabel}>Monthly Revenue</Text>
          <Text style={styles.metricSubtext}>+{growthMetrics.revenueGrowth.percentage}% growth</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{growthMetrics.marketShare.current}%</Text>
          <Text style={styles.metricLabel}>Market Share</Text>
          <Text style={styles.metricSubtext}>Target: {growthMetrics.marketShare.target}%</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{growthMetrics.customerSatisfaction.score}/5</Text>
          <Text style={styles.metricLabel}>Satisfaction</Text>
          <Text style={styles.metricSubtext}>Target: {growthMetrics.customerSatisfaction.target}/5</Text>
        </View>
      </View>

      <View style={styles.goalsSummary}>
        <Text style={styles.sectionTitle}>Strategic Goals Summary</Text>
        <View style={styles.goalsGrid}>
          {['active', 'on_track', 'at_risk', 'completed'].map((status) => {
            const count = strategicGoals.filter(goal => goal.status === status).length;
            return (
              <View key={status} style={styles.goalSummaryCard}>
                <Text style={[styles.goalCount, { color: getStatusColor(status) }]}>{count}</Text>
                <Text style={styles.goalStatus}>{status.replace('_', ' ').toUpperCase()}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Strategic Actions</Text>
        <TouchableOpacity style={styles.quickActionButton} onPress={() => Alert.alert('Generate Report', 'Strategic planning report generation started')}>
          <Text style={styles.quickActionText}>📊 Generate Strategic Report</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionButton} onPress={() => Alert.alert('SWOT Analysis', 'SWOT analysis tool would open')}>
          <Text style={styles.quickActionText}>🎯 Run SWOT Analysis</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionButton} onPress={() => Alert.alert('Scenario Planning', 'Scenario planning interface would open')}>
          <Text style={styles.quickActionText}>🔮 Scenario Planning Workshop</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderGoals = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.goalsHeader}>
        <Text style={styles.sectionTitle}>Strategic Goals</Text>
        <TouchableOpacity style={styles.createGoalButton} onPress={handleCreateGoal}>
          <Text style={styles.createGoalText}>+ New Goal</Text>
        </TouchableOpacity>
      </View>
      
      {strategicGoals.map((goal) => (
        <View key={goal.id} style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <Text style={styles.goalTitle}>{goal.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(goal.status) }]}>
              <Text style={styles.statusText}>{goal.status.replace('_', ' ')}</Text>
            </View>
          </View>
          
          <View style={styles.goalMeta}>
            <Text style={styles.goalCategory}>📂 {goal.category.toUpperCase()}</Text>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(goal.priority) }]}>
              <Text style={styles.priorityText}>{goal.priority.toUpperCase()}</Text>
            </View>
            <Text style={styles.goalOwner}>👤 {goal.owner}</Text>
          </View>

          <Text style={styles.goalDescription}>{goal.description}</Text>

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={styles.progressText}>{goal.progress}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${goal.progress}%` }]} />
            </View>
          </View>

          <View style={styles.kpisSection}>
            <Text style={styles.kpisTitle}>Key Performance Indicators</Text>
            {goal.kpis.map((kpi) => (
              <View key={kpi.id} style={styles.kpiItem}>
                <Text style={styles.kpiName}>{kpi.name}</Text>
                <View style={styles.kpiValue}>
                  <Text style={styles.kpiCurrent}>{kpi.currentValue}{kpi.unit}</Text>
                  <Text style={styles.kpiTarget}>/ {kpi.targetValue}{kpi.unit}</Text>
                  <Text style={[styles.kpiTrend, { color: kpi.trend === 'up' ? '#4CAF50' : kpi.trend === 'down' ? '#F44336' : '#9E9E9E' }]}>
                    {kpi.trend === 'up' ? '↗️' : kpi.trend === 'down' ? '↘️' : '➡️'}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <Text style={styles.targetDate}>🎯 Target: {goal.targetDate}</Text>
        </View>
      ))}
    </ScrollView>
  );

  const renderScenarios = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Strategic Scenarios</Text>
      {scenarios.map((scenario) => (
        <View key={scenario.id} style={styles.scenarioCard}>
          <View style={styles.scenarioHeader}>
            <Text style={styles.scenarioName}>{scenario.name}</Text>
            <Text style={styles.scenarioProbability}>{scenario.probability}%</Text>
          </View>
          
          <Text style={styles.scenarioDescription}>{scenario.description}</Text>
          
          <View style={styles.scenarioMeta}>
            <View style={[styles.impactBadge, { 
              backgroundColor: scenario.impact === 'high' ? '#F44336' : 
                             scenario.impact === 'medium' ? '#FF9800' : '#4CAF50' 
            }]}>
              <Text style={styles.impactText}>{scenario.impact.toUpperCase()} IMPACT</Text>
            </View>
          </View>

          <View style={styles.strategiesSection}>
            <Text style={styles.strategiesTitle}>Strategies:</Text>
            {scenario.strategies.map((strategy, index) => (
              <Text key={index} style={styles.strategyItem}>• {strategy}</Text>
            ))}
          </View>

          <View style={styles.outcomeSection}>
            <Text style={styles.outcomeTitle}>Estimated Outcome:</Text>
            <View style={styles.outcomeGrid}>
              <View style={styles.outcomeItem}>
                <Text style={styles.outcomeValue}>${(scenario.estimatedOutcome.revenue / 1000).toFixed(0)}K</Text>
                <Text style={styles.outcomeLabel}>Revenue</Text>
              </View>
              <View style={styles.outcomeItem}>
                <Text style={styles.outcomeValue}>{scenario.estimatedOutcome.growth}%</Text>
                <Text style={styles.outcomeLabel}>Growth</Text>
              </View>
              <View style={styles.outcomeItem}>
                <Text style={styles.outcomeValue}>{scenario.estimatedOutcome.timeline}</Text>
                <Text style={styles.outcomeLabel}>Timeline</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.runScenarioButton} 
            onPress={() => handleRunScenario(scenario.id)}
          >
            <Text style={styles.runScenarioText}>🔮 Run Scenario Analysis</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );

  const renderAnalytics = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Strategic Analytics</Text>
      
      <View style={styles.analyticsCard}>
        <Text style={styles.analyticsTitle}>Goal Achievement Rate</Text>
        <View style={styles.achievementGrid}>
          {['completed', 'on_track', 'at_risk', 'planning'].map((status) => {
            const count = strategicGoals.filter(goal => goal.status === status).length;
            const percentage = (count / strategicGoals.length) * 100;
            return (
              <View key={status} style={styles.achievementItem}>
                <View style={[styles.achievementBar, { height: percentage * 2 }]} />
                <Text style={styles.achievementLabel}>{status.replace('_', ' ')}</Text>
                <Text style={styles.achievementPercent}>{percentage.toFixed(0)}%</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.analyticsCard}>
        <Text style={styles.analyticsTitle}>Priority Distribution</Text>
        <View style={styles.priorityChart}>
          {['critical', 'high', 'medium', 'low'].map((priority) => {
            const count = strategicGoals.filter(goal => goal.priority === priority).length;
            return (
              <View key={priority} style={styles.priorityItem}>
                <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(priority) }]} />
                <Text style={styles.priorityLabel}>{priority}: {count}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.analyticsCard}>
        <Text style={styles.analyticsTitle}>Performance Trends</Text>
        <View style={styles.trendsContainer}>
          <Text style={styles.trendItem}>📈 Student Growth: +15.2% (Target: +25%)</Text>
          <Text style={styles.trendItem}>💰 Revenue Growth: +18.5% (Target: +30%)</Text>
          <Text style={styles.trendItem}>⭐ Quality Score: 4.1/5 (Target: 4.5/5)</Text>
          <Text style={styles.trendItem}>🎯 Goal Completion: 78% on track</Text>
        </View>
      </View>

      <View style={styles.recommendationsCard}>
        <Text style={styles.recommendationsTitle}>AI Recommendations</Text>
        <View style={styles.recommendation}>
          <Text style={styles.recommendationText}>🎯 Focus on Technology Infrastructure goal - it's at risk and critical for growth</Text>
        </View>
        <View style={styles.recommendation}>
          <Text style={styles.recommendationText}>📊 Consider running Aggressive Expansion scenario analysis for Q4 planning</Text>
        </View>
        <View style={styles.recommendation}>
          <Text style={styles.recommendationText}>⚡ Quality improvements showing strong ROI - increase investment</Text>
        </View>
      </View>
    </ScrollView>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading strategic planning data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackNavigation}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Strategic Planning</Text>
        <View style={styles.headerControls}>
          <Text style={styles.refreshLabel}>Auto Refresh</Text>
          <Switch
            value={autoRefresh}
            onValueChange={setAutoRefresh}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={autoRefresh ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.tabBar}>
        {[
          { key: 'overview', label: '📊 Overview' },
          { key: 'goals', label: '🎯 Goals' },
          { key: 'scenarios', label: '🔮 Scenarios' },
          { key: 'analytics', label: '📈 Analytics' }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.content}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'goals' && renderGoals()}
        {activeTab === 'scenarios' && renderScenarios()}
        {activeTab === 'analytics' && renderAnalytics()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#673AB7',
  },
  backButton: {
    marginRight: 12,
    padding: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshLabel: {
    color: '#FFFFFF',
    marginRight: 8,
    fontSize: 14,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#673AB7',
  },
  tabText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  activeTabText: {
    color: '#673AB7',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
    color: '#666',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#673AB7',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  metricSubtext: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  goalsSummary: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  goalsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  goalSummaryCard: {
    alignItems: 'center',
    flex: 1,
  },
  goalCount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  goalStatus: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  quickActions: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionButton: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    color: '#333',
  },
  goalsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  createGoalButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  createGoalText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  goalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalCategory: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  goalOwner: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  goalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  progressSection: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
  },
  progressText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#673AB7',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#673AB7',
    borderRadius: 4,
  },
  kpisSection: {
    marginBottom: 12,
  },
  kpisTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  kpiItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  kpiName: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  kpiValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kpiCurrent: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  kpiTarget: {
    fontSize: 12,
    color: '#666',
  },
  kpiTrend: {
    fontSize: 12,
    marginLeft: 4,
  },
  targetDate: {
    fontSize: 12,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 8,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  scenarioCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scenarioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scenarioName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  scenarioProbability: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#673AB7',
  },
  scenarioDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  scenarioMeta: {
    marginBottom: 12,
  },
  impactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  impactText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  strategiesSection: {
    marginBottom: 12,
  },
  strategiesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  strategyItem: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  outcomeSection: {
    marginBottom: 12,
  },
  outcomeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  outcomeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  outcomeItem: {
    alignItems: 'center',
    flex: 1,
  },
  outcomeValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#673AB7',
  },
  outcomeLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  runScenarioButton: {
    backgroundColor: '#673AB7',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  runScenarioText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  analyticsCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  analyticsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  achievementGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
  },
  achievementItem: {
    alignItems: 'center',
  },
  achievementBar: {
    width: 20,
    backgroundColor: '#673AB7',
    borderRadius: 2,
  },
  achievementLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  achievementPercent: {
    fontSize: 8,
    color: '#999',
  },
  priorityChart: {
    flexDirection: 'column',
  },
  priorityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  priorityLabel: {
    fontSize: 14,
    color: '#333',
  },
  trendsContainer: {
    flexDirection: 'column',
  },
  trendItem: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  recommendationsCard: {
    backgroundColor: '#E8F5E8',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2E7D32',
  },
  recommendation: {
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: '#2E7D32',
  },
});