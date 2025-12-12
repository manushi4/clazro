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
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LightTheme } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';

interface AIAgent {
  id: string;
  name: string;
  type: 'personal-concierge' | 'institutional-intelligence' | 'performance-optimizer' | 'compliance-monitor' | 'resource-allocator';
  description: string;
  avatar: string;
  status: 'active' | 'learning' | 'maintenance' | 'offline';
  capabilities: string[];
  assignedUsers: number;
  taskCompletionRate: number;
  satisfactionScore: number;
  lastUpdate: Date;
  modelVersion: string;
  specializations: string[];
  autonomyLevel: number;
}

interface AgentInteraction {
  id: string;
  agentId: string;
  userId: string;
  userType: 'student' | 'teacher' | 'parent' | 'admin';
  interactionType: 'query' | 'task' | 'recommendation' | 'alert' | 'automation';
  content: string;
  response: string;
  timestamp: Date;
  satisfaction: number | null;
  resolved: boolean;
  processingTime: number;
}

interface AgentTask {
  id: string;
  agentId: string;
  title: string;
  description: string;
  type: 'analysis' | 'automation' | 'monitoring' | 'optimization' | 'reporting';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  assignedAt: Date;
  completedAt?: Date;
  progress: number;
  estimatedCompletion: Date;
  requiredCapabilities: string[];
}

interface AgentPerformanceMetrics {
  responseTime: number;
  accuracy: number;
  taskCompletionRate: number;
  userSatisfaction: number;
  uptime: number;
  learningRate: number;
  totalInteractions: number;
  successfulTasks: number;
  failedTasks: number;
  averageProcessingTime: number;
}

interface InstitutionalAgent {
  id: string;
  name: string;
  type: 'compliance' | 'performance' | 'resource' | 'risk' | 'strategic';
  scope: 'institution' | 'department' | 'global';
  responsibilities: string[];
  automationLevel: number;
  reportingFrequency: 'real-time' | 'hourly' | 'daily' | 'weekly';
  stakeholders: string[];
  kpiTracking: string[];
}

