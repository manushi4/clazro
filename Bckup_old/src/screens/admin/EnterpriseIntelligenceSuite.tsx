import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
  Modal,
  Alert,
  Switch,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LightTheme } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';

const { width } = Dimensions.get('window');

interface InstitutionMetrics {
  id: string;
  name: string;
  type: 'school' | 'college' | 'coaching-center' | 'university';
  totalStudents: number;
  totalTeachers: number;
  averagePerformance: number;
  retentionRate: number;
  satisfactionScore: number;
  revenueGrowth: number;
  geographicRegion: string;
  establishedYear: number;
  marketShare: number;
}

interface PredictiveAnalysis {
  id: string;
  type: 'enrollment' | 'retention' | 'performance' | 'revenue' | 'risk';
  title: string;
  description: string;
  prediction: number;
  confidence: number;
  timeframe: '1-month' | '3-months' | '6-months' | '1-year';
  factors: InfluencingFactor[];
  recommendations: string[];
  trendDirection: 'increasing' | 'decreasing' | 'stable';
  impactLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface InfluencingFactor {
  name: string;
  impact: number;
  category: 'internal' | 'external' | 'market' | 'seasonal';
}

interface CompetitiveAnalysis {
  institutionId: string;
  competitors: CompetitorData[];
  marketPosition: number;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  recommendations: StrategicRecommendation[];
}

interface CompetitorData {
  id: string;
  name: string;
  marketShare: number;
  studentCount: number;
  avgFees: number;
  rating: number;
  growthRate: number;
  keyStrengths: string[];
}

interface StrategicRecommendation {
  id: string;
  category: 'pricing' | 'marketing' | 'curriculum' | 'technology' | 'infrastructure';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedImpact: number;
  implementationCost: number;
  timeToImplement: number;
  roi: number;
}

interface BusinessIntelligenceKPI {
  id: string;
  name: string;
  category: 'financial' | 'academic' | 'operational' | 'strategic';
  currentValue: number;
  targetValue: number;
  unit: string;
  trend: number[];
  lastUpdated: Date;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  description: string;
}

interface DashboardWidget {
  id: string;
  title: string;
  type: 'chart' | 'metric' | 'table' | 'map' | 'gauge';
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
  config: any;
  dataSource: string;
  refreshRate: number;
  isCustomizable: boolean;
}

const EnterpriseIntelligenceSuite: React.FC<{
  adminId: string;
  onNavigate: (screen: string) => void;
}> = ({ adminId, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'predictive' | 'competitive' | 'kpis' | 'dashboards'>('overview');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1-month' | '3-months' | '6-months' | '1-year'>('3-months');
  const [selectedInstitution, setSelectedInstitution] = useState<InstitutionMetrics | null>(null);
  const [showCustomDashboard, setShowCustomDashboard] = useState(false);

  // Mock data
  const [institutionMetrics] = useState<InstitutionMetrics[]>([
    {
      id: '1',
      name: 'Manushi Coaching Center - Mumbai',
      type: 'coaching-center',
      totalStudents: 2450,
      totalTeachers: 89,
      averagePerformance: 87.5,
      retentionRate: 94.2,
      satisfactionScore: 4.7,
      revenueGrowth: 23.5,
      geographicRegion: 'Western India',
      establishedYear: 2015,
      marketShare: 12.8,
    },
    {
      id: '2',
      name: 'Excellence Academy - Delhi',
      type: 'coaching-center',
      totalStudents: 1890,
      totalTeachers: 67,
      averagePerformance: 85.2,
      retentionRate: 91.5,
      satisfactionScore: 4.5,
      revenueGrowth: 18.7,
      geographicRegion: 'Northern India',
      establishedYear: 2012,
      marketShare: 9.4,
    },
    {
      id: '3',
      name: 'Success Institute - Bangalore',
      type: 'coaching-center',
      totalStudents: 3200,
      totalTeachers: 112,
      averagePerformance: 89.1,
      retentionRate: 96.3,
      satisfactionScore: 4.8,
      revenueGrowth: 28.9,
      geographicRegion: 'Southern India',
      establishedYear: 2018,
      marketShare: 15.2,
    },
  ]);

  const [predictiveAnalyses] = useState<PredictiveAnalysis[]>([
    {
      id: '1',
      type: 'enrollment',
      title: 'Q1 2025 Enrollment Forecast',
      description: 'Predicted student enrollment for next quarter based on historical data and market trends',
      prediction: 2680,
      confidence: 92.5,
      timeframe: '3-months',
      factors: [
        { name: 'Seasonal Demand', impact: 35, category: 'seasonal' },
        { name: 'Marketing Campaigns', impact: 28, category: 'internal' },
        { name: 'Competitor Activity', impact: 22, category: 'external' },
        { name: 'Economic Conditions', impact: 15, category: 'market' },
      ],
      recommendations: [
        'Increase marketing budget by 20% to capitalize on high-confidence prediction',
        'Prepare additional capacity for 230 more students than current',
        'Focus on digital marketing channels showing highest ROI'
      ],
      trendDirection: 'increasing',
      impactLevel: 'high',
    },
    {
      id: '2',
      type: 'retention',
      title: 'Student Retention Risk Analysis',
      description: 'AI-powered analysis of students at risk of dropping out in the next 6 months',
      prediction: 5.8,
      confidence: 89.2,
      timeframe: '6-months',
      factors: [
        { name: 'Academic Performance', impact: 42, category: 'internal' },
        { name: 'Attendance Patterns', impact: 31, category: 'internal' },
        { name: 'Financial Stress', impact: 18, category: 'external' },
        { name: 'Satisfaction Scores', impact: 9, category: 'internal' },
      ],
      recommendations: [
        'Implement early intervention program for identified at-risk students',
        'Create flexible payment options to address financial concerns',
        'Enhance personalized mentoring for struggling students'
      ],
      trendDirection: 'decreasing',
      impactLevel: 'medium',
    },
    {
      id: '3',
      type: 'revenue',
      title: 'Annual Revenue Projection',
      description: 'Comprehensive revenue forecast incorporating all income streams and market factors',
      prediction: 12.5,
      confidence: 94.8,
      timeframe: '1-year',
      factors: [
        { name: 'Student Growth', impact: 38, category: 'internal' },
        { name: 'Fee Structure Optimization', impact: 29, category: 'internal' },
        { name: 'New Program Launches', impact: 23, category: 'internal' },
        { name: 'Market Expansion', impact: 10, category: 'external' },
      ],
      recommendations: [
        'Expand to 2 new locations to capture growing market demand',
        'Launch premium courses with 40% higher margins',
        'Invest in technology infrastructure to support scale'
      ],
      trendDirection: 'increasing',
      impactLevel: 'critical',
    },
  ]);

  const [businessKPIs] = useState<BusinessIntelligenceKPI[]>([
    {
      id: '1',
      name: 'Net Promoter Score (NPS)',
      category: 'strategic',
      currentValue: 73,
      targetValue: 80,
      unit: 'points',
      trend: [68, 69, 71, 72, 73],
      lastUpdated: new Date(),
      status: 'good',
      description: 'Customer satisfaction and loyalty metric based on likelihood to recommend',
    },
    {
      id: '2',
      name: 'Student Success Rate',
      category: 'academic',
      currentValue: 87.5,
      targetValue: 90,
      unit: '%',
      trend: [84.2, 85.1, 86.3, 87.1, 87.5],
      lastUpdated: new Date(),
      status: 'good',
      description: 'Percentage of students achieving their target exam scores',
    },
    {
      id: '3',
      name: 'Revenue Per Student',
      category: 'financial',
      currentValue: 45000,
      targetValue: 50000,
      unit: '₹',
      trend: [42000, 43200, 44100, 44800, 45000],
      lastUpdated: new Date(),
      status: 'warning',
      description: 'Average annual revenue generated per enrolled student',
    },
    {
      id: '4',
      name: 'Teacher Utilization Rate',
      category: 'operational',
      currentValue: 78.5,
      targetValue: 85,
      unit: '%',
      trend: [75.2, 76.8, 77.4, 78.1, 78.5],
      lastUpdated: new Date(),
      status: 'warning',
      description: 'Percentage of teacher time spent in productive teaching activities',
    },
  ]);

  const [competitiveAnalysis] = useState<CompetitiveAnalysis>({
    institutionId: '1',
    competitors: [
      {
        id: 'comp1',
        name: 'Elite Coaching Hub',
        marketShare: 15.8,
        studentCount: 2800,
        avgFees: 52000,
        rating: 4.6,
        growthRate: 19.5,
        keyStrengths: ['Premium Brand', 'High Success Rate', 'Modern Infrastructure'],
      },
      {
        id: 'comp2',
        name: 'Success Masters',
        marketShare: 11.2,
        studentCount: 2100,
        avgFees: 48000,
        rating: 4.4,
        growthRate: 16.8,
        keyStrengths: ['Experienced Faculty', 'Comprehensive Curriculum', 'Good Results'],
      },
      {
        id: 'comp3',
        name: 'Future Leaders Academy',
        marketShare: 8.9,
        studentCount: 1650,
        avgFees: 44000,
        rating: 4.3,
        growthRate: 22.1,
        keyStrengths: ['Innovative Teaching', 'Technology Integration', 'Flexible Timing'],
      },
    ],
    marketPosition: 2,
    strengths: ['AI-Powered Learning', 'Personalized Coaching', 'High Retention Rate', 'Modern Technology'],
    weaknesses: ['Higher Fees', 'Limited Locations', 'New Brand Recognition'],
    opportunities: ['Online Course Expansion', 'Tier-2 City Market', 'Corporate Training'],
    threats: ['Increased Competition', 'Economic Slowdown', 'Regulatory Changes'],
    recommendations: [
      {
        id: 'rec1',
        category: 'pricing',
        priority: 'high',
        title: 'Dynamic Pricing Strategy',
        description: 'Implement flexible pricing based on demand and student performance',
        expectedImpact: 15.5,
        implementationCost: 2500000,
        timeToImplement: 3,
        roi: 280,
      },
      {
        id: 'rec2',
        category: 'technology',
        priority: 'medium',
        title: 'AI-Enhanced Virtual Tutoring',
        description: 'Expand AI tutoring capabilities to compete with digital-first competitors',
        expectedImpact: 22.8,
        implementationCost: 4200000,
        timeToImplement: 6,
        roi: 340,
      },
    ],
  });

  const renderOverview = () => (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      {/* Executive Summary */}
      <View style={{
        backgroundColor: LightTheme.Surface,
        borderRadius: 16,
        padding: Spacing.LG,
        margin: Spacing.MD,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }}>
        <Text style={[Typography.titleLarge, { fontWeight: '700', marginBottom: Spacing.MD }]}>
          Executive Intelligence Dashboard
        </Text>
        
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {[
            { label: 'Total Institutions', value: institutionMetrics.length.toString(), trend: '+12%', color: '#2196F3' },
            { label: 'Combined Students', value: institutionMetrics.reduce((sum, inst) => sum + inst.totalStudents, 0).toLocaleString(), trend: '+8.5%', color: '#4CAF50' },
            { label: 'Avg Performance', value: `${(institutionMetrics.reduce((sum, inst) => sum + inst.averagePerformance, 0) / institutionMetrics.length).toFixed(1)}%`, trend: '+3.2%', color: '#FF9800' },
            { label: 'Market Growth', value: `${(institutionMetrics.reduce((sum, inst) => sum + inst.revenueGrowth, 0) / institutionMetrics.length).toFixed(1)}%`, trend: '+15%', color: '#9C27B0' },
          ].map((metric, index) => (
            <View key={index} style={{
              width: '48%',
              backgroundColor: LightTheme.SurfaceVariant,
              borderRadius: 12,
              padding: Spacing.MD,
              marginBottom: Spacing.SM,
              alignItems: 'center',
            }}>
              <Text style={[Typography.headlineMedium, { fontWeight: '700', color: metric.color }]}>
                {metric.value}
              </Text>
              <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant, textAlign: 'center' }]}>
                {metric.label}
              </Text>
              <View style={{
                backgroundColor: '#E8F5E8',
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 8,
                marginTop: 4,
              }}>
                <Text style={[Typography.bodySmall, { color: '#2E7D32', fontSize: 10, fontWeight: '600' }]}>
                  {metric.trend}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Institution Performance Comparison */}
      <View style={{
        backgroundColor: LightTheme.Surface,
        borderRadius: 16,
        padding: Spacing.LG,
        margin: Spacing.MD,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }}>
        <Text style={[Typography.titleMedium, { fontWeight: '600', marginBottom: Spacing.MD }]}>
          Institution Performance Matrix
        </Text>

        {institutionMetrics.map((institution) => (
          <TouchableOpacity
            key={institution.id}
            onPress={() => setSelectedInstitution(institution)}
            style={{
              backgroundColor: LightTheme.SurfaceVariant,
              borderRadius: 12,
              padding: Spacing.MD,
              marginBottom: Spacing.SM,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.SM }}>
              <View style={{ flex: 1 }}>
                <Text style={[Typography.bodyLarge, { fontWeight: '600' }]}>
                  {institution.name}
                </Text>
                <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>
                  {institution.geographicRegion} • Est. {institution.establishedYear}
                </Text>
              </View>
              <View style={{
                backgroundColor: LightTheme.primaryContainer,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 12,
              }}>
                <Text style={[Typography.bodySmall, { color: LightTheme.OnPrimaryContainer, fontSize: 10, fontWeight: '600' }]}>
                  #{institution.marketShare}% Market Share
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.SM }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={[Typography.titleSmall, { fontWeight: '600', color: LightTheme.Primary }]}>
                  {institution.totalStudents.toLocaleString()}
                </Text>
                <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>Students</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={[Typography.titleSmall, { fontWeight: '600', color: '#4CAF50' }]}>
                  {institution.averagePerformance}%
                </Text>
                <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>Performance</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={[Typography.titleSmall, { fontWeight: '600', color: '#FF9800' }]}>
                  {institution.retentionRate}%
                </Text>
                <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>Retention</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={[Typography.titleSmall, { fontWeight: '600', color: '#9C27B0' }]}>
                  +{institution.revenueGrowth}%
                </Text>
                <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>Growth</Text>
              </View>
            </View>

            <View style={{
              height: 4,
              backgroundColor: LightTheme.Outline + '30',
              borderRadius: 2,
            }}>
              <View style={{
                height: '100%',
                width: `${institution.averagePerformance}%`,
                backgroundColor: LightTheme.Primary,
                borderRadius: 2,
              }} />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Key Performance Indicators */}
      <View style={{
        backgroundColor: LightTheme.Surface,
        borderRadius: 16,
        padding: Spacing.LG,
        margin: Spacing.MD,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }}>
        <Text style={[Typography.titleMedium, { fontWeight: '600', marginBottom: Spacing.MD }]}>
          Critical Business KPIs
        </Text>

        {businessKPIs.slice(0, 4).map((kpi) => (
          <View key={kpi.id} style={{
            backgroundColor: LightTheme.SurfaceVariant,
            borderRadius: 12,
            padding: Spacing.MD,
            marginBottom: Spacing.SM,
            borderLeftWidth: 4,
            borderLeftColor: kpi.status === 'excellent' ? '#4CAF50' : 
                            kpi.status === 'good' ? '#2196F3' : 
                            kpi.status === 'warning' ? '#FF9800' : '#F44336',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.SM }}>
              <Text style={[Typography.bodyLarge, { fontWeight: '600' }]}>
                {kpi.name}
              </Text>
              <View style={{
                backgroundColor: kpi.status === 'excellent' ? '#E8F5E8' : 
                                kpi.status === 'good' ? '#E3F2FD' : 
                                kpi.status === 'warning' ? '#FFF3E0' : '#FFEBEE',
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 8,
              }}>
                <Text style={[Typography.bodySmall, {
                  color: kpi.status === 'excellent' ? '#2E7D32' : 
                         kpi.status === 'good' ? '#1976D2' : 
                         kpi.status === 'warning' ? '#F57C00' : '#D32F2F',
                  fontSize: 10,
                  textTransform: 'uppercase',
                  fontWeight: '600',
                }]}>
                  {kpi.status}
                </Text>
              </View>
            </View>

            <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant, marginBottom: Spacing.SM }]}>
              {kpi.description}
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={[Typography.titleMedium, { fontWeight: '700' }]}>
                  {kpi.currentValue.toLocaleString()} {kpi.unit}
                </Text>
                <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>
                  Target: {kpi.targetValue.toLocaleString()} {kpi.unit}
                </Text>
              </View>
              <View style={{ width: 80, height: 40, backgroundColor: '#f0f0f0', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>
                  Trend Chart
                </Text>
              </View>
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={{
            backgroundColor: LightTheme.Primary,
            paddingVertical: 10,
            borderRadius: 12,
            alignItems: 'center',
            marginTop: Spacing.SM,
          }}
          onPress={() => setActiveTab('kpis')}
        >
          <Text style={[Typography.bodyMedium, { color: LightTheme.OnPrimary, fontWeight: '600' }]}>
            View All KPIs
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderPredictiveAnalysis = () => (
    <View style={{ flex: 1 }}>
      {/* Timeframe Selector */}
      <View style={{
        flexDirection: 'row',
        paddingHorizontal: Spacing.MD,
        paddingVertical: Spacing.SM,
        backgroundColor: LightTheme.Surface,
      }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['1-month', '3-months', '6-months', '1-year'].map((timeframe) => (
            <TouchableOpacity
              key={timeframe}
              onPress={() => setSelectedTimeframe(timeframe as any)}
              style={{
                backgroundColor: selectedTimeframe === timeframe ? LightTheme.Primary : LightTheme.SurfaceVariant,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                marginRight: 8,
              }}
            >
              <Text style={[Typography.bodySmall, {
                color: selectedTimeframe === timeframe ? LightTheme.OnPrimary : LightTheme.OnSurfaceVariant,
                fontWeight: selectedTimeframe === timeframe ? '600' : '400',
                textTransform: 'capitalize',
              }]}>
                {timeframe}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={predictiveAnalyses.filter(analysis => analysis.timeframe === selectedTimeframe)}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{
            backgroundColor: LightTheme.Surface,
            borderRadius: 12,
            padding: Spacing.MD,
            marginHorizontal: Spacing.MD,
            marginBottom: Spacing.SM,
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.SM }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Icon 
                    name={item.type === 'enrollment' ? 'group-add' : 
                          item.type === 'retention' ? 'group' : 
                          item.type === 'revenue' ? 'trending-up' : 
                          item.type === 'performance' ? 'assessment' : 'warning'} 
                    size={20} 
                    color={item.type === 'enrollment' ? '#2196F3' : 
                           item.type === 'retention' ? '#4CAF50' : 
                           item.type === 'revenue' ? '#FF9800' : 
                           item.type === 'performance' ? '#9C27B0' : '#F44336'} 
                    style={{ marginRight: 8 }}
                  />
                  <Text style={[Typography.titleSmall, { fontWeight: '600', textTransform: 'capitalize' }]}>
                    {item.type} Forecast
                  </Text>
                </View>
                <Text style={[Typography.bodyLarge, { fontWeight: '700' }]}>
                  {item.title}
                </Text>
                <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant, marginTop: 2 }]}>
                  {item.description}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <View style={{
                  backgroundColor: item.impactLevel === 'critical' ? '#FFEBEE' : 
                                  item.impactLevel === 'high' ? '#FFF3E0' : 
                                  item.impactLevel === 'medium' ? '#E3F2FD' : '#E8F5E8',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 12,
                }}>
                  <Text style={[Typography.bodySmall, {
                    color: item.impactLevel === 'critical' ? '#D32F2F' : 
                           item.impactLevel === 'high' ? '#F57C00' : 
                           item.impactLevel === 'medium' ? '#1976D2' : '#2E7D32',
                    fontSize: 10,
                    textTransform: 'uppercase',
                    fontWeight: '600',
                  }]}>
                    {item.impactLevel}
                  </Text>
                </View>
                <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant, marginTop: 4 }]}>
                  {item.confidence}% confidence
                </Text>
              </View>
            </View>

            <View style={{
              backgroundColor: LightTheme.primaryContainer + '30',
              padding: Spacing.MD,
              borderRadius: 12,
              marginBottom: Spacing.SM,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View>
                  <Text style={[Typography.headlineMedium, { fontWeight: '700', color: LightTheme.Primary }]}>
                    {item.type === 'enrollment' ? item.prediction.toLocaleString() : 
                     item.type === 'retention' ? `${item.prediction}%` : 
                     item.type === 'revenue' ? `+${item.prediction}%` : `${item.prediction}`}
                  </Text>
                  <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>
                    Predicted Value
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Icon 
                    name={item.trendDirection === 'increasing' ? 'trending-up' : 
                          item.trendDirection === 'decreasing' ? 'trending-down' : 'trending-flat'} 
                    size={24} 
                    color={item.trendDirection === 'increasing' ? '#4CAF50' : 
                           item.trendDirection === 'decreasing' ? '#F44336' : '#FF9800'} 
                  />
                  <Text style={[Typography.bodySmall, { 
                    color: item.trendDirection === 'increasing' ? '#4CAF50' : 
                           item.trendDirection === 'decreasing' ? '#F44336' : '#FF9800',
                    marginLeft: 4,
                    textTransform: 'capitalize'
                  }]}>
                    {item.trendDirection}
                  </Text>
                </View>
              </View>
            </View>

            <View style={{ marginBottom: Spacing.SM }}>
              <Text style={[Typography.bodySmall, { fontWeight: '600', marginBottom: Spacing.SM }]}>
                Key Influencing Factors:
              </Text>
              {item.factors.slice(0, 3).map((factor, index) => (
                <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: factor.category === 'internal' ? '#2196F3' : 
                                     factor.category === 'external' ? '#4CAF50' : 
                                     factor.category === 'market' ? '#FF9800' : '#9C27B0',
                      marginRight: 8,
                    }} />
                    <Text style={[Typography.bodySmall]}>{factor.name}</Text>
                  </View>
                  <Text style={[Typography.bodySmall, { fontWeight: '600' }]}>
                    {factor.impact}%
                  </Text>
                </View>
              ))}
            </View>

            <Text style={[Typography.bodySmall, { fontWeight: '600', marginBottom: 4 }]}>
              AI Recommendations:
            </Text>
            {item.recommendations.slice(0, 2).map((rec, index) => (
              <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 }}>
                <Text style={[Typography.bodySmall, { color: LightTheme.Primary, marginRight: 4 }]}>•</Text>
                <Text style={[Typography.bodySmall, { flex: 1, color: LightTheme.OnSurfaceVariant }]}>
                  {rec}
                </Text>
              </View>
            ))}
          </View>
        )}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <Text style={[Typography.titleMedium, { fontWeight: '600', margin: Spacing.MD }]}>
            Predictive Analysis - {selectedTimeframe.replace('-', ' ')}
          </Text>
        )}
      />
    </View>
  );

  const renderCompetitiveAnalysis = () => (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      <View style={{ padding: Spacing.MD }}>
        {/* Header Section */}
        <View style={{ marginBottom: Spacing.LG }}>
          <Text style={[Typography.titleLarge, { fontWeight: '700', marginBottom: Spacing.SM }]}>
            Competitive Intelligence Dashboard
          </Text>
          <Text style={[Typography.bodyMedium, { color: LightTheme.OnSurfaceVariant }]}>
            Real-time analysis of competitor performance and market positioning
          </Text>
        </View>

        {/* Competition Overview Cards */}
        <View style={{ marginBottom: Spacing.LG }}>
          <Text style={[Typography.titleMedium, { fontWeight: '600', marginBottom: Spacing.MD }]}>
            Competitor Performance
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.MD }}>
            {[
              { name: 'EduTech Pro', marketShare: 28.5, growth: '+12%', students: '145K', color: '#FF6B35' },
              { name: 'SmartLearn AI', marketShare: 22.3, growth: '+8%', students: '118K', color: '#F7931E' },
              { name: 'TutorMaster', marketShare: 19.8, growth: '+5%', students: '98K', color: '#FFD23F' },
              { name: 'ClassGenius', marketShare: 15.2, growth: '+3%', students: '76K', color: '#06FFA5' },
            ].map((competitor, index) => (
              <View key={index} style={{
                backgroundColor: LightTheme.Surface,
                padding: Spacing.MD,
                borderRadius: BorderRadius.MD,
                width: '48%',
                borderLeftWidth: 4,
                borderLeftColor: competitor.color,
                elevation: 2,
              }}>
                <Text style={[Typography.titleSmall, { fontWeight: '600', marginBottom: Spacing.SM }]}>
                  {competitor.name}
                </Text>
                <View style={{ gap: Spacing.XS }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={Typography.labelMedium}>Market Share:</Text>
                    <Text style={[Typography.labelMedium, { fontWeight: '600' }]}>{competitor.marketShare}%</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={Typography.labelMedium}>Growth:</Text>
                    <Text style={[Typography.labelMedium, { color: LightTheme.Primary, fontWeight: '600' }]}>
                      {competitor.growth}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={Typography.labelMedium}>Students:</Text>
                    <Text style={[Typography.labelMedium, { fontWeight: '600' }]}>{competitor.students}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Market Trends */}
        <View style={{ marginBottom: Spacing.LG }}>
          <Text style={[Typography.titleMedium, { fontWeight: '600', marginBottom: Spacing.MD }]}>
            Market Trends & Insights
          </Text>
          <View style={{ gap: Spacing.MD }}>
            {[
              { 
                trend: 'AI-Powered Tutoring', 
                impact: 'High', 
                adoption: '78%', 
                description: 'Competitors heavily investing in AI tutoring capabilities',
                icon: '🤖'
              },
              { 
                trend: 'Mobile-First Learning', 
                impact: 'Critical', 
                adoption: '92%', 
                description: 'Mobile engagement now accounts for 85% of student interactions',
                icon: '📱'
              },
              { 
                trend: 'Gamification Elements', 
                impact: 'Medium', 
                adoption: '65%', 
                description: 'Learning games and rewards driving 40% higher retention',
                icon: '🎮'
              },
              { 
                trend: 'Parent Analytics', 
                impact: 'High', 
                adoption: '71%', 
                description: 'Detailed parent dashboards becoming standard feature',
                icon: '👨‍👩‍👧‍👦'
              },
            ].map((trend, index) => (
              <View key={index} style={{
                backgroundColor: LightTheme.Surface,
                padding: Spacing.MD,
                borderRadius: BorderRadius.MD,
                elevation: 1,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.SM }}>
                  <Text style={{ fontSize: 20, marginRight: Spacing.SM }}>{trend.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[Typography.titleSmall, { fontWeight: '600' }]}>{trend.trend}</Text>
                  </View>
                  <View style={{
                    backgroundColor: trend.impact === 'Critical' ? '#FF3B30' : 
                                   trend.impact === 'High' ? '#FF9500' : '#34C759',
                    paddingHorizontal: Spacing.SM,
                    paddingVertical: 2,
                    borderRadius: BorderRadius.SM,
                  }}>
                    <Text style={[Typography.labelSmall, { color: 'white', fontWeight: 'bold' }]}>
                      {trend.impact}
                    </Text>
                  </View>
                </View>
                <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant, marginBottom: Spacing.SM }]}>
                  {trend.description}
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={Typography.labelMedium}>Market Adoption:</Text>
                  <Text style={[Typography.labelMedium, { fontWeight: '600' }]}>{trend.adoption}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Action Items */}
        <View style={{
          backgroundColor: LightTheme.primaryContainer,
          padding: Spacing.LG,
          borderRadius: BorderRadius.MD,
          marginBottom: Spacing.LG,
        }}>
          <Text style={[Typography.titleMedium, { fontWeight: '600', marginBottom: Spacing.MD }]}>
            Strategic Recommendations
          </Text>
          <View style={{ gap: Spacing.SM }}>
            {[
              '• Accelerate AI tutoring feature development to match competitor capabilities',
              '• Enhance mobile app user experience with gesture-based navigation',
              '• Implement gamification rewards system within 2 quarters',
              '• Expand parent dashboard analytics and real-time notifications',
              '• Consider strategic partnerships with EdTech leaders',
            ].map((item, index) => (
              <Text key={index} style={[Typography.bodyMedium, { color: LightTheme.OnPrimaryContainer }]}>
                {item}
              </Text>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderAdvancedKPIs = () => (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      <View style={{ padding: Spacing.MD }}>
        {/* Header */}
        <View style={{ marginBottom: Spacing.LG }}>
          <Text style={[Typography.titleLarge, { fontWeight: '700', marginBottom: Spacing.SM }]}>
            Advanced KPI Analytics Suite
          </Text>
          <Text style={[Typography.bodyMedium, { color: LightTheme.OnSurfaceVariant }]}>
            Enterprise-grade performance indicators and business intelligence
          </Text>
        </View>

        {/* Executive Summary Cards */}
        <View style={{ marginBottom: Spacing.LG }}>
          <Text style={[Typography.titleMedium, { fontWeight: '600', marginBottom: Spacing.MD }]}>
            Executive KPI Dashboard
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.MD }}>
            {[
              { title: 'Revenue Growth', value: '+23.8%', target: '+20%', status: 'exceeding', color: '#34C759' },
              { title: 'Customer LTV', value: '$2,847', target: '$2,500', status: 'exceeding', color: '#34C759' },
              { title: 'Churn Rate', value: '3.2%', target: '<5%', status: 'meeting', color: '#007AFF' },
              { title: 'NPS Score', value: '68', target: '65', status: 'exceeding', color: '#34C759' },
            ].map((kpi, index) => (
              <View key={index} style={{
                backgroundColor: LightTheme.Surface,
                padding: Spacing.MD,
                borderRadius: BorderRadius.MD,
                width: '48%',
                elevation: 2,
                borderTopWidth: 3,
                borderTopColor: kpi.color,
              }}>
                <Text style={[Typography.labelMedium, { color: LightTheme.OnSurfaceVariant, marginBottom: Spacing.XS }]}>
                  {kpi.title}
                </Text>
                <Text style={[Typography.headlineSmall, { fontWeight: 'bold', color: kpi.color, marginBottom: Spacing.XS }]}>
                  {kpi.value}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[Typography.labelSmall, { color: LightTheme.OnSurfaceVariant }]}>
                    Target: {kpi.target}
                  </Text>
                  <View style={{
                    marginLeft: Spacing.SM,
                    paddingHorizontal: Spacing.XS,
                    paddingVertical: 2,
                    backgroundColor: kpi.color + '20',
                    borderRadius: BorderRadius.SM,
                  }}>
                    <Text style={[Typography.labelSmall, { color: kpi.color, fontWeight: '600' }]}>
                      {kpi.status}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Operational KPIs */}
        <View style={{ marginBottom: Spacing.LG }}>
          <Text style={[Typography.titleMedium, { fontWeight: '600', marginBottom: Spacing.MD }]}>
            Operational Excellence Metrics
          </Text>
          <View style={{ gap: Spacing.MD }}>
            {[
              { 
                category: 'Student Engagement', 
                metrics: [
                  { name: 'Daily Active Users', value: '89.2%', trend: '+2.3%' },
                  { name: 'Session Duration', value: '47 min', trend: '+8.1%' },
                  { name: 'Assignment Completion', value: '94.7%', trend: '+1.2%' },
                  { name: 'Forum Participation', value: '76.4%', trend: '+5.7%' },
                ]
              },
              { 
                category: 'Teacher Productivity', 
                metrics: [
                  { name: 'Grading Efficiency', value: '23.5 min/assignment', trend: '-12.3%' },
                  { name: 'Response Time', value: '2.3 hours', trend: '-8.7%' },
                  { name: 'Resource Creation', value: '12.4/week', trend: '+15.2%' },
                  { name: 'Platform Usage', value: '6.8 hours/day', trend: '+3.1%' },
                ]
              },
              { 
                category: 'System Performance', 
                metrics: [
                  { name: 'System Uptime', value: '99.97%', trend: '+0.02%' },
                  { name: 'Page Load Speed', value: '1.8s', trend: '-0.3s' },
                  { name: 'Error Rate', value: '0.03%', trend: '-0.01%' },
                  { name: 'API Response', value: '145ms', trend: '-12ms' },
                ]
              },
            ].map((category, categoryIndex) => (
              <View key={categoryIndex} style={{
                backgroundColor: LightTheme.Surface,
                padding: Spacing.MD,
                borderRadius: BorderRadius.MD,
                elevation: 1,
              }}>
                <Text style={[Typography.titleSmall, { fontWeight: '600', marginBottom: Spacing.MD }]}>
                  {category.category}
                </Text>
                <View style={{ gap: Spacing.SM }}>
                  {category.metrics.map((metric, index) => (
                    <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={[Typography.bodyMedium, { flex: 1 }]}>{metric.name}</Text>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[Typography.bodyMedium, { fontWeight: '600' }]}>{metric.value}</Text>
                        <Text style={[Typography.labelSmall, { 
                          color: metric.trend.startsWith('+') || metric.trend.startsWith('-0') ? '#34C759' : '#007AFF'
                        }]}>
                          {metric.trend}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Performance Alerts */}
        <View style={{
          backgroundColor: '#FFF3CD',
          padding: Spacing.MD,
          borderRadius: BorderRadius.MD,
          borderWidth: 1,
          borderColor: '#FFECB5',
          marginBottom: Spacing.LG,
        }}>
          <Text style={[Typography.titleSmall, { fontWeight: '600', color: '#856404', marginBottom: Spacing.SM }]}>
            🚨 Performance Alerts
          </Text>
          <View style={{ gap: Spacing.XS }}>
            <Text style={[Typography.bodySmall, { color: '#856404' }]}>
              • Mobile app crash rate increased by 0.2% - investigation in progress
            </Text>
            <Text style={[Typography.bodySmall, { color: '#856404' }]}>
              • Server response times spiking during peak hours (3-5 PM)
            </Text>
            <Text style={[Typography.bodySmall, { color: '#856404' }]}>
              • Student forum activity down 3% compared to last month
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderCustomDashboards = () => (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      <View style={{ padding: Spacing.MD }}>
        {/* Header */}
        <View style={{ marginBottom: Spacing.LG }}>
          <Text style={[Typography.titleLarge, { fontWeight: '700', marginBottom: Spacing.SM }]}>
            Custom Dashboard Builder
          </Text>
          <Text style={[Typography.bodyMedium, { color: LightTheme.OnSurfaceVariant }]}>
            Create personalized dashboards with drag-and-drop widgets and real-time analytics
          </Text>
        </View>

        {/* Dashboard Templates */}
        <View style={{ marginBottom: Spacing.LG }}>
          <Text style={[Typography.titleMedium, { fontWeight: '600', marginBottom: Spacing.MD }]}>
            Pre-built Dashboard Templates
          </Text>
          <View style={{ gap: Spacing.MD }}>
            {[
              { 
                name: 'Executive Overview', 
                description: 'High-level KPIs and financial metrics for leadership team',
                widgets: 8,
                users: 12,
                color: '#007AFF'
              },
              { 
                name: 'Operations Monitor', 
                description: 'Real-time system performance and user activity tracking',
                widgets: 12,
                users: 25,
                color: '#34C759'
              },
              { 
                name: 'Academic Analytics', 
                description: 'Student performance, engagement, and learning outcomes',
                widgets: 15,
                users: 45,
                color: '#FF9500'
              },
              { 
                name: 'Teacher Insights', 
                description: 'Teaching effectiveness and classroom management metrics',
                widgets: 10,
                users: 78,
                color: '#AF52DE'
              },
            ].map((template, index) => (
              <TouchableOpacity key={index} style={{
                backgroundColor: LightTheme.Surface,
                padding: Spacing.MD,
                borderRadius: BorderRadius.MD,
                elevation: 2,
                borderLeftWidth: 4,
                borderLeftColor: template.color,
              }} onPress={() => {
                Alert.alert('Dashboard Template', `Deploy ${template.name} dashboard template?`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Deploy', onPress: () => Alert.alert('success', 'Dashboard deployed successfully!') }
                ]);
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.SM }}>
                  <Text style={[Typography.titleSmall, { fontWeight: '600', flex: 1 }]}>{template.name}</Text>
                  <TouchableOpacity style={{
                    backgroundColor: template.color,
                    paddingHorizontal: Spacing.SM,
                    paddingVertical: 2,
                    borderRadius: BorderRadius.SM,
                  }}>
                    <Text style={[Typography.labelSmall, { color: 'white', fontWeight: 'bold' }]}>Deploy</Text>
                  </TouchableOpacity>
                </View>
                <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant, marginBottom: Spacing.SM }]}>
                  {template.description}
                </Text>
                <View style={{ flexDirection: 'row', gap: Spacing.MD }}>
                  <Text style={[Typography.labelMedium, { color: LightTheme.OnSurfaceVariant }]}>
                    📊 {template.widgets} widgets
                  </Text>
                  <Text style={[Typography.labelMedium, { color: LightTheme.OnSurfaceVariant }]}>
                    👥 {template.users} active users
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Widget Library */}
        <View style={{ marginBottom: Spacing.LG }}>
          <Text style={[Typography.titleMedium, { fontWeight: '600', marginBottom: Spacing.MD }]}>
            Available Widgets
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.SM }}>
            {[
              { name: 'Revenue Chart', icon: '💰', type: 'chart' },
              { name: 'User Activity', icon: '📈', type: 'metric' },
              { name: 'System Status', icon: '🟢', type: 'status' },
              { name: 'Recent Alerts', icon: '🚨', type: 'list' },
              { name: 'Performance Gauge', icon: '⚡', type: 'gauge' },
              { name: 'Geographic Map', icon: '🗺️', type: 'map' },
              { name: 'Calendar View', icon: '📅', type: 'calendar' },
              { name: 'Data Table', icon: '📋', type: 'table' },
            ].map((widget, index) => (
              <TouchableOpacity key={index} style={{
                backgroundColor: LightTheme.Surface,
                padding: Spacing.MD,
                borderRadius: BorderRadius.MD,
                width: '48%',
                alignItems: 'center',
                elevation: 1,
              }} onPress={() => {
                Alert.alert('Add Widget', `Add ${widget.name} to your custom dashboard?`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Add', onPress: () => Alert.alert('success', 'Widget added to dashboard!') }
                ]);
              }}>
                <Text style={{ fontSize: 24, marginBottom: Spacing.XS }}>{widget.icon}</Text>
                <Text style={[Typography.labelMedium, { textAlign: 'center', fontWeight: '500' }]}>
                  {widget.name}
                </Text>
                <Text style={[Typography.labelSmall, { color: LightTheme.OnSurfaceVariant, textAlign: 'center' }]}>
                  {widget.type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Dashboard Builder CTA */}
        <TouchableOpacity style={{
          backgroundColor: LightTheme.Primary,
          padding: Spacing.LG,
          borderRadius: BorderRadius.MD,
          alignItems: 'center',
          elevation: 3,
        }} onPress={() => setShowCustomDashboard(true)}>
          <Text style={[Typography.titleMedium, { color: LightTheme.OnPrimary, fontWeight: '700', marginBottom: Spacing.SM }]}>
            🎨 Launch Dashboard Builder
          </Text>
          <Text style={[Typography.bodyMedium, { color: LightTheme.OnPrimary + '80', textAlign: 'center' }]}>
            Create your personalized dashboard with drag-and-drop interface
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'predictive':
        return renderPredictiveAnalysis();
      case 'competitive':
        return renderCompetitiveAnalysis();
      case 'kpis':
        return renderAdvancedKPIs();
      case 'dashboards':
        return renderCustomDashboards();
      default:
        return renderOverview();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: LightTheme.Background }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.LG,
        paddingVertical: Spacing.MD,
        backgroundColor: LightTheme.Surface,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }}>
        <TouchableOpacity onPress={() => onNavigate('back')}>
          <Icon name="arrow-back" size={24} color={LightTheme.OnSurface} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: Spacing.MD }}>
          <Text style={[Typography.titleLarge, { fontWeight: '700', color: LightTheme.Primary }]}>
            Enterprise Intelligence
          </Text>
          <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>
            Advanced Business Analytics & Insights
          </Text>
        </View>
        <TouchableOpacity onPress={() => setShowCustomDashboard(true)}>
          <Icon name="dashboard-customize" size={24} color={LightTheme.Primary} />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={{
        flexDirection: 'row',
        backgroundColor: LightTheme.Surface,
        paddingHorizontal: Spacing.MD,
        paddingVertical: Spacing.SM,
      }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'overview', label: 'Overview', icon: 'dashboard' },
            { key: 'predictive', label: 'Predictive', icon: 'insights' },
            { key: 'competitive', label: 'Competitive', icon: 'compare' },
            { key: 'kpis', label: 'KPIs', icon: 'analytics' },
            { key: 'dashboards', label: 'Custom', icon: 'view-module' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key as any)}
              style={{
                alignItems: 'center',
                paddingVertical: 8,
                paddingHorizontal: 12,
                marginRight: 8,
                borderRadius: 20,
                backgroundColor: activeTab === tab.key ? LightTheme.Primary : 'transparent',
                minWidth: 80,
              }}
            >
              <Icon
                name={tab.icon}
                size={18}
                color={activeTab === tab.key ? LightTheme.OnPrimary : LightTheme.OnSurfaceVariant}
              />
              <Text style={[
                Typography.bodySmall,
                {
                  marginTop: 2,
                  color: activeTab === tab.key ? LightTheme.OnPrimary : LightTheme.OnSurfaceVariant,
                  fontWeight: activeTab === tab.key ? '600' : '400',
                  fontSize: 10,
                },
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {renderTabContent()}
      </View>

      {/* Custom Dashboard Modal */}
      <Modal visible={showCustomDashboard} transparent animationType="slide">
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{
            backgroundColor: LightTheme.Surface,
            borderRadius: 20,
            padding: Spacing.LG,
            width: width * 0.9,
            maxHeight: '70%',
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: Spacing.LG,
            }}>
              <Text style={[Typography.titleMedium, { fontWeight: '600' }]}>
                Custom Dashboard Builder
              </Text>
              <TouchableOpacity onPress={() => setShowCustomDashboard(false)}>
                <Icon name="close" size={24} color={LightTheme.OnSurface} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[Typography.bodyLarge, { textAlign: 'center', color: LightTheme.OnSurfaceVariant, marginTop: 50 }]}>
                Drag & Drop Dashboard Builder
              </Text>
              <Text style={[Typography.bodySmall, { textAlign: 'center', color: LightTheme.OnSurfaceVariant, marginTop: 8 }]}>
                Create personalized dashboards with real-time widgets and analytics
              </Text>

              <TouchableOpacity
                style={{
                  backgroundColor: LightTheme.Primary,
                  paddingVertical: 12,
                  borderRadius: 25,
                  alignItems: 'center',
                  marginTop: 30,
                }}
                onPress={() => {
                  Alert.alert('Dashboard Builder', 'Custom dashboard creation is now available! Configure your personalized analytics dashboard.');
                  setShowCustomDashboard(false);
                }}
              >
                <Text style={[Typography.bodyMedium, { color: LightTheme.OnPrimary, fontWeight: '600' }]}>
                  Start Building
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default EnterpriseIntelligenceSuite;