import { supabase } from '../../lib/supabase';
import { logger } from '../utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface AuditLogEntry {
  id: string;
  event_type: string;
  user_id?: string;
  user_role?: string;
  entity_type?: string;
  entity_id?: string;
  action: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  device_info: {
    device_id: string;
    brand: string;
    model: string;
    system_name: string;
    system_version: string;
    app_version: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  status: 'success' | 'failure' | 'blocked';
  error_message?: string;
  timestamp: string;
  session_id?: string;
}

export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  policy_type: 'authentication' | 'authorization' | 'data_access' | 'communication' | 'general';
  rules: SecurityRule[];
  is_active: boolean;
  enforcement_level: 'warn' | 'block' | 'monitor';
  created_at: string;
  updated_at: string;
}

export interface SecurityRule {
  id: string;
  condition: string;
  action: 'allow' | 'deny' | 'require_approval' | 'log_only';
  parameters: Record<string, any>;
}

export interface SecurityIncident {
  id: string;
  incident_type: 'unauthorized_access' | 'data_breach' | 'suspicious_activity' | 'policy_violation' | 'system_abuse';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affected_user_id?: string;
  affected_entity_type?: string;
  affected_entity_id?: string;
  detection_method: 'automated' | 'manual' | 'reported';
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  assigned_to?: string;
  remediation_steps: string[];
  related_logs: string[];
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export interface ComplianceReport {
  id: string;
  report_type: 'gdpr' | 'coppa' | 'ferpa' | 'custom';
  period_start: string;
  period_end: string;
  compliance_status: 'compliant' | 'non_compliant' | 'partially_compliant';
  findings: ComplianceFinding[];
  recommendations: string[];
  generated_by: string;
  generated_at: string;
}

export interface ComplianceFinding {
  id: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: string[];
  remediation_required: boolean;
  remediation_deadline?: string;
}

class AuditLoggingService {
  private deviceInfo: any = {};
  private sessionId: string = '';
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Get device information (simplified without DeviceInfo)
      this.deviceInfo = {
        device_id: `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        brand: Platform.OS === 'android' ? 'Android' : 'iOS',
        model: Platform.OS === 'android' ? 'Android Device' : 'iOS Device',
        system_name: Platform.OS,
        system_version: Platform.Version.toString(),
        app_version: '1.0.0',
      };

      // Generate session ID
      this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      this.isInitialized = true;
      logger.info('Audit logging service initialized');

      // Log session start
      await this.logEvent({
        event_type: 'session',
        action: 'session_start',
        details: { session_id: this.sessionId },
        risk_level: 'low',
        status: 'success',
      });

    } catch (error) {
      logger.error('Failed to initialize audit logging service:', error);
    }
  }

  /**
   * Log a security or audit event
   */
  public async logEvent(event: Omit<AuditLogEntry, 'id' | 'timestamp' | 'device_info' | 'session_id'>): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const { data: { user } } = await supabase.auth.getUser();

      const auditEntry: Omit<AuditLogEntry, 'id'> = {
        ...event,
        user_id: user?.id,
        user_role: user?.user_metadata?.role,
        device_info: this.deviceInfo,
        session_id: this.sessionId,
        timestamp: new Date().toISOString(),
      };

      // Store in database
      const { error } = await supabase
        .from('audit_logs')
        .insert(auditEntry);

      if (error) {
        logger.error('Failed to store audit log:', error);
        // Store locally as backup
        await this.storeLocalBackup(auditEntry);
      }

      // Check for security incidents
      await this.analyzeForSecurityIncidents(auditEntry);

    } catch (error) {
      logger.error('Failed to log audit event:', error);
    }
  }

  /**
   * Log authentication events
   */
  public async logAuthentication(action: string, details: any, status: 'success' | 'failure'): Promise<void> {
    await this.logEvent({
      event_type: 'authentication',
      action,
      details,
      risk_level: status === 'failure' ? 'medium' : 'low',
      status,
    });
  }

  /**
   * Log data access events
   */
  public async logDataAccess(
    entityType: string,
    entityId: string,
    action: string,
    details: any
  ): Promise<void> {
    await this.logEvent({
      event_type: 'data_access',
      entity_type: entityType,
      entity_id: entityId,
      action,
      details,
      risk_level: this.assessDataAccessRisk(action, entityType),
      status: 'success',
    });
  }

  /**
   * Log user actions
   */
  public async logUserAction(action: string, details: any, riskLevel: 'low' | 'medium' | 'high' = 'low'): Promise<void> {
    await this.logEvent({
      event_type: 'user_action',
      action,
      details,
      risk_level: riskLevel,
      status: 'success',
    });
  }

  /**
   * Log system events
   */
  public async logSystemEvent(action: string, details: any, status: 'success' | 'failure' = 'success'): Promise<void> {
    await this.logEvent({
      event_type: 'system',
      action,
      details,
      risk_level: status === 'failure' ? 'high' : 'low',
      status,
    });
  }

  /**
   * Log communication events
   */
  public async logCommunication(
    type: 'email' | 'sms' | 'whatsapp' | 'push' | 'chat',
    action: string,
    details: any
  ): Promise<void> {
    await this.logEvent({
      event_type: 'communication',
      action: `${type}_${action}`,
      details,
      risk_level: 'low',
      status: 'success',
    });
  }

  /**
   * Log payment events
   */
  public async logPayment(action: string, details: any, status: 'success' | 'failure'): Promise<void> {
    // Sanitize payment details (remove sensitive info)
    const sanitizedDetails = {
      ...details,
      card_number: details.card_number ? '****' + details.card_number.slice(-4) : undefined,
      cvv: undefined,
    };

    await this.logEvent({
      event_type: 'payment',
      action,
      details: sanitizedDetails,
      risk_level: status === 'failure' ? 'medium' : 'low',
      status,
    });
  }

  /**
   * Get audit logs with filters
   */
  public async getAuditLogs(filters: {
    event_type?: string;
    user_id?: string;
    start_date?: string;
    end_date?: string;
    risk_level?: string;
    limit?: number;
    offset?: number;
  }): Promise<AuditLogEntry[]> {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*');

      if (filters.event_type) {
        query = query.eq('event_type', filters.event_type);
      }

      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      if (filters.start_date) {
        query = query.gte('timestamp', filters.start_date);
      }

      if (filters.end_date) {
        query = query.lte('timestamp', filters.end_date);
      }

      if (filters.risk_level) {
        query = query.eq('risk_level', filters.risk_level);
      }

      query = query
        .limit(filters.limit || 100)
        .offset(filters.offset || 0)
        .order('timestamp', { ascending: false });

      const { data: logs, error } = await query;

      if (error) throw error;
      return logs || [];

    } catch (error) {
      logger.error('Failed to get audit logs:', error);
      return [];
    }
  }

  /**
   * Create security incident
   */
  public async createSecurityIncident(incident: Omit<SecurityIncident, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const incidentData = {
        ...incident,
        detection_method: 'automated',
        status: 'open',
        assigned_to: user?.id,
      };

      const { data: createdIncident, error } = await supabase
        .from('security_incidents')
        .insert(incidentData)
        .select()
        .single();

      if (error) throw error;

      // Log the incident creation
      await this.logEvent({
        event_type: 'security',
        action: 'incident_created',
        details: { 
          incident_id: createdIncident.id, 
          incident_type: incident.incident_type,
          severity: incident.severity 
        },
        risk_level: 'high',
        status: 'success',
      });

      return createdIncident.id;

    } catch (error) {
      logger.error('Failed to create security incident:', error);
      throw error;
    }
  }

  /**
   * Get security policies
   */
  public async getSecurityPolicies(): Promise<SecurityPolicy[]> {
    try {
      const { data: policies, error } = await supabase
        .from('security_policies')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return policies || [];

    } catch (error) {
      logger.error('Failed to get security policies:', error);
      return [];
    }
  }

  /**
   * Evaluate security policy
   */
  public async evaluateSecurityPolicy(
    policyId: string,
    context: Record<string, any>
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const { data: policy, error } = await supabase
        .from('security_policies')
        .select('*')
        .eq('id', policyId)
        .eq('is_active', true)
        .single();

      if (error || !policy) {
        return { allowed: false, reason: 'Policy not found' };
      }

      // Evaluate rules (simplified logic)
      for (const rule of policy.rules) {
        const evaluation = this.evaluateRule(rule, context);
        if (!evaluation.passed) {
          await this.logEvent({
            event_type: 'security',
            action: 'policy_violation',
            details: { policy_id: policyId, rule_id: rule.id, context },
            risk_level: 'medium',
            status: 'blocked',
          });

          return { allowed: false, reason: evaluation.reason };
        }
      }

      return { allowed: true };

    } catch (error) {
      logger.error('Failed to evaluate security policy:', error);
      return { allowed: false, reason: 'Policy evaluation error' };
    }
  }

  /**
   * Generate compliance report
   */
  public async generateComplianceReport(
    reportType: 'gdpr' | 'coppa' | 'ferpa' | 'custom',
    startDate: string,
    endDate: string
  ): Promise<ComplianceReport> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Get relevant audit logs for the period
      const logs = await this.getAuditLogs({
        start_date: startDate,
        end_date: endDate,
        limit: 10000,
      });

      // Analyze logs for compliance
      const findings = this.analyzeComplianceFindings(logs, reportType);

      const report: Omit<ComplianceReport, 'id'> = {
        report_type: reportType,
        period_start: startDate,
        period_end: endDate,
        compliance_status: findings.length === 0 ? 'compliant' : 
                          findings.some(f => f.severity === 'critical' || f.severity === 'high') ? 'non_compliant' : 'partially_compliant',
        findings,
        recommendations: this.generateComplianceRecommendations(findings),
        generated_by: user?.id || 'system',
        generated_at: new Date().toISOString(),
      };

      const { data: savedReport, error } = await supabase
        .from('compliance_reports')
        .insert(report)
        .select()
        .single();

      if (error) throw error;

      return savedReport;

    } catch (error) {
      logger.error('Failed to generate compliance report:', error);
      throw error;
    }
  }

  /**
   * Clean up old audit logs
   */
  public async cleanupOldLogs(retentionDays: number = 365): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const { error } = await supabase
        .from('audit_logs')
        .delete()
        .lt('timestamp', cutoffDate.toISOString());

      if (error) throw error;

      await this.logEvent({
        event_type: 'system',
        action: 'audit_logs_cleanup',
        details: { retention_days: retentionDays, cutoff_date: cutoffDate.toISOString() },
        risk_level: 'low',
        status: 'success',
      });

    } catch (error) {
      logger.error('Failed to cleanup old audit logs:', error);
    }
  }

  // Private helper methods

  private async storeLocalBackup(auditEntry: any): Promise<void> {
    try {
      const existing = await AsyncStorage.getItem('audit_backup');
      const backup = existing ? JSON.parse(existing) : [];
      backup.push(auditEntry);

      // Keep only last 100 entries
      if (backup.length > 100) {
        backup.splice(0, backup.length - 100);
      }

      await AsyncStorage.setItem('audit_backup', JSON.stringify(backup));
    } catch (error) {
      logger.error('Failed to store audit backup:', error);
    }
  }

  private assessDataAccessRisk(action: string, entityType: string): 'low' | 'medium' | 'high' | 'critical' {
    const highRiskActions = ['delete', 'export', 'download'];
    const highRiskEntities = ['payment', 'user', 'admin'];

    if (highRiskActions.includes(action) && highRiskEntities.includes(entityType)) {
      return 'critical';
    } else if (highRiskActions.includes(action) || highRiskEntities.includes(entityType)) {
      return 'high';
    } else if (action === 'update') {
      return 'medium';
    } else {
      return 'low';
    }
  }

  private async analyzeForSecurityIncidents(auditEntry: any): Promise<void> {
    // Simplified incident detection logic
    if (auditEntry.risk_level === 'critical' || 
        (auditEntry.risk_level === 'high' && auditEntry.status === 'failure')) {
      
      await this.createSecurityIncident({
        incident_type: 'suspicious_activity',
        severity: auditEntry.risk_level === 'critical' ? 'critical' : 'high',
        title: `Suspicious ${auditEntry.event_type} activity detected`,
        description: `${auditEntry.action} failed with high risk level`,
        affected_user_id: auditEntry.user_id,
        detection_method: 'automated',
        status: 'open',
        remediation_steps: ['Review user activity', 'Verify legitimacy', 'Take appropriate action'],
        related_logs: [auditEntry.id],
      });
    }
  }

  private evaluateRule(rule: SecurityRule, context: Record<string, any>): { passed: boolean; reason?: string } {
    // Simplified rule evaluation
    try {
      // This would contain more sophisticated rule evaluation logic
      return { passed: true };
    } catch (error) {
      return { passed: false, reason: 'Rule evaluation error' };
    }
  }

  private analyzeComplianceFindings(logs: AuditLogEntry[], reportType: string): ComplianceFinding[] {
    const findings: ComplianceFinding[] = [];

    // Simplified compliance analysis
    if (reportType === 'gdpr') {
      // Check for data processing without consent
      const dataAccessLogs = logs.filter(log => log.event_type === 'data_access');
      if (dataAccessLogs.length > 1000) {
        findings.push({
          id: 'gdpr_001',
          category: 'Data Processing',
          severity: 'medium',
          description: 'High volume of data access detected',
          evidence: [`${dataAccessLogs.length} data access events`],
          remediation_required: true,
          remediation_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }
    }

    return findings;
  }

  private generateComplianceRecommendations(findings: ComplianceFinding[]): string[] {
    const recommendations: string[] = [];

    if (findings.length === 0) {
      recommendations.push('Continue monitoring and maintaining current compliance practices');
    } else {
      recommendations.push('Address critical and high severity findings immediately');
      recommendations.push('Implement additional monitoring for identified risk areas');
      recommendations.push('Review and update security policies as needed');
    }

    return recommendations;
  }
}

// Export singleton instance
export const auditLoggingService = new AuditLoggingService();
export default AuditLoggingService;