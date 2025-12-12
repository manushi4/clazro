import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Phase 78 AI Services
import { aiLearningRecommendationService } from '../../services/ai/AILearningRecommendationService';
import { adaptiveLearningPathService } from '../../services/ai/AdaptiveLearningPathService';
import { intelligentPerformanceAnalyticsService } from '../../services/ai/IntelligentPerformanceAnalyticsService';
import { personalizedStudyAssistantService } from '../../services/ai/PersonalizedStudyAssistantService';
import { phase78IntegrationService } from '../../services/integration/Phase78IntegrationService';

// Phase 77 Services (for integration testing)
import { videoCallService } from '../../services/video/VideoCallService';
import { notificationService } from '../../services/notifications/NotificationService';

interface ValidationResult {
  service: string;
  status: 'success' | 'error' | 'pending';
  message: string;
}

const Phase78ValidationScreen: React.FC = () => {
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const runValidationTests = async () => {
    setIsValidating(true);
    const results: ValidationResult[] = [];

    // Test AI Learning Recommendation Service
    try {
      const recommendations = await aiLearningRecommendationService.getRecommendations('test-user-id');
      results.push({
        service: 'AI Learning Recommendations',
        status: 'success',
        message: `Service initialized successfully. Ready to generate recommendations.`
      });
    } catch (error) {
      results.push({
        service: 'AI Learning Recommendations',
        status: 'error',
        message: `Error: ${error}`
      });
    }

    // Test Adaptive Learning Path Service
    try {
      const userAnalysis = await adaptiveLearningPathService.analyzeUserPerformance('test-user-id');
      results.push({
        service: 'Adaptive Learning Paths',
        status: 'success',
        message: `Service active. Performance analysis system operational.`
      });
    } catch (error) {
      results.push({
        service: 'Adaptive Learning Paths',
        status: 'error',
        message: `Error: ${error}`
      });
    }

    // Test Intelligent Performance Analytics
    try {
      const metrics = await intelligentPerformanceAnalyticsService.getUserMetrics('test-user-id');
      results.push({
        service: 'Performance Analytics',
        status: 'success',
        message: `Analytics engine running. Metrics collection active.`
      });
    } catch (error) {
      results.push({
        service: 'Performance Analytics',
        status: 'error',
        message: `Error: ${error}`
      });
    }

    // Test Personalized Study Assistant
    try {
      const studyPlan = await personalizedStudyAssistantService.createPersonalizedStudyPlan(
        'test-user-id',
        'Mathematics',
        ['Algebra', 'Geometry'],
        { dailyMinutes: 60, totalDays: 7 },
        { enabled: true, preferredTypes: ['study_group'] },
        'intermediate'
      );
      results.push({
        service: 'Personalized Study Assistant',
        status: 'success',
        message: `Study plan created successfully. ID: ${studyPlan.id}`
      });
    } catch (error) {
      results.push({
        service: 'Personalized Study Assistant',
        status: 'error',
        message: `Error: ${error}`
      });
    }

    // Test Phase 78 Integration Service
    try {
      const integrationStatus = phase78IntegrationService.getIntegrationStatus();
      results.push({
        service: 'Phase 78 Integration',
        status: 'success',
        message: `Integration active: ${integrationStatus.isActive}. Services: ${integrationStatus.activeServices.join(', ')}`
      });
    } catch (error) {
      results.push({
        service: 'Phase 78 Integration',
        status: 'error',
        message: `Error: ${error}`
      });
    }

    // Test Phase 77-78 Integration Points
    try {
      // Test video call service access from Phase 78
      const videoCallSession = await videoCallService.createVideoCall(
        'test-host-id',
        'Test Integration Call',
        {
          allowStudentVideo: true,
          allowStudentAudio: true,
          requirePermissionToJoin: false,
          enableChat: true,
          enableScreenShare: true,
          enableWhiteboard: true,
          recordingEnabled: false
        },
        {
          subject: 'Integration Test',
          sessionType: 'live_class'
        }
      );

      // Test notification service integration
      await notificationService.sendNotification('test-user-id', {
        title: 'Phase 78 Integration Test',
        body: 'AI services are now integrated with real-time collaboration',
        data: { source: 'phase78_validation' }
      });

      results.push({
        service: 'Phase 77-78 Integration',
        status: 'success',
        message: `Cross-phase integration working. Video call ID: ${videoCallSession.id}`
      });
    } catch (error) {
      results.push({
        service: 'Phase 77-78 Integration',
        status: 'error',
        message: `Error: ${error}`
      });
    }

    setValidationResults(results);
    setIsValidating(false);
  };

  const getStatusIcon = (status: ValidationResult['status']) => {
    switch (status) {
      case 'success':
        return <Icon name="check-circle" size={24} color="#4CAF50" />;
      case 'error':
        return <Icon name="error" size={24} color="#F44336" />;
      case 'pending':
        return <Icon name="hourglass-empty" size={24} color="#FF9800" />;
    }
  };

  const getStatusColor = (status: ValidationResult['status']) => {
    switch (status) {
      case 'success':
        return '#E8F5E8';
      case 'error':
        return '#FFEBEE';
      case 'pending':
        return '#FFF3E0';
    }
  };

  useEffect(() => {
    // Auto-run validation on screen load
    runValidationTests();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Phase 78 Validation</Text>
        <Text style={styles.headerSubtitle}>
          AI-Powered Learning Analytics & Personalization Suite
        </Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Integration Status</Text>
        <Text style={styles.summaryText}>
          Validating AI services and Phase 77-78 integration points
        </Text>
      </View>

      <ScrollView style={styles.resultsContainer}>
        {validationResults.map((result, index) => (
          <View 
            key={index} 
            style={[
              styles.resultCard,
              { backgroundColor: getStatusColor(result.status) }
            ]}
          >
            <View style={styles.resultHeader}>
              {getStatusIcon(result.status)}
              <Text style={styles.resultService}>{result.service}</Text>
            </View>
            <Text style={styles.resultMessage}>{result.message}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.validateButton, isValidating && styles.disabledButton]}
          onPress={runValidationTests}
          disabled={isValidating}
        >
          <Icon name="refresh" size={20} color="#FFFFFF" />
          <Text style={styles.validateButtonText}>
            {isValidating ? 'Validating...' : 'Re-run Validation'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#6750A4',
    padding: 24,
    paddingTop: 48,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E8DEF8',
    opacity: 0.9,
  },
  summaryCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1B1F',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#49454F',
    lineHeight: 20,
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  resultCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E7E0EC',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultService: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1B1F',
    marginLeft: 12,
    flex: 1,
  },
  resultMessage: {
    fontSize: 14,
    color: '#49454F',
    lineHeight: 18,
    paddingLeft: 36,
  },
  actionContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E7E0EC',
  },
  validateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6750A4',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  disabledButton: {
    backgroundColor: '#938F99',
  },
  validateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});

export default Phase78ValidationScreen;