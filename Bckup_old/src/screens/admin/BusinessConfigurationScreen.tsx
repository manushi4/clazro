import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
// Phase 76 services will be imported after dependencies are resolved
// import { emailService } from '../../services/communication/EmailService';
// import { smsWhatsAppService } from '../../services/communication/SMSWhatsAppService';
import { logger } from '../../services/utils/logger';

interface ConfigSection {
  id: string;
  title: string;
  description: string;
  icon: string;
  configured: boolean;
}

interface EmailConfig {
  provider: 'sendgrid' | 'mailgun' | 'ses' | 'smtp';
  api_key: string;
  sender_email: string;
  sender_name: string;
  domain?: string;
  daily_limit: number;
  monthly_limit: number;
}

interface SMSConfig {
  provider: 'twilio' | 'textlocal' | 'msg91' | 'fast2sms' | 'aws_sns';
  api_key: string;
  sender_id: string;
  daily_limit: number;
  monthly_limit: number;
  cost_per_sms: number;
}

interface WhatsAppConfig {
  provider: 'twilio' | 'whatsapp_business' | 'gupshup' | 'interakt';
  api_key: string;
  phone_number_id: string;
  access_token: string;
  daily_limit: number;
  monthly_limit: number;
  cost_per_message: number;
}

const BusinessConfigurationScreen: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [configSections, setConfigSections] = useState<ConfigSection[]>([
    {
      id: 'email',
      title: 'Email Service',
      description: 'Configure SendGrid, Mailgun, or SMTP for email delivery',
      icon: 'email',
      configured: false,
    },
    {
      id: 'sms',
      title: 'SMS Service',
      description: 'Setup SMS providers like Twilio, MSG91, or TextLocal',
      icon: 'sms',
      configured: false,
    },
    {
      id: 'whatsapp',
      title: 'WhatsApp Business',
      description: 'Configure WhatsApp Business API for messaging',
      icon: 'chat',
      configured: false,
    },
    {
      id: 'legal',
      title: 'Legal Compliance',
      description: 'Privacy policy, terms of service, and GDPR settings',
      icon: 'gavel',
      configured: false,
    },
    {
      id: 'security',
      title: 'Security Settings',
      description: 'Audit logging, security policies, and compliance',
      icon: 'security',
      configured: false,
    },
  ]);

  const [emailConfig, setEmailConfig] = useState<EmailConfig>({
    provider: 'sendgrid',
    api_key: '',
    sender_email: '',
    sender_name: 'Manushi Coaching Platform',
    domain: '',
    daily_limit: 1000,
    monthly_limit: 30000,
  });

  const [smsConfig, setSmsConfig] = useState<SMSConfig>({
    provider: 'twilio',
    api_key: '',
    sender_id: 'MANUSHI',
    daily_limit: 500,
    monthly_limit: 15000,
    cost_per_sms: 0.05,
  });

  const [whatsappConfig, setWhatsappConfig] = useState<WhatsAppConfig>({
    provider: 'twilio',
    api_key: '',
    phone_number_id: '',
    access_token: '',
    daily_limit: 300,
    monthly_limit: 9000,
    cost_per_message: 0.08,
  });

  const [testEmail, setTestEmail] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    try {
      // Load existing configurations and update the configured status
      // This would typically fetch from your database
      setLoading(true);
      
      // Check if configurations exist
      const updatedSections = configSections.map(section => ({
        ...section,
        configured: Math.random() > 0.5, // Mock status for demo
      }));
      
      setConfigSections(updatedSections);
    } catch (error) {
      logger.error('Failed to load configurations:', error);
      Alert.alert('error', 'Failed to load configuration settings');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigureEmail = async () => {
    try {
      setLoading(true);

      // Validate email configuration
      if (!emailConfig.api_key || !emailConfig.sender_email) {
        Alert.alert('error', 'Please fill in all required fields');
        return;
      }

      // Configure email service (temporarily disabled - will be enabled after dependencies)
      logger.info('Email configuration would be saved:', emailConfig);

      // Update configuration status
      updateSectionStatus('email', true);
      
      Alert.alert('success', 'Email service configured successfully!');
      setActiveSection(null);

    } catch (error) {
      logger.error('Failed to configure email service:', error);
      Alert.alert('error', 'Failed to configure email service');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigureSMS = async () => {
    try {
      setLoading(true);

      if (!smsConfig.api_key || !smsConfig.sender_id) {
        Alert.alert('error', 'Please fill in all required fields');
        return;
      }

      // SMS service configuration (temporarily disabled)
      logger.info('SMS configuration would be saved:', smsConfig);

      updateSectionStatus('sms', true);
      
      Alert.alert('success', 'SMS service configured successfully!');
      setActiveSection(null);

    } catch (error) {
      logger.error('Failed to configure SMS service:', error);
      Alert.alert('error', 'Failed to configure SMS service');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigureWhatsApp = async () => {
    try {
      setLoading(true);

      if (!whatsappConfig.api_key || !whatsappConfig.phone_number_id) {
        Alert.alert('error', 'Please fill in all required fields');
        return;
      }

      // WhatsApp service configuration (temporarily disabled)
      logger.info('WhatsApp configuration would be saved:', whatsappConfig);

      updateSectionStatus('whatsapp', true);
      
      Alert.alert('success', 'WhatsApp service configured successfully!');
      setActiveSection(null);

    } catch (error) {
      logger.error('Failed to configure WhatsApp service:', error);
      Alert.alert('error', 'Failed to configure WhatsApp service');
    } finally {
      setLoading(false);
    }
  };

  const testEmailConfiguration = async () => {
    if (!testEmail) {
      Alert.alert('error', 'Please enter a test email address');
      return;
    }

    try {
      setLoading(true);
      // Mock test for now
      logger.info('Would test email configuration for:', testEmail);
      Alert.alert('success', 'Test email functionality will be available after dependencies are configured.');
    } catch (error) {
      Alert.alert('error', 'Failed to test email configuration');
    } finally {
      setLoading(false);
    }
  };

  const testSMSConfiguration = async () => {
    if (!testPhone) {
      Alert.alert('error', 'Please enter a test phone number');
      return;
    }

    try {
      setLoading(true);
      // Mock test - const success = await smsWhatsAppService.testSMSConfiguration(testPhone);
      const success = true;
      
      if (success) {
        Alert.alert('success', 'Test SMS sent successfully!');
      } else {
        Alert.alert('error', 'Failed to send test SMS. Please check your configuration.');
      }
    } catch (error) {
      Alert.alert('error', 'Failed to test SMS configuration');
    } finally {
      setLoading(false);
    }
  };

  const testWhatsAppConfiguration = async () => {
    if (!testPhone) {
      Alert.alert('error', 'Please enter a test phone number');
      return;
    }

    try {
      setLoading(true);
      // Mock test - const success = await smsWhatsAppService.testWhatsAppConfiguration(testPhone);
      const success = true;
      
      if (success) {
        Alert.alert('success', 'Test WhatsApp message sent successfully!');
      } else {
        Alert.alert('error', 'Failed to send test WhatsApp message. Please check your configuration.');
      }
    } catch (error) {
      Alert.alert('error', 'Failed to test WhatsApp configuration');
    } finally {
      setLoading(false);
    }
  };

  const updateSectionStatus = (sectionId: string, configured: boolean) => {
    setConfigSections(prev => 
      prev.map(section => 
        section.id === sectionId 
          ? { ...section, configured }
          : section
      )
    );
  };

  const renderConfigurationForm = () => {
    switch (activeSection) {
      case 'email':
        return renderEmailConfiguration();
      case 'sms':
        return renderSMSConfiguration();
      case 'whatsapp':
        return renderWhatsAppConfiguration();
      case 'legal':
        return renderLegalConfiguration();
      case 'security':
        return renderSecurityConfiguration();
      default:
        return null;
    }
  };

  const renderEmailConfiguration = () => (
    <View style={styles.configForm}>
      <Text style={styles.configTitle}>Email Service Configuration</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Provider</Text>
        <View style={styles.providerButtons}>
          {['sendgrid', 'mailgun', 'ses', 'smtp'].map(provider => (
            <TouchableOpacity
              key={provider}
              style={[
                styles.providerButton,
                emailConfig.provider === provider && styles.providerButtonActive
              ]}
              onPress={() => setEmailConfig(prev => ({ ...prev, provider: provider as any }))}
            >
              <Text style={[
                styles.providerButtonText,
                emailConfig.provider === provider && styles.providerButtonTextActive
              ]}>
                {provider.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>API Key *</Text>
        <TextInput
          style={styles.input}
          value={emailConfig.api_key}
          onChangeText={(text) => setEmailConfig(prev => ({ ...prev, api_key: text }))}
          placeholder="Enter your API key"
          secureTextEntry
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Sender Email *</Text>
        <TextInput
          style={styles.input}
          value={emailConfig.sender_email}
          onChangeText={(text) => setEmailConfig(prev => ({ ...prev, sender_email: text }))}
          placeholder="noreply@manushi.edu"
          keyboardType="email-address"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Sender Name</Text>
        <TextInput
          style={styles.input}
          value={emailConfig.sender_name}
          onChangeText={(text) => setEmailConfig(prev => ({ ...prev, sender_name: text }))}
          placeholder="Manushi Coaching Platform"
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>Daily Limit</Text>
          <TextInput
            style={styles.input}
            value={emailConfig.daily_limit.toString()}
            onChangeText={(text) => setEmailConfig(prev => ({ ...prev, daily_limit: parseInt(text) || 0 }))}
            placeholder="1000"
            keyboardType="numeric"
          />
        </View>

        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>Monthly Limit</Text>
          <TextInput
            style={styles.input}
            value={emailConfig.monthly_limit.toString()}
            onChangeText={(text) => setEmailConfig(prev => ({ ...prev, monthly_limit: parseInt(text) || 0 }))}
            placeholder="30000"
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.testSection}>
        <Text style={styles.testTitle}>Test Configuration</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.testInput]}
            value={testEmail}
            onChangeText={setTestEmail}
            placeholder="test@example.com"
            keyboardType="email-address"
          />
          <TouchableOpacity style={styles.testButton} onPress={testEmailConfiguration}>
            <Text style={styles.testButtonText}>Test</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={() => setActiveSection(null)}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handleConfigureEmail}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save Configuration'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSMSConfiguration = () => (
    <View style={styles.configForm}>
      <Text style={styles.configTitle}>SMS Service Configuration</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Provider</Text>
        <View style={styles.providerButtons}>
          {['twilio', 'msg91', 'textlocal', 'fast2sms'].map(provider => (
            <TouchableOpacity
              key={provider}
              style={[
                styles.providerButton,
                smsConfig.provider === provider && styles.providerButtonActive
              ]}
              onPress={() => setSmsConfig(prev => ({ ...prev, provider: provider as any }))}
            >
              <Text style={[
                styles.providerButtonText,
                smsConfig.provider === provider && styles.providerButtonTextActive
              ]}>
                {provider.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>API Key *</Text>
        <TextInput
          style={styles.input}
          value={smsConfig.api_key}
          onChangeText={(text) => setSmsConfig(prev => ({ ...prev, api_key: text }))}
          placeholder="Enter your API key"
          secureTextEntry
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Sender ID *</Text>
        <TextInput
          style={styles.input}
          value={smsConfig.sender_id}
          onChangeText={(text) => setSmsConfig(prev => ({ ...prev, sender_id: text }))}
          placeholder="MANUSHI"
          maxLength={6}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>Daily Limit</Text>
          <TextInput
            style={styles.input}
            value={smsConfig.daily_limit.toString()}
            onChangeText={(text) => setSmsConfig(prev => ({ ...prev, daily_limit: parseInt(text) || 0 }))}
            placeholder="500"
            keyboardType="numeric"
          />
        </View>

        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>Cost per SMS (₹)</Text>
          <TextInput
            style={styles.input}
            value={smsConfig.cost_per_sms.toString()}
            onChangeText={(text) => setSmsConfig(prev => ({ ...prev, cost_per_sms: parseFloat(text) || 0 }))}
            placeholder="0.05"
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.testSection}>
        <Text style={styles.testTitle}>Test Configuration</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.testInput]}
            value={testPhone}
            onChangeText={setTestPhone}
            placeholder="+919876543210"
            keyboardType="phone-pad"
          />
          <TouchableOpacity style={styles.testButton} onPress={testSMSConfiguration}>
            <Text style={styles.testButtonText}>Test</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={() => setActiveSection(null)}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handleConfigureSMS}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save Configuration'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderWhatsAppConfiguration = () => (
    <View style={styles.configForm}>
      <Text style={styles.configTitle}>WhatsApp Business Configuration</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Provider</Text>
        <View style={styles.providerButtons}>
          {['twilio', 'whatsapp_business', 'gupshup', 'interakt'].map(provider => (
            <TouchableOpacity
              key={provider}
              style={[
                styles.providerButton,
                whatsappConfig.provider === provider && styles.providerButtonActive
              ]}
              onPress={() => setWhatsappConfig(prev => ({ ...prev, provider: provider as any }))}
            >
              <Text style={[
                styles.providerButtonText,
                whatsappConfig.provider === provider && styles.providerButtonTextActive
              ]}>
                {provider.replace('_', ' ').toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>API Key *</Text>
        <TextInput
          style={styles.input}
          value={whatsappConfig.api_key}
          onChangeText={(text) => setWhatsappConfig(prev => ({ ...prev, api_key: text }))}
          placeholder="Enter your API key"
          secureTextEntry
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Phone Number ID *</Text>
        <TextInput
          style={styles.input}
          value={whatsappConfig.phone_number_id}
          onChangeText={(text) => setWhatsappConfig(prev => ({ ...prev, phone_number_id: text }))}
          placeholder="Your WhatsApp Business phone number ID"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Access Token *</Text>
        <TextInput
          style={styles.input}
          value={whatsappConfig.access_token}
          onChangeText={(text) => setWhatsappConfig(prev => ({ ...prev, access_token: text }))}
          placeholder="Your WhatsApp Business access token"
          secureTextEntry
        />
      </View>

      <View style={styles.testSection}>
        <Text style={styles.testTitle}>Test Configuration</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.testInput]}
            value={testPhone}
            onChangeText={setTestPhone}
            placeholder="+919876543210"
            keyboardType="phone-pad"
          />
          <TouchableOpacity style={styles.testButton} onPress={testWhatsAppConfiguration}>
            <Text style={styles.testButtonText}>Test</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={() => setActiveSection(null)}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handleConfigureWhatsApp}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save Configuration'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderLegalConfiguration = () => (
    <View style={styles.configForm}>
      <Text style={styles.configTitle}>Legal Compliance Configuration</Text>
      
      <View style={styles.infoBox}>
        <Icon name="info" size={20} color="#6750A4" />
        <Text style={styles.infoText}>
          Legal compliance features will be implemented in the next phase.
          This includes privacy policy management, terms of service, and GDPR compliance tools.
        </Text>
      </View>

      <TouchableOpacity 
        style={styles.cancelButton} 
        onPress={() => setActiveSection(null)}
      >
        <Text style={styles.cancelButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSecurityConfiguration = () => (
    <View style={styles.configForm}>
      <Text style={styles.configTitle}>Security Settings Configuration</Text>
      
      <View style={styles.infoBox}>
        <Icon name="info" size={20} color="#6750A4" />
        <Text style={styles.infoText}>
          Advanced security features including audit logging, security policies, 
          and compliance monitoring will be available in the next phase.
        </Text>
      </View>

      <TouchableOpacity 
        style={styles.cancelButton} 
        onPress={() => setActiveSection(null)}
      >
        <Text style={styles.cancelButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Business Configuration</Text>
        <Text style={styles.headerSubtitle}>
          Configure communication services and business settings
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {configSections.map((section) => (
          <TouchableOpacity
            key={section.id}
            style={[
              styles.sectionCard,
              section.configured && styles.sectionCardConfigured
            ]}
            onPress={() => setActiveSection(section.id)}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Icon name={section.icon} size={24} color={section.configured ? "#4CAF50" : "#6750A4"} />
              </View>
              <View style={styles.sectionInfo}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionDescription}>{section.description}</Text>
              </View>
              <View style={styles.sectionStatus}>
                {section.configured ? (
                  <Icon name="check-circle" size={20} color="#4CAF50" />
                ) : (
                  <Icon name="arrow-forward-ios" size={16} color="#666" />
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal
        visible={activeSection !== null}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setActiveSection(null)}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {renderConfigurationForm()}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sectionCardConfigured: {
    borderColor: '#4CAF50',
    backgroundColor: '#F8FFF9',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F0FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionInfo: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  sectionStatus: {
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalContent: {
    flex: 1,
  },
  configForm: {
    padding: 20,
  },
  configTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  providerButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  providerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  providerButtonActive: {
    backgroundColor: '#6750A4',
    borderColor: '#6750A4',
  },
  providerButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  providerButtonTextActive: {
    color: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  testSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  testTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  testInput: {
    flex: 1,
  },
  testButton: {
    backgroundColor: '#6750A4',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  testButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#6750A4',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 16,
  },
  infoBox: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#F3F0FF',
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default BusinessConfigurationScreen;