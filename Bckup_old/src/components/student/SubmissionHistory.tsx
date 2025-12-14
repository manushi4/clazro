import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import {
  Card,
  Button,
  IconButton,
  Chip,
  Searchbar,
  Menu,
  Portal,
  Modal,
  FAB,
  List,
  Divider,
  Surface,
  ProgressBar,
  Badge,
} from 'react-native-paper';
import { useTheme } from '../../context/ThemeContext';
import { DoubtSubmission } from './DoubtSubmissionForm';
import DoubtPreview from './DoubtPreview';

const { width, height } = Dimensions.get('window');

export interface SubmissionHistoryStats {
  totalSubmissions: number;
  answeredCount: number;
  pendingCount: number;
  draftCount: number;
  averageResponseTime: number; // in hours
  mostActiveSubject: string;
  successRate: number; // percentage of answered questions
}

export interface SubmissionFilter {
  status?: 'All' | 'Draft' | 'Submitted' | 'Under Review' | 'Answered' | 'Closed';
  priority?: 'All' | 'Low' | 'Medium' | 'High' | 'Urgent';
  subject?: 'All' | string;
  dateRange?: 'All' | 'Today' | 'Week' | 'Month' | 'Year';
  sortBy?: 'Recent' | 'Oldest' | 'Priority' | 'Status' | 'Subject';
  searchQuery?: string;
}

export interface SubmissionHistoryProps {
  submissions: DoubtSubmission[];
  onSubmissionSelect: (submission: DoubtSubmission) => void;
  onNewSubmission: () => void;
  onDeleteSubmission?: (submissionId: string) => Promise<void>;
  onDuplicateSubmission?: (submission: DoubtSubmission) => void;
  refreshing?: boolean;
  onRefresh?: () => Promise<void>;
  showStats?: boolean;
}

