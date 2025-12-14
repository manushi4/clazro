/**
 * SupportCenterScreen - Phase 40: Financial Administration & Support
 * Integrated Support Platform Management
 * Multi-channel support tickets, knowledge base, live chat, community forums
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Dimensions,
} from 'react-native';

import { LightTheme } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';

const { width } = Dimensions.get('window');

interface SupportCenterScreenProps {
  adminId: string;
  onNavigate: (screen: string) => void;
}

interface SupportTicket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  submittedBy: string;
  assignedTo: string;
  createdAt: Date;
  lastUpdated: Date;
}

interface KnowledgeArticle {
  id: string;
  title: string;
  category: string;
  views: number;
  helpfulness: number;
  lastUpdated: Date;
  author: string;
}

interface SupportMetric {
  id: string;
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: string;
}

const SupportCenterScreen: React.FC<SupportCenterScreenProps> = ({
  adminId,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'tickets' | 'knowledge' | 'settings'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Mock support data
  const supportMetrics: SupportMetric[] = [
    {
      id: '1',
      title: 'Open Tickets',
      value: '24',
      change: '-12%',
      changeType: 'decrease',
      icon: '🎫',
    },
    {
      id: '2',
      title: 'Avg. Resolution Time',
      value: '4.2h',
      change: '-18%',
      changeType: 'decrease',
      icon: '⏱️',
    },
    {
      id: '3',
      title: 'Customer Satisfaction',
      value: '4.8/5',
      change: '+5%',
      changeType: 'increase',
      icon: '⭐',
    },
    {
      id: '4',
      title: 'Knowledge Base Views',
      value: '1,247',
      change: '+23%',
      changeType: 'increase',
      icon: '📚',
    },
  ];

  const supportTickets: SupportTicket[] = [
    {
      id: '1',
      title: 'Payment Gateway Integration Issue',
      description: 'Unable to complete payment through Razorpay',
      status: 'in-progress',
      priority: 'high',
      category: 'Technical',
      submittedBy: 'John Parent',
      assignedTo: 'Sarah Tech',
      createdAt: new Date('2025-03-01'),
      lastUpdated: new Date('2025-03-02'),
    },
    {
      id: '2',
      title: 'Class Recording Not Available',
      description: 'Yesterday\'s math class recording is missing',
      status: 'open',
      priority: 'medium',
      category: 'Content',
      submittedBy: 'Alex Student',
      assignedTo: 'Mike Support',
      createdAt: new Date('2025-03-02'),
      lastUpdated: new Date('2025-03-02'),
    },
    {
      id: '3',
      title: 'Account Access Locked',
      description: 'Cannot log in after password reset',
      status: 'resolved',
      priority: 'critical',
      category: 'Account',
      submittedBy: 'Emma Teacher',
      assignedTo: 'Lisa Admin',
      createdAt: new Date('2025-02-28'),
      lastUpdated: new Date('2025-03-01'),
    },
  ];

  const knowledgeArticles: KnowledgeArticle[] = [
    {
      id: '1',
      title: 'How to Make Payments',
      category: 'Payments',
      views: 1247,
      helpfulness: 92,
      lastUpdated: new Date('2025-02-28'),
      author: 'Support Team',
    },
    {
      id: '2',
      title: 'Troubleshooting Video Issues',
      category: 'Technical',
      views: 856,
      helpfulness: 88,
      lastUpdated: new Date('2025-02-25'),
      author: 'Tech Team',
    },
    {
      id: '3',
      title: 'Getting Started Guide',
      category: 'General',
      views: 2341,
      helpfulness: 95,
      lastUpdated: new Date('2025-02-20'),
      author: 'Admin Team',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#FF9800';
      case 'in-progress': return '#2196F3';
      case 'resolved': return '#4CAF50';
      case 'closed': return '#757575';
      default: return LightTheme.OnSurfaceVariant;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#F44336';
      case 'high': return '#FF9800';
      case 'medium': return '#2196F3';
      case 'low': return '#4CAF50';
      default: return LightTheme.OnSurfaceVariant;
    }
  };

  const renderHeader = () => (
    <SafeAreaView style={styles.header}>
      <View style={styles.headerContent}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => onNavigate('back')}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Support Center</Text>
          <Text style={styles.headerSubtitle}>Manage Customer Support & Knowledge Base</Text>
        </View>
        <TouchableOpacity style={styles.chatButton}>
          <Text style={styles.chatButtonText}>💬</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  const renderTabSelector = () => (
    <View style={styles.tabContainer}>
      {([
        { key: 'overview', label: 'Overview', icon: '📊' },
        { key: 'tickets', label: 'Tickets', icon: '🎫' },
        { key: 'knowledge', label: 'Knowledge Base', icon: '📚' },
        { key: 'settings', label: 'Settings', icon: '⚙️' },
      ] as const).map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.tab,
            activeTab === tab.key && styles.tabActive
          ]}
          onPress={() => setActiveTab(tab.key)}
        >
          <Text style={styles.tabIcon}>{tab.icon}</Text>
          <Text style={[
            styles.tabText,
            activeTab === tab.key && styles.tabTextActive
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderOverview = () => (
    <View style={styles.overviewContainer}>
      <View style={styles.metricsGrid}>
        {supportMetrics.map((metric) => (
          <View key={metric.id} style={styles.metricCard}>
            <Text style={styles.metricIcon}>{metric.icon}</Text>
            <Text style={styles.metricValue}>{metric.value}</Text>
            <Text style={styles.metricTitle}>{metric.title}</Text>
            <View style={styles.metricChangeContainer}>
              <Text style={[
                styles.metricChange,
                metric.changeType === 'increase' ? styles.metricIncrease :
                metric.changeType === 'decrease' ? styles.metricDecrease :
                styles.metricNeutral
              ]}>
                {metric.change}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.recentTickets}>
        <Text style={styles.sectionTitle}>Recent Tickets</Text>
        {supportTickets.slice(0, 3).map((ticket) => (
          <View key={ticket.id} style={styles.ticketPreview}>
            <View style={styles.ticketHeader}>
              <Text style={styles.ticketTitle}>{ticket.title}</Text>
              <View style={[
                styles.ticketStatus,
                { backgroundColor: getStatusColor(ticket.status) + '20' }
              ]}>
                <Text style={[
                  styles.ticketStatusText,
                  { color: getStatusColor(ticket.status) }
                ]}>
                  {ticket.status}
                </Text>
              </View>
            </View>
            <Text style={styles.ticketDescription} numberOfLines={2}>
              {ticket.description}
            </Text>
            <View style={styles.ticketMeta}>
              <Text style={styles.ticketMetaText}>
                {ticket.submittedBy} • {ticket.createdAt.toLocaleDateString()}
              </Text>
              <View style={[
                styles.priorityTag,
                { backgroundColor: getPriorityColor(ticket.priority) + '20' }
              ]}>
                <Text style={[
                  styles.priorityText,
                  { color: getPriorityColor(ticket.priority) }
                ]}>
                  {ticket.priority}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderTickets = () => (
    <View style={styles.ticketsContainer}>
      <View style={styles.ticketControls}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search tickets..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Status:</Text>
          <TouchableOpacity 
            style={[
              styles.filterButton,
              filterStatus === 'all' && styles.filterButtonActive
            ]}
            onPress={() => setFilterStatus('all')}
          >
            <Text style={[
              styles.filterButtonText,
              filterStatus === 'all' && styles.filterButtonTextActive
            ]}>
              All
            </Text>
          </TouchableOpacity>
          {['open', 'in-progress', 'resolved'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                filterStatus === status && styles.filterButtonActive
              ]}
              onPress={() => setFilterStatus(status)}
            >
              <Text style={[
                styles.filterButtonText,
                filterStatus === status && styles.filterButtonTextActive
              ]}>
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.ticketsList}>
        {supportTickets.map((ticket) => (
          <View key={ticket.id} style={styles.ticketCard}>
            <View style={styles.ticketCardHeader}>
              <View style={styles.ticketInfo}>
                <Text style={styles.ticketCardTitle}>{ticket.title}</Text>
                <Text style={styles.ticketCategory}>#{ticket.id} • {ticket.category}</Text>
              </View>
              <View style={styles.ticketTags}>
                <View style={[
                  styles.statusTag,
                  { backgroundColor: getStatusColor(ticket.status) + '20' }
                ]}>
                  <Text style={[
                    styles.statusTagText,
                    { color: getStatusColor(ticket.status) }
                  ]}>
                    {ticket.status}
                  </Text>
                </View>
                <View style={[
                  styles.priorityTag,
                  { backgroundColor: getPriorityColor(ticket.priority) + '20' }
                ]}>
                  <Text style={[
                    styles.priorityText,
                    { color: getPriorityColor(ticket.priority) }
                  ]}>
                    {ticket.priority}
                  </Text>
                </View>
              </View>
            </View>
            
            <Text style={styles.ticketCardDescription}>
              {ticket.description}
            </Text>
            
            <View style={styles.ticketCardFooter}>
              <Text style={styles.ticketAssignment}>
                Assigned to: {ticket.assignedTo}
              </Text>
              <Text style={styles.ticketDate}>
                {ticket.lastUpdated.toLocaleDateString()}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.createTicketButton}>
        <Text style={styles.createTicketIcon}>+</Text>
        <Text style={styles.createTicketText}>Create New Ticket</Text>
      </TouchableOpacity>
    </View>
  );

  const renderKnowledgeBase = () => (
    <View style={styles.knowledgeContainer}>
      <View style={styles.knowledgeHeader}>
        <Text style={styles.sectionTitle}>Knowledge Base Articles</Text>
        <TouchableOpacity style={styles.addArticleButton}>
          <Text style={styles.addArticleText}>+ Add Article</Text>
        </TouchableOpacity>
      </View>

      {knowledgeArticles.map((article) => (
        <View key={article.id} style={styles.articleCard}>
          <View style={styles.articleHeader}>
            <Text style={styles.articleTitle}>{article.title}</Text>
            <View style={styles.articleCategory}>
              <Text style={styles.articleCategoryText}>{article.category}</Text>
            </View>
          </View>
          
          <View style={styles.articleStats}>
            <View style={styles.articleStat}>
              <Text style={styles.articleStatIcon}>👀</Text>
              <Text style={styles.articleStatText}>{article.views} views</Text>
            </View>
            <View style={styles.articleStat}>
              <Text style={styles.articleStatIcon}>👍</Text>
              <Text style={styles.articleStatText}>{article.helpfulness}% helpful</Text>
            </View>
            <View style={styles.articleStat}>
              <Text style={styles.articleStatIcon}>📝</Text>
              <Text style={styles.articleStatText}>by {article.author}</Text>
            </View>
          </View>
          
          <View style={styles.articleActions}>
            <TouchableOpacity style={styles.editArticleButton}>
              <Text style={styles.editArticleText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.viewArticleButton}>
              <Text style={styles.viewArticleText}>View</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );

  const renderSettings = () => (
    <View style={styles.settingsContainer}>
      <View style={styles.settingsSection}>
        <Text style={styles.settingsTitle}>Support Channels</Text>
        <View style={styles.channelOption}>
          <Text style={styles.channelLabel}>Email Support</Text>
          <Text style={styles.channelStatus}>Active</Text>
        </View>
        <View style={styles.channelOption}>
          <Text style={styles.channelLabel}>Live Chat</Text>
          <Text style={styles.channelStatus}>Active</Text>
        </View>
        <View style={styles.channelOption}>
          <Text style={styles.channelLabel}>Phone Support</Text>
          <Text style={styles.channelStatusInactive}>Inactive</Text>
        </View>
      </View>

      <View style={styles.settingsSection}>
        <Text style={styles.settingsTitle}>Automation Rules</Text>
        <View style={styles.ruleItem}>
          <Text style={styles.ruleText}>Auto-assign tickets based on category</Text>
          <Text style={styles.ruleStatus}>Enabled</Text>
        </View>
        <View style={styles.ruleItem}>
          <Text style={styles.ruleText}>Send follow-up emails after resolution</Text>
          <Text style={styles.ruleStatus}>Enabled</Text>
        </View>
        <View style={styles.ruleItem}>
          <Text style={styles.ruleText}>Escalate critical tickets after 2 hours</Text>
          <Text style={styles.ruleStatus}>Enabled</Text>
        </View>
      </View>

      <View style={styles.settingsSection}>
        <Text style={styles.settingsTitle}>Team Management</Text>
        <View style={styles.teamMember}>
          <Text style={styles.memberName}>Sarah Tech</Text>
          <Text style={styles.memberRole}>Technical Support</Text>
        </View>
        <View style={styles.teamMember}>
          <Text style={styles.memberName}>Mike Support</Text>
          <Text style={styles.memberRole}>Customer Support</Text>
        </View>
        <View style={styles.teamMember}>
          <Text style={styles.memberName}>Lisa Admin</Text>
          <Text style={styles.memberRole}>Support Manager</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderTabSelector()}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'tickets' && renderTickets()}
        {activeTab === 'knowledge' && renderKnowledgeBase()}
        {activeTab === 'settings' && renderSettings()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LightTheme.Background,
  },
  header: {
    backgroundColor: LightTheme.Primary,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.LG,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.MD,
  },
  backButtonText: {
    fontSize: 24,
    color: LightTheme.OnPrimary,
    fontWeight: 'bold',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.titleLarge.fontSize,
    fontFamily: Typography.titleLarge.fontFamily,
    fontWeight: Typography.titleLarge.fontWeight,
    color: LightTheme.OnPrimary,
  },
  headerSubtitle: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnPrimary,
    opacity: 0.8,
  },
  chatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatButtonText: {
    fontSize: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: LightTheme.Surface,
    margin: Spacing.MD,
    borderRadius: 16,
    padding: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.SM,
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: LightTheme.Primary,
  },
  tabIcon: {
    fontSize: 16,
    marginBottom: Spacing.XS,
  },
  tabText: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    fontWeight: '500',
    textAlign: 'center',
  },
  tabTextActive: {
    color: LightTheme.OnPrimary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  overviewContainer: {
    padding: Spacing.MD,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.XS,
    marginBottom: Spacing.LG,
  },
  metricCard: {
    width: (width - Spacing.MD * 2 - Spacing.XS * 2) / 2,
    backgroundColor: LightTheme.Surface,
    margin: Spacing.XS,
    padding: Spacing.LG,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  metricIcon: {
    fontSize: 32,
    marginBottom: Spacing.SM,
  },
  metricValue: {
    fontSize: Typography.headlineSmall.fontSize,
    fontFamily: Typography.headlineSmall.fontFamily,
    fontWeight: Typography.headlineSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  metricTitle: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
    marginBottom: Spacing.SM,
  },
  metricChangeContainer: {
    backgroundColor: LightTheme.SurfaceVariant,
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: 12,
  },
  metricChange: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    fontWeight: '600',
  },
  metricIncrease: {
    color: '#4CAF50',
  },
  metricDecrease: {
    color: '#F44336',
  },
  metricNeutral: {
    color: LightTheme.OnSurfaceVariant,
  },
  recentTickets: {
    marginTop: Spacing.LG,
  },
  sectionTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontFamily: Typography.titleMedium.fontFamily,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.LG,
  },
  ticketPreview: {
    backgroundColor: LightTheme.Surface,
    padding: Spacing.LG,
    borderRadius: 16,
    marginBottom: Spacing.MD,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.SM,
  },
  ticketTitle: {
    flex: 1,
    fontSize: Typography.titleSmall.fontSize,
    fontFamily: Typography.titleSmall.fontFamily,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginRight: Spacing.SM,
  },
  ticketStatus: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: 12,
  },
  ticketStatusText: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  ticketDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.SM,
  },
  ticketMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketMetaText: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
  priorityTag: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  ticketsContainer: {
    padding: Spacing.MD,
  },
  ticketControls: {
    marginBottom: Spacing.LG,
  },
  searchContainer: {
    marginBottom: Spacing.MD,
  },
  searchInput: {
    backgroundColor: LightTheme.Surface,
    padding: Spacing.MD,
    borderRadius: 16,
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurface,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  filterLabel: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurface,
    marginRight: Spacing.SM,
    fontWeight: '500',
  },
  filterButton: {
    backgroundColor: LightTheme.SurfaceVariant,
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: 12,
    marginRight: Spacing.SM,
  },
  filterButtonActive: {
    backgroundColor: LightTheme.Primary,
  },
  filterButtonText: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  filterButtonTextActive: {
    color: LightTheme.OnPrimary,
    fontWeight: '600',
  },
  ticketsList: {
    marginBottom: Spacing.LG,
  },
  ticketCard: {
    backgroundColor: LightTheme.Surface,
    padding: Spacing.LG,
    borderRadius: 16,
    marginBottom: Spacing.MD,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  ticketCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.MD,
  },
  ticketInfo: {
    flex: 1,
  },
  ticketCardTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontFamily: Typography.titleSmall.fontFamily,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  ticketCategory: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
  ticketTags: {
    flexDirection: 'row',
  },
  statusTag: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: 12,
    marginLeft: Spacing.SM,
  },
  statusTagText: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  ticketCardDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.MD,
  },
  ticketCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketAssignment: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
  ticketDate: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
  createTicketButton: {
    backgroundColor: LightTheme.Primary,
    paddingVertical: Spacing.LG,
    alignItems: 'center',
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  createTicketIcon: {
    fontSize: 24,
    color: LightTheme.OnPrimary,
    marginBottom: Spacing.XS,
  },
  createTicketText: {
    fontSize: Typography.bodyLarge.fontSize,
    fontFamily: Typography.bodyLarge.fontFamily,
    fontWeight: '600',
    color: LightTheme.OnPrimary,
  },
  knowledgeContainer: {
    padding: Spacing.MD,
  },
  knowledgeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.LG,
  },
  addArticleButton: {
    backgroundColor: LightTheme.Primary,
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: 12,
  },
  addArticleText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    fontWeight: '600',
    color: LightTheme.OnPrimary,
  },
  articleCard: {
    backgroundColor: LightTheme.Surface,
    padding: Spacing.LG,
    borderRadius: 16,
    marginBottom: Spacing.MD,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  articleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.MD,
  },
  articleTitle: {
    flex: 1,
    fontSize: Typography.titleSmall.fontSize,
    fontFamily: Typography.titleSmall.fontFamily,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginRight: Spacing.SM,
  },
  articleCategory: {
    backgroundColor: LightTheme.primaryContainer,
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: 12,
  },
  articleCategoryText: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    fontWeight: '600',
    color: LightTheme.OnPrimaryContainer,
  },
  articleStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.MD,
  },
  articleStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.MD,
    marginBottom: Spacing.XS,
  },
  articleStatIcon: {
    fontSize: 14,
    marginRight: Spacing.XS,
  },
  articleStatText: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
  articleActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  editArticleButton: {
    backgroundColor: LightTheme.Primary,
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: 8,
    marginRight: Spacing.SM,
  },
  editArticleText: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    fontWeight: '600',
    color: LightTheme.OnPrimary,
  },
  viewArticleButton: {
    backgroundColor: LightTheme.secondaryContainer,
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: 8,
  },
  viewArticleText: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    fontWeight: '600',
    color: LightTheme.OnSecondaryContainer,
  },
  settingsContainer: {
    padding: Spacing.MD,
  },
  settingsSection: {
    backgroundColor: LightTheme.Surface,
    padding: Spacing.LG,
    borderRadius: 16,
    marginBottom: Spacing.MD,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  settingsTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontFamily: Typography.titleMedium.fontFamily,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.LG,
  },
  channelOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  channelLabel: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurface,
  },
  channelStatus: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    fontWeight: '600',
    color: '#4CAF50',
  },
  channelStatusInactive: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    fontWeight: '600',
    color: '#757575',
  },
  ruleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  ruleText: {
    flex: 1,
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurface,
    marginRight: Spacing.SM,
  },
  ruleStatus: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    fontWeight: '600',
    color: '#4CAF50',
  },
  teamMember: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  memberName: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurface,
    fontWeight: '500',
  },
  memberRole: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
});

export default SupportCenterScreen;