const AIAgentEcosystem: React.FC<{
  adminId: string;
  onNavigate: (screen: string) => void;
}> = ({ adminId, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'agents' | 'interactions' | 'tasks' | 'performance'>('overview');
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [pulseAnimation] = useState(new Animated.Value(1));

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Mock data
  const [aiAgents] = useState<AIAgent[]>([
    {
      id: 'agent_1',
      name: 'आर्या - Personal Learning Concierge',
      type: 'personal-concierge',
      description: 'AI assistant providing personalized learning guidance and academic support for individual students',
      avatar: '🤖',
      status: 'active',
      capabilities: ['Learning Path Optimization', 'Study Schedule Management', 'Doubt Resolution', 'Progress Tracking', 'Motivation & Engagement'],
      assignedUsers: 1250,
      taskCompletionRate: 94.2,
      satisfactionScore: 4.7,
      lastUpdate: new Date(),
      modelVersion: 'LLM-v4.2',
      specializations: ['Mathematics', 'Science', 'Language Learning', 'Exam Preparation'],
      autonomyLevel: 85,
    },
    {
      id: 'agent_2',
      name: 'विद्या - Institutional Intelligence Agent',
      type: 'institutional-intelligence',
      description: 'Advanced AI system for institutional performance analysis, strategic planning, and administrative optimization',
      avatar: '🧠',
      status: 'active',
      capabilities: ['Performance Analytics', 'Strategic Planning', 'Resource Optimization', 'Predictive Modeling', 'Compliance Monitoring'],
      assignedUsers: 45,
      taskCompletionRate: 97.8,
      satisfactionScore: 4.9,
      lastUpdate: new Date(),
      modelVersion: 'Enterprise-AI-v3.1',
      specializations: ['Data Analysis', 'Business Intelligence', 'Risk Assessment', 'Quality Assurance'],
      autonomyLevel: 92,
    },
    {
      id: 'agent_3',
      name: 'गुरु - Teaching Enhancement Agent',
      type: 'performance-optimizer',
      description: 'AI coach focused on improving teaching methodologies, curriculum design, and educational effectiveness',
      avatar: '👨‍🏫',
      status: 'learning',
      capabilities: ['Teaching Method Analysis', 'Curriculum Optimization', 'Student Engagement Tracking', 'Assessment Design', 'Professional Development'],
      assignedUsers: 89,
      taskCompletionRate: 91.5,
      satisfactionScore: 4.6,
      lastUpdate: new Date(Date.now() - 300000),
      modelVersion: 'EduAI-v2.8',
      specializations: ['Pedagogical Analysis', 'Content Development', 'Assessment Innovation', 'Teacher Training'],
      autonomyLevel: 78,
    },
    {
      id: 'agent_4',
      name: 'नियम - Compliance Monitor Agent',
      type: 'compliance-monitor',
      description: 'Specialized AI for ensuring regulatory compliance, data protection, and policy adherence across the platform',
      avatar: '🛡️',
      status: 'active',
      capabilities: ['Regulatory Monitoring', 'Data Protection', 'Policy Enforcement', 'Audit Trail Management', 'Risk Assessment'],
      assignedUsers: 12,
      taskCompletionRate: 99.2,
      satisfactionScore: 4.8,
      lastUpdate: new Date(),
      modelVersion: 'Compliance-AI-v5.0',
      specializations: ['GDPR Compliance', 'FERPA Compliance', 'Data Security', 'Privacy Protection'],
      autonomyLevel: 95,
    },
    {
      id: 'agent_5',
      name: 'संसाधन - Resource Allocation Agent',
      type: 'resource-allocator',
      description: 'AI system optimizing resource distribution, capacity planning, and operational efficiency',
      avatar: '📊',
      status: 'maintenance',
      capabilities: ['Resource Planning', 'Capacity Optimization', 'Cost Analysis', 'Demand Forecasting', 'Efficiency Monitoring'],
      assignedUsers: 23,
      taskCompletionRate: 88.7,
      satisfactionScore: 4.4,
      lastUpdate: new Date(Date.now() - 1800000),
      modelVersion: 'OptiAI-v1.9',
      specializations: ['Resource Management', 'Financial Planning', 'Operational Analytics', 'Demand Prediction'],
      autonomyLevel: 82,
    },
  ]);

  const [agentInteractions] = useState<AgentInteraction[]>([
    {
      id: 'interaction_1',
      agentId: 'agent_1',
      userId: 'student_123',
      userType: 'student',
      interactionType: 'query',
      content: 'I\'m struggling with calculus derivatives. Can you help me understand the chain rule?',
      response: 'I\'d be happy to help you with the chain rule! Let me break it down into simple steps and provide some practice problems tailored to your learning style.',
      timestamp: new Date(Date.now() - 300000),
      satisfaction: 5,
      resolved: true,
      processingTime: 2.3,
    },
    {
      id: 'interaction_2',
      agentId: 'agent_2',
      userId: 'admin_456',
      userType: 'admin',
      interactionType: 'recommendation',
      content: 'Institutional Performance Analysis Request',
      response: 'Based on current metrics, I recommend implementing adaptive learning paths for 23% improvement in student outcomes and optimizing teacher schedules for 15% efficiency gain.',
      timestamp: new Date(Date.now() - 600000),
      satisfaction: null,
      resolved: true,
      processingTime: 45.7,
    },
    {
      id: 'interaction_3',
      agentId: 'agent_4',
      userId: 'admin_789',
      userType: 'admin',
      interactionType: 'alert',
      content: 'GDPR Compliance Check Alert',
      response: 'Detected 3 potential data retention policy violations. Immediate attention required for user consent records. Automated remediation initiated.',
      timestamp: new Date(Date.now() - 900000),
      satisfaction: 4,
      resolved: false,
      processingTime: 12.1,
    },
  ]);

  const [agentTasks] = useState<AgentTask[]>([
    {
      id: 'task_1',
      agentId: 'agent_1',
      title: 'Personalized Study Plan Generation',
      description: 'Create customized study plans for 150 new students based on their learning profiles and goals',
      type: 'analysis',
      priority: 'high',
      status: 'in-progress',
      assignedAt: new Date(Date.now() - 1800000),
      progress: 75,
      estimatedCompletion: new Date(Date.now() + 600000),
      requiredCapabilities: ['Learning Path Optimization', 'Progress Tracking'],
    },
    {
      id: 'task_2',
      agentId: 'agent_2',
      title: 'Quarterly Performance Analysis',
      description: 'Generate comprehensive institutional performance report with predictive insights for next quarter',
      type: 'reporting',
      priority: 'medium',
      status: 'pending',
      assignedAt: new Date(Date.now() - 900000),
      progress: 0,
      estimatedCompletion: new Date(Date.now() + 86400000),
      requiredCapabilities: ['Performance Analytics', 'Predictive Modeling'],
    },
    {
      id: 'task_3',
      agentId: 'agent_4',
      title: 'Compliance Audit Preparation',
      description: 'Prepare documentation and evidence for upcoming GDPR compliance audit',
      type: 'monitoring',
      priority: 'critical',
      status: 'completed',
      assignedAt: new Date(Date.now() - 86400000),
      completedAt: new Date(Date.now() - 3600000),
      progress: 100,
      estimatedCompletion: new Date(Date.now() - 3600000),
      requiredCapabilities: ['Regulatory Monitoring', 'Audit Trail Management'],
    },
  ]);

  const [performanceMetrics] = useState<AgentPerformanceMetrics>({
    responseTime: 2.8,
    accuracy: 96.4,
    taskCompletionRate: 93.7,
    userSatisfaction: 4.6,
    uptime: 99.8,
    learningRate: 12.5,
    totalInteractions: 45600,
    successfulTasks: 2340,
    failedTasks: 78,
    averageProcessingTime: 15.2,
  });

  const renderOverview = () => (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      {/* AI Agent Ecosystem Overview */}
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
          AI Agent Ecosystem Dashboard
        </Text>
        
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {[
            { label: 'Active Agents', value: aiAgents.filter(a => a.status === 'active').length.toString(), trend: '+2', color: '#4CAF50' },
            { label: 'Total Users Served', value: aiAgents.reduce((sum, agent) => sum + agent.assignedUsers, 0).toLocaleString(), trend: '+15%', color: '#2196F3' },
            { label: 'Avg Satisfaction', value: `${(aiAgents.reduce((sum, agent) => sum + agent.satisfactionScore, 0) / aiAgents.length).toFixed(1)}★`, trend: '+0.2', color: '#FF9800' },
            { label: 'Task Success Rate', value: `${performanceMetrics.taskCompletionRate}%`, trend: '+2.1%', color: '#9C27B0' },
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

      {/* Agent Status Overview */}
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
          Agent Status Overview
        </Text>

        {aiAgents.slice(0, 3).map((agent) => (
          <TouchableOpacity
            key={agent.id}
            onPress={() => {
              setSelectedAgent(agent);
              setShowAgentModal(true);
            }}
            style={{
              backgroundColor: LightTheme.SurfaceVariant,
              borderRadius: 12,
              padding: Spacing.MD,
              marginBottom: Spacing.SM,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <View style={{ marginRight: Spacing.MD }}>
              <Animated.text style={{
                fontSize: 32,
                transform: agent.status === 'active' ? [{ scale: pulseAnimation }] : [],
              }}>
                {agent.avatar}
              </Animated.text>
            </View>
            
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <Text style={[Typography.bodyLarge, { fontWeight: '600', flex: 1 }]}>
                  {agent.name.split(' - ')[0]}
                </Text>
                <View style={{
                  backgroundColor: agent.status === 'active' ? '#E8F5E8' : 
                                  agent.status === 'learning' ? '#E3F2FD' : 
                                  agent.status === 'maintenance' ? '#FFF3E0' : '#F5F5F5',
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 8,
                }}>
                  <Text style={[Typography.bodySmall, {
                    color: agent.status === 'active' ? '#2E7D32' : 
                           agent.status === 'learning' ? '#1976D2' : 
                           agent.status === 'maintenance' ? '#F57C00' : '#666',
                    fontSize: 9,
                    textTransform: 'capitalize',
                  }]}>
                    {agent.status}
                  </Text>
                </View>
              </View>
              
              <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant, marginBottom: 6 }]}>
                {agent.description.substring(0, 60)}...
              </Text>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>
                  {agent.assignedUsers.toLocaleString()} users
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[Typography.bodySmall, { color: '#FFB300', marginRight: 2 }]}>★</Text>
                  <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>
                    {agent.satisfactionScore}
                  </Text>
                </View>
                <Text style={[Typography.bodySmall, { color: LightTheme.Primary }]}>
                  {agent.taskCompletionRate}%
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={{
            backgroundColor: LightTheme.Primary,
            paddingVertical: 10,
            borderRadius: 12,
            alignItems: 'center',
            marginTop: Spacing.SM,
          }}
          onPress={() => setActiveTab('agents')}
        >
          <Text style={[Typography.bodyMedium, { color: LightTheme.OnPrimary, fontWeight: '600' }]}>
            Manage All Agents
          </Text>
        </TouchableOpacity>
      </View>

      {/* Recent Agent Interactions */}
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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.MD }}>
          <Text style={[Typography.titleMedium, { fontWeight: '600' }]}>
            Recent Agent Interactions
          </Text>
          <View style={{
            backgroundColor: LightTheme.primaryContainer,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
          }}>
            <Text style={[Typography.bodySmall, { color: LightTheme.OnPrimaryContainer, fontSize: 10 }]}>
              {agentInteractions.filter(i => !i.resolved).length} Pending
            </Text>
          </View>
        </View>

        {agentInteractions.slice(0, 3).map((interaction) => {
          const agent = aiAgents.find(a => a.id === interaction.agentId);
          return (
            <View key={interaction.id} style={{
              backgroundColor: LightTheme.SurfaceVariant,
              borderRadius: 12,
              padding: Spacing.MD,
              marginBottom: Spacing.SM,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.SM }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={{ fontSize: 16, marginRight: 6 }}>{agent?.avatar}</Text>
                    <Text style={[Typography.bodyMedium, { fontWeight: '600' }]}>
                      {agent?.name.split(' - ')[0] || 'Unknown Agent'}
                    </Text>
                    <Text style={[Typography.bodySmall, { 
                      marginLeft: 8, 
                      color: LightTheme.OnSurfaceVariant,
                      textTransform: 'capitalize' 
                    }]}>
                      {interaction.userType}
                    </Text>
                  </View>
                  <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>
                    {interaction.content.substring(0, 80)}...
                  </Text>
                </View>
                <View style={{
                  backgroundColor: interaction.resolved ? '#E8F5E8' : '#FFF3E0',
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 8,
                }}>
                  <Text style={[Typography.bodySmall, {
                    color: interaction.resolved ? '#2E7D32' : '#F57C00',
                    fontSize: 9,
                  }]}>
                    {interaction.resolved ? 'Resolved' : 'Pending'}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>
                  {interaction.processingTime}s processing time
                </Text>
                {interaction.satisfaction && (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={[Typography.bodySmall, { color: '#FFB300', marginRight: 2 }]}>★</Text>
                    <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>
                      {interaction.satisfaction}/5
                    </Text>
                  </View>
                )}
                <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>
                  {interaction.timestamp.toLocaleTimeString()}
                </Text>
              </View>
            </View>
          );
        })}

        <TouchableOpacity
          style={{
            backgroundColor: LightTheme.Secondary,
            paddingVertical: 10,
            borderRadius: 12,
            alignItems: 'center',
            marginTop: Spacing.SM,
          }}
          onPress={() => setActiveTab('interactions')}
        >
          <Text style={[Typography.bodyMedium, { color: LightTheme.OnSecondary, fontWeight: '600' }]}>
            View All Interactions
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderAgents = () => (
    <View style={{ flex: 1 }}>
      <FlatList
        data={aiAgents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              setSelectedAgent(item);
              setShowAgentModal(true);
            }}
            style={{
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
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.SM }}>
              <Text style={{ fontSize: 40, marginRight: Spacing.MD }}>{item.avatar}</Text>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Text style={[Typography.titleSmall, { fontWeight: '600', flex: 1 }]}>
                    {item.name}
                  </Text>
                  <View style={{
                    backgroundColor: item.status === 'active' ? '#E8F5E8' : 
                                    item.status === 'learning' ? '#E3F2FD' : 
                                    item.status === 'maintenance' ? '#FFF3E0' : '#F5F5F5',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12,
                  }}>
                    <Text style={[Typography.bodySmall, {
                      color: item.status === 'active' ? '#2E7D32' : 
                             item.status === 'learning' ? '#1976D2' : 
                             item.status === 'maintenance' ? '#F57C00' : '#666',
                      fontSize: 10,
                      textTransform: 'capitalize',
                      fontWeight: '600',
                    }]}>
                      {item.status}
                    </Text>
                  </View>
                </View>
                <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant, marginTop: 2 }]}>
                  {item.description}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.SM }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={[Typography.titleSmall, { fontWeight: '600', color: LightTheme.Primary }]}>
                  {item.assignedUsers.toLocaleString()}
                </Text>
                <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>Users</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={[Typography.titleSmall, { fontWeight: '600', color: '#4CAF50' }]}>
                  {item.taskCompletionRate}%
                </Text>
                <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>Success</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={[Typography.titleSmall, { fontWeight: '600', color: '#FF9800' }]}>
                  {item.satisfactionScore}★
                </Text>
                <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>Rating</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={[Typography.titleSmall, { fontWeight: '600', color: '#9C27B0' }]}>
                  {item.autonomyLevel}%
                </Text>
                <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>Autonomy</Text>
              </View>
            </View>

            <View style={{ marginBottom: Spacing.SM }}>
              <Text style={[Typography.bodySmall, { fontWeight: '600', marginBottom: 4 }]}>
                Key Capabilities:
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {item.capabilities.slice(0, 3).map((capability, index) => (
                  <View key={index} style={{
                    backgroundColor: LightTheme.TertiaryContainer,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12,
                    marginRight: 6,
                    marginBottom: 4,
                  }}>
                    <Text style={[Typography.bodySmall, { color: LightTheme.OnTertiaryContainer, fontSize: 10 }]}>
                      {capability}
                    </Text>
                  </View>
                ))}
                {item.capabilities.length > 3 && (
                  <View style={{
                    backgroundColor: LightTheme.SurfaceVariant,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12,
                  }}>
                    <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant, fontSize: 10 }]}>
                      +{item.capabilities.length - 3} more
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>
                Model: {item.modelVersion}
              </Text>
              <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>
                Updated: {item.lastUpdate.toLocaleTimeString()}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: Spacing.MD,
            paddingVertical: Spacing.SM,
          }}>
            <Text style={[Typography.titleMedium, { fontWeight: '600' }]}>
              AI Agent Fleet
            </Text>
            <TouchableOpacity
              onPress={() => Alert.alert('Deploy Agent', 'New AI agent deployment wizard coming soon')}
              style={{
                backgroundColor: LightTheme.Primary,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Icon name="add" size={16} color={LightTheme.OnPrimary} />
              <Text style={[Typography.bodySmall, { color: LightTheme.OnPrimary, marginLeft: 4, fontWeight: '600' }]}>
                Deploy
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'agents':
        return renderAgents();
      case 'interactions':
        return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={Typography.titleMedium}>Agent Interactions Coming Soon</Text>
        </View>;
      case 'tasks':
        return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={Typography.titleMedium}>Agent Tasks Coming Soon</Text>
        </View>;
      case 'performance':
        return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={Typography.titleMedium}>Performance Analytics Coming Soon</Text>
        </View>;
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
            AI Agent Ecosystem
          </Text>
          <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>
            Intelligent Platform Agents & Automation
          </Text>
        </View>
        <TouchableOpacity>
          <Animated.View style={{ transform: [{ scale: pulseAnimation }] }}>
            <Text style={{ fontSize: 24 }}>🤖</Text>
          </Animated.View>
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
            { key: 'agents', label: 'Agents', icon: 'smart-toy' },
            { key: 'interactions', label: 'Interactions', icon: 'chat' },
            { key: 'tasks', label: 'Tasks', icon: 'assignment' },
            { key: 'performance', label: 'Performance', icon: 'analytics' },
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

      {/* Agent Details Modal */}
      <Modal visible={showAgentModal} transparent animationType="slide">
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'flex-end',
        }}>
          <View style={{
            backgroundColor: LightTheme.Surface,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: Spacing.LG,
            maxHeight: '80%',
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: Spacing.LG,
            }}>
              <Text style={[Typography.titleMedium, { fontWeight: '600' }]}>
                Agent Details
              </Text>
              <TouchableOpacity onPress={() => setShowAgentModal(false)}>
                <Icon name="close" size={24} color={LightTheme.OnSurface} />
              </TouchableOpacity>
            </View>

            {selectedAgent && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ alignItems: 'center', marginBottom: Spacing.LG }}>
                  <Text style={{ fontSize: 64 }}>{selectedAgent.avatar}</Text>
                  <Text style={[Typography.titleMedium, { fontWeight: '600', textAlign: 'center' }]}>
                    {selectedAgent.name}
                  </Text>
                  <Text style={[Typography.bodyMedium, { color: LightTheme.OnSurfaceVariant, textAlign: 'center', marginTop: 4 }]}>
                    {selectedAgent.description}
                  </Text>
                </View>

                <View style={{
                  backgroundColor: LightTheme.SurfaceVariant,
                  padding: Spacing.MD,
                  borderRadius: 12,
                  marginBottom: Spacing.MD,
                }}>
                  <Text style={[Typography.bodySmall, { fontWeight: '600', marginBottom: Spacing.SM }]}>
                    Performance Metrics
                  </Text>
                  <Text style={[Typography.bodySmall, { marginBottom: 4 }]}>
                    Users Served: <Text style={{ fontWeight: '600' }}>{selectedAgent.assignedUsers.toLocaleString()}</Text>
                  </Text>
                  <Text style={[Typography.bodySmall, { marginBottom: 4 }]}>
                    Task Success Rate: <Text style={{ fontWeight: '600' }}>{selectedAgent.taskCompletionRate}%</Text>
                  </Text>
                  <Text style={[Typography.bodySmall, { marginBottom: 4 }]}>
                    User Satisfaction: <Text style={{ fontWeight: '600' }}>{selectedAgent.satisfactionScore}★</Text>
                  </Text>
                  <Text style={[Typography.bodySmall]}>
                    Autonomy Level: <Text style={{ fontWeight: '600' }}>{selectedAgent.autonomyLevel}%</Text>
                  </Text>
                </View>

                <TouchableOpacity
                  style={{
                    backgroundColor: LightTheme.Primary,
                    paddingVertical: 12,
                    borderRadius: 25,
                    alignItems: 'center',
                    marginTop: Spacing.MD,
                  }}
                  onPress={() => setShowAgentModal(false)}
                >
                  <Text style={[Typography.bodyMedium, { color: LightTheme.OnPrimary, fontWeight: '600' }]}>
                    Configure Agent
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default AIAgentEcosystem;