const SubmissionHistory: React.FC<SubmissionHistoryProps> = ({
  submissions,
  onSubmissionSelect,
  onNewSubmission,
  onDeleteSubmission,
  onDuplicateSubmission,
  refreshing = false,
  onRefresh,
  showStats = true,
}) => {
  const { theme } = useTheme();
  
  // State management
  const [filter, setFilter] = useState<SubmissionFilter>({
    status: 'All',
    priority: 'All',
    subject: 'All',
    dateRange: 'All',
    sortBy: 'Recent',
    searchQuery: '',
  });
  const [selectedSubmission, setSelectedSubmission] = useState<DoubtSubmission | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedSubmissionForMenu, setSelectedSubmissionForMenu] = useState<DoubtSubmission | null>(null);
  const [showStatsModal, setShowStatsModal] = useState(false);

  // Calculate statistics
  const stats = useMemo((): SubmissionHistoryStats => {
    const total = submissions.length;
    const answered = submissions.filter(s => s.status === 'Answered').length;
    const pending = submissions.filter(s => ['Submitted', 'Under Review'].includes(s.status)).length;
    const drafts = submissions.filter(s => s.status === 'Draft').length;
    
    // Calculate average response time (mock calculation)
    const avgResponseTime = answered > 0 ? Math.round(Math.random() * 24 + 2) : 0;
    
    // Find most active subject
    const subjectCounts = submissions.reduce((acc, s) => {
      if (s.category?.subject) {
        acc[s.category.subject] = (acc[s.category.subject] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const mostActiveSubject = Object.entries(subjectCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';
    
    const successRate = total > 0 ? Math.round((answered / total) * 100) : 0;

    return {
      totalSubmissions: total,
      answeredCount: answered,
      pendingCount: pending,
      draftCount: drafts,
      averageResponseTime: avgResponseTime,
      mostActiveSubject,
      successRate,
    };
  }, [submissions]);

  // Filter and sort submissions
  const filteredSubmissions = useMemo(() => {
    let filtered = [...submissions];

    // Apply filters
    if (filter.status !== 'All') {
      filtered = filtered.filter(s => s.status === filter.status);
    }

    if (filter.priority !== 'All') {
      filtered = filtered.filter(s => s.priority === filter.priority);
    }

    if (filter.subject !== 'All') {
      filtered = filtered.filter(s => s.category?.subject === filter.subject);
    }

    if (filter.dateRange !== 'All') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filter.dateRange) {
        case 'Today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'Week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'Month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'Year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(s => new Date(s.createdAt) >= filterDate);
    }

    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.title.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        s.tags.some(tag => tag.toLowerCase().includes(query)) ||
        s.category?.subject?.toLowerCase().includes(query) ||
        s.category?.chapter?.toLowerCase().includes(query) ||
        s.category?.topic?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    switch (filter.sortBy) {
      case 'Recent':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'Oldest':
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'Priority':
        const priorityOrder = { 'Urgent': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
        filtered.sort((a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0));
        break;
      case 'Status':
        const statusOrder = { 'Draft': 1, 'Submitted': 2, 'Under Review': 3, 'Answered': 4, 'Closed': 5 };
        filtered.sort((a, b) => (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0));
        break;
      case 'Subject':
        filtered.sort((a, b) => (a.category?.subject || '').localeCompare(b.category?.subject || ''));
        break;
    }

    return filtered;
  }, [submissions, filter]);

  // Get unique subjects for filter
  const availableSubjects = useMemo(() => {
    const subjects = new Set(submissions.map(s => s.category?.subject).filter(Boolean));
    return ['All', ...Array.from(subjects)];
  }, [submissions]);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return '#9E9E9E';
      case 'Submitted': return theme.primary;
      case 'Under Review': return '#FF9800';
      case 'Answered': return '#4CAF50';
      case 'Closed': return '#F44336';
      default: return theme.OnSurfaceVariant;
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return theme.error;
      case 'High': return '#FF9800';
      case 'Medium': return theme.primary;
      case 'Low': return '#9E9E9E';
      default: return theme.OnSurfaceVariant;
    }
  };

  // Handle submission item press
  const handleSubmissionPress = useCallback((submission: DoubtSubmission) => {
    setSelectedSubmission(submission);
    setShowPreview(true);
  }, []);

  // Handle submission menu
  const handleSubmissionMenu = useCallback((submission: DoubtSubmission) => {
    setSelectedSubmissionForMenu(submission);
    setMenuVisible(true);
  }, []);

  // Handle delete submission
  const handleDeleteSubmission = useCallback(async (submission: DoubtSubmission) => {
    setMenuVisible(false);
    
    Alert.alert(
      'Delete Submission',
      `Are you sure you want to delete "${submission.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (onDeleteSubmission) {
              try {
                await onDeleteSubmission(submission.id);
              } catch (error) {
                Alert.alert('error', 'Failed to delete submission');
              }
            }
          },
        },
      ]
    );
  }, [onDeleteSubmission]);

  // Handle duplicate submission
  const handleDuplicateSubmission = useCallback((submission: DoubtSubmission) => {
    setMenuVisible(false);
    
    if (onDuplicateSubmission) {
      onDuplicateSubmission(submission);
    }
  }, [onDuplicateSubmission]);

  // Render statistics card
  const renderStatsCard = () => {
    if (!showStats) return null;

    return (
      <Card style={{ margin: 16 }}>
        <Card.Content>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: theme.OnSurface,
            }}>
              Your Activity
            </Text>
            
            <Button
              mode="text"
              onPress={() => setShowStatsModal(true)}
              icon="chart-line"
              compact
            >
              Details
            </Button>
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{
                fontSize: 24,
                fontWeight: '700',
                color: theme.primary,
              }}>
                {stats.totalSubmissions}
              </Text>
              <Text style={{
                fontSize: 12,
                color: theme.OnSurfaceVariant,
              }}>
                Total Doubts
              </Text>
            </View>
            
            <View style={{ alignItems: 'center' }}>
              <Text style={{
                fontSize: 24,
                fontWeight: '700',
                color: '#4CAF50',
              }}>
                {stats.answeredCount}
              </Text>
              <Text style={{
                fontSize: 12,
                color: theme.OnSurfaceVariant,
              }}>
                Answered
              </Text>
            </View>
            
            <View style={{ alignItems: 'center' }}>
              <Text style={{
                fontSize: 24,
                fontWeight: '700',
                color: '#FF9800',
              }}>
                {stats.pendingCount}
              </Text>
              <Text style={{
                fontSize: 12,
                color: theme.OnSurfaceVariant,
              }}>
                Pending
              </Text>
            </View>
            
            <View style={{ alignItems: 'center' }}>
              <Text style={{
                fontSize: 24,
                fontWeight: '700',
                color: '#9E9E9E',
              }}>
                {stats.draftCount}
              </Text>
              <Text style={{
                fontSize: 12,
                color: theme.OnSurfaceVariant,
              }}>
                Drafts
              </Text>
            </View>
          </View>
          
          <Divider style={{ marginVertical: 16 }} />
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text style={{
                fontSize: 14,
                color: theme.OnSurfaceVariant,
                marginBottom: 4,
              }}>
                Success Rate
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ProgressBar 
                  progress={stats.successRate / 100} 
                  color={theme.primary}
                  style={{ flex: 1, height: 6, borderRadius: 3 }}
                />
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: theme.primary,
                }}>
                  {stats.successRate}%
                </Text>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  // Render filter controls
  const renderFilterControls = () => (
    <Card style={{ margin: 16 }}>
      <Card.Content>
        <Searchbar
          placeholder="Search doubts..."
          onChangeText={(query) => setFilter(prev => ({ ...prev, searchQuery: query }))}
          value={filter.searchQuery}
          style={{ marginBottom: 12 }}
        />
        
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Chip
            mode={showFilters ? 'flat' : 'outlined'}
            onPress={() => setShowFilters(!showFilters)}
            icon="filter-variant"
          >
            Filters
          </Chip>
          
          {filter.status !== 'All' && (
            <Chip
              mode="flat"
              onClose={() => setFilter(prev => ({ ...prev, status: 'All' }))}
              style={{ backgroundColor: getStatusColor(filter.status) + '20' }}
            >
              {filter.status}
            </Chip>
          )}
          
          {filter.priority !== 'All' && (
            <Chip
              mode="flat"
              onClose={() => setFilter(prev => ({ ...prev, priority: 'All' }))}
              style={{ backgroundColor: getPriorityColor(filter.priority) + '20' }}
            >
              {filter.priority} Priority
            </Chip>
          )}
          
          {filter.subject !== 'All' && (
            <Chip
              mode="flat"
              onClose={() => setFilter(prev => ({ ...prev, subject: 'All' }))}
            >
              {filter.subject}
            </Chip>
          )}
          
          {filter.dateRange !== 'All' && (
            <Chip
              mode="flat"
              onClose={() => setFilter(prev => ({ ...prev, dateRange: 'All' }))}
            >
              {filter.dateRange}
            </Chip>
          )}
        </View>
        
        {showFilters && (
          <View style={{ marginTop: 16, gap: 12 }}>
            <View>
              <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 4, color: theme.OnSurface }}>
                Status
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                {['All', 'Draft', 'Submitted', 'Under Review', 'Answered', 'Closed'].map((status) => (
                  <Chip
                    key={status}
                    mode={filter.status === status ? 'flat' : 'outlined'}
                    onPress={() => setFilter(prev => ({ ...prev, status: status as any }))}
                    compact
                  >
                    {status}
                  </Chip>
                ))}
              </View>
            </View>
            
            <View>
              <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 4, color: theme.OnSurface }}>
                Priority
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                {['All', 'Low', 'Medium', 'High', 'Urgent'].map((priority) => (
                  <Chip
                    key={priority}
                    mode={filter.priority === priority ? 'flat' : 'outlined'}
                    onPress={() => setFilter(prev => ({ ...prev, priority: priority as any }))}
                    compact
                  >
                    {priority}
                  </Chip>
                ))}
              </View>
            </View>
            
            <View>
              <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 4, color: theme.OnSurface }}>
                Subject
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                {availableSubjects.map((subject) => (
                  <Chip
                    key={subject}
                    mode={filter.subject === subject ? 'flat' : 'outlined'}
                    onPress={() => setFilter(prev => ({ ...prev, subject }))}
                    compact
                  >
                    {subject}
                  </Chip>
                ))}
              </View>
            </View>
            
            <View>
              <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 4, color: theme.OnSurface }}>
                Sort By
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                {['Recent', 'Oldest', 'Priority', 'Status', 'Subject'].map((sortBy) => (
                  <Chip
                    key={sortBy}
                    mode={filter.sortBy === sortBy ? 'flat' : 'outlined'}
                    onPress={() => setFilter(prev => ({ ...prev, sortBy: sortBy as any }))}
                    compact
                  >
                    {sortBy}
                  </Chip>
                ))}
              </View>
            </View>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  // Render submission item
  const renderSubmissionItem = ({ item: submission }: { item: DoubtSubmission }) => (
    <Card 
      style={{ 
        margin: 8,
        marginHorizontal: 16,
      }}
      onPress={() => handleSubmissionPress(submission)}
    >
      <Card.Content>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <Text 
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: theme.OnSurface,
              flex: 1,
              marginRight: 8,
            }}
            numberOfLines={2}
          >
            {submission.title}
          </Text>
          
          <IconButton
            icon="dots-vertical"
            size={20}
            onPress={() => handleSubmissionMenu(submission)}
          />
        </View>
        
        <Text 
          style={{
            fontSize: 14,
            color: theme.OnSurfaceVariant,
            marginBottom: 12,
          }}
          numberOfLines={2}
        >
          {submission.description}
        </Text>
        
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
          <Chip 
            mode="outlined" 
            compact
            style={{ 
              backgroundColor: getStatusColor(submission.status) + '20',
              borderColor: getStatusColor(submission.status),
            }}
          >
            {submission.status}
          </Chip>
          
          <Chip 
            mode="outlined" 
            compact
            style={{ 
              backgroundColor: getPriorityColor(submission.priority) + '20',
              borderColor: getPriorityColor(submission.priority),
            }}
          >
            {submission.priority}
          </Chip>
          
          {submission.category?.subject && (
            <Chip mode="outlined" compact>
              {submission.category.subject}
            </Chip>
          )}
        </View>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{
            fontSize: 12,
            color: theme.OnSurfaceVariant,
          }}>
            {new Date(submission.createdAt).toLocaleDateString()}
          </Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {submission.attachments && (
              Object.values(submission.attachments).reduce((sum, arr) => sum + (arr?.length || 0), 0) > 0 && (
                <Badge style={{ backgroundColor: theme.primary }}>
                  {Object.values(submission.attachments).reduce((sum, arr) => sum + (arr?.length || 0), 0)}
                </Badge>
              )
            )}
            
            {submission.tags.length > 0 && (
              <Text style={{
                fontSize: 12,
                color: theme.OnSurfaceVariant,
              }}>
                {submission.tags.length} tag{submission.tags.length > 1 ? 's' : ''}
              </Text>
            )}
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    }}>
      <Text style={{
        fontSize: 18,
        fontWeight: '600',
        color: theme.OnSurfaceVariant,
        textAlign: 'center',
        marginBottom: 8,
      }}>
        {filter.searchQuery || filter.status !== 'All' || filter.priority !== 'All' || filter.subject !== 'All' || filter.dateRange !== 'All'
          ? 'No doubts match your filters'
          : 'No doubts submitted yet'
        }
      </Text>
      
      <Text style={{
        fontSize: 14,
        color: theme.OnSurfaceVariant,
        textAlign: 'center',
        marginBottom: 16,
      }}>
        {filter.searchQuery || filter.status !== 'All' || filter.priority !== 'All' || filter.subject !== 'All' || filter.dateRange !== 'All'
          ? 'Try adjusting your filters to see more results'
          : 'Start by submitting your first doubt'
        }
      </Text>
      
      <Button
        mode="contained"
        onPress={onNewSubmission}
        icon="plus"
      >
        New Doubt
      </Button>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {renderStatsCard()}
      {renderFilterControls()}
      
      {filteredSubmissions.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredSubmissions}
          renderItem={renderSubmissionItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            ) : undefined
          }
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}
      
      {/* Floating Action Button */}
      <FAB
        style={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          backgroundColor: theme.primary,
        }}
        icon="plus"
        onPress={onNewSubmission}
      />
      
      {/* Submission Preview Modal */}
      <Portal>
        <Modal
          visible={showPreview}
          onDismiss={() => setShowPreview(false)}
          contentContainerStyle={{
            backgroundColor: theme.Surface,
            margin: 20,
            borderRadius: 12,
            maxHeight: height * 0.9,
          }}
        >
          {selectedSubmission && (
            <DoubtPreview
              submission={selectedSubmission}
              onEdit={() => {
                setShowPreview(false);
                onSubmissionSelect(selectedSubmission);
              }}
              onSubmit={() => {
                setShowPreview(false);
                onSubmissionSelect(selectedSubmission);
              }}
              onCancel={() => setShowPreview(false)}
              readOnly={selectedSubmission.status !== 'Draft'}
            />
          )}
        </Modal>
        
        {/* Submission Menu */}
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={<View />}
        >
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              if (selectedSubmissionForMenu) {
                onSubmissionSelect(selectedSubmissionForMenu);
              }
            }}
            title="View/Edit"
            leadingIcon="eye"
          />
          
          {onDuplicateSubmission && (
            <Menu.Item
              onPress={() => {
                if (selectedSubmissionForMenu) {
                  handleDuplicateSubmission(selectedSubmissionForMenu);
                }
              }}
              title="Duplicate"
              leadingIcon="content-duplicate"
            />
          )}
          
          {onDeleteSubmission && selectedSubmissionForMenu?.status === 'Draft' && (
            <Menu.Item
              onPress={() => {
                if (selectedSubmissionForMenu) {
                  handleDeleteSubmission(selectedSubmissionForMenu);
                }
              }}
              title="Delete"
              leadingIcon="delete"
              titleStyle={{ color: theme.error }}
            />
          )}
        </Menu>
        
        {/* Stats Detail Modal */}
        <Modal
          visible={showStatsModal}
          onDismiss={() => setShowStatsModal(false)}
          contentContainerStyle={{
            backgroundColor: theme.Surface,
            margin: 20,
            borderRadius: 12,
            maxHeight: height * 0.7,
          }}
        >
          <View style={{ padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: theme.OnSurface,
              }}>
                Detailed Statistics
              </Text>
              
              <IconButton
                icon="close"
                onPress={() => setShowStatsModal(false)}
              />
            </View>
            
            <ScrollView>
              <List.Item
                title="Total Submissions"
                description="All doubts you've submitted"
                right={() => <Text style={{ fontSize: 18, fontWeight: '600' }}>{stats.totalSubmissions}</Text>}
              />
              
              <List.Item
                title="Success Rate"
                description="Percentage of answered doubts"
                right={() => <Text style={{ fontSize: 18, fontWeight: '600', color: theme.primary }}>{stats.successRate}%</Text>}
              />
              
              <List.Item
                title="Average Response Time"
                description="How quickly your doubts get answered"
                right={() => <Text style={{ fontSize: 18, fontWeight: '600' }}>{stats.averageResponseTime}h</Text>}
              />
              
              <List.Item
                title="Most Active Subject"
                description="Subject you ask about most"
                right={() => <Text style={{ fontSize: 18, fontWeight: '600' }}>{stats.mostActiveSubject}</Text>}
              />
              
              <Divider style={{ marginVertical: 8 }} />
              
              <List.Item
                title="Answered"
                description="Doubts that have been resolved"
                right={() => <Text style={{ fontSize: 18, fontWeight: '600', color: '#4CAF50' }}>{stats.answeredCount}</Text>}
              />
              
              <List.Item
                title="Pending Review"
                description="Doubts waiting for response"
                right={() => <Text style={{ fontSize: 18, fontWeight: '600', color: '#FF9800' }}>{stats.pendingCount}</Text>}
              />
              
              <List.Item
                title="Draft Submissions"
                description="Incomplete doubt submissions"
                right={() => <Text style={{ fontSize: 18, fontWeight: '600', color: '#9E9E9E' }}>{stats.draftCount}</Text>}
              />
            </ScrollView>
          </View>
        </Modal>
      </Portal>
    </View>
  );
};

export default SubmissionHistory;