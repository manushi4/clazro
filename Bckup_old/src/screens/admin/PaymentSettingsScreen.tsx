/**
 * PaymentSettingsScreen - Phase 40: Financial Administration
 * Payment Gateway Configuration and Management
 * Fee structure, refund processing, security settings
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  TextInput,
  Alert,
} from 'react-native';

import { LightTheme } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';

interface PaymentSettingsScreenProps {
  adminId: string;
  onNavigate: (screen: string) => void;
}

interface PaymentGateway {
  id: string;
  name: string;
  enabled: boolean;
  apiKey: string;
  secretKey: string;
  webhookUrl: string;
  transactionFee: number;
  currency: string[];
  testMode: boolean;
}

interface FeeStructure {
  id: string;
  name: string;
  type: 'fixed' | 'percentage';
  value: number;
  minAmount?: number;
  maxAmount?: number;
  applicableFor: string[];
}

const PaymentSettingsScreen: React.FC<PaymentSettingsScreenProps> = ({
  adminId,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'gateways' | 'fees' | 'security'>('gateways');
  const [editingGateway, setEditingGateway] = useState<string | null>(null);

  // Mock payment gateways data
  const [paymentGateways, setPaymentGateways] = useState<PaymentGateway[]>([
    {
      id: '1',
      name: 'Razorpay',
      enabled: true,
      apiKey: 'rzp_test_***************',
      secretKey: '***************',
      webhookUrl: 'https://api.manushi.edu/webhooks/razorpay',
      transactionFee: 2.3,
      currency: ['INR', 'USD'],
      testMode: false,
    },
    {
      id: '2',
      name: 'Stripe',
      enabled: true,
      apiKey: 'pk_test_***************',
      secretKey: 'sk_test_***************',
      webhookUrl: 'https://api.manushi.edu/webhooks/stripe',
      transactionFee: 2.9,
      currency: ['USD', 'EUR', 'GBP'],
      testMode: true,
    },
    {
      id: '3',
      name: 'PayPal',
      enabled: false,
      apiKey: '',
      secretKey: '',
      webhookUrl: 'https://api.manushi.edu/webhooks/paypal',
      transactionFee: 3.4,
      currency: ['USD', 'EUR'],
      testMode: true,
    },
  ]);

  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([
    {
      id: '1',
      name: 'Course Fee',
      type: 'fixed',
      value: 5000,
      applicableFor: ['courses', 'subscriptions'],
    },
    {
      id: '2',
      name: 'Processing Fee',
      type: 'percentage',
      value: 2.5,
      minAmount: 10,
      maxAmount: 500,
      applicableFor: ['all'],
    },
    {
      id: '3',
      name: 'Late Payment Fee',
      type: 'fixed',
      value: 100,
      applicableFor: ['overdue'],
    },
  ]);

  const toggleGateway = (gatewayId: string) => {
    setPaymentGateways(prev => 
      prev.map(gateway => 
        gateway.id === gatewayId 
          ? { ...gateway, enabled: !gateway.enabled }
          : gateway
      )
    );
  };

  const toggleTestMode = (gatewayId: string) => {
    setPaymentGateways(prev => 
      prev.map(gateway => 
        gateway.id === gatewayId 
          ? { ...gateway, testMode: !gateway.testMode }
          : gateway
      )
    );
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
          <Text style={styles.headerTitle}>Payment Settings</Text>
          <Text style={styles.headerSubtitle}>Configure Payment Gateways & Fees</Text>
        </View>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={() => Alert.alert('success', 'Settings saved successfully!')}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  const renderTabSelector = () => (
    <View style={styles.tabContainer}>
      {([
        { key: 'gateways', label: 'Payment Gateways', icon: '💳' },
        { key: 'fees', label: 'Fee Structure', icon: '💰' },
        { key: 'security', label: 'Security', icon: '🔒' },
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

  const renderPaymentGateways = () => (
    <View style={styles.gatewaysContainer}>
      {paymentGateways.map((gateway) => (
        <View key={gateway.id} style={styles.gatewayCard}>
          <View style={styles.gatewayHeader}>
            <View style={styles.gatewayInfo}>
              <Text style={styles.gatewayName}>{gateway.name}</Text>
              <View style={styles.gatewayStatusRow}>
                <Text style={styles.gatewayFee}>Fee: {gateway.transactionFee}%</Text>
                <View style={[
                  styles.testModeTag,
                  gateway.testMode ? styles.testModeActive : styles.testModeInactive
                ]}>
                  <Text style={[
                    styles.testModeText,
                    gateway.testMode ? styles.testModeActiveText : styles.testModeInactiveText
                  ]}>
                    {gateway.testMode ? 'Test Mode' : 'Live Mode'}
                  </Text>
                </View>
              </View>
            </View>
            <Switch
              value={gateway.enabled}
              onValueChange={() => toggleGateway(gateway.id)}
              trackColor={{ false: LightTheme.OutlineVariant, true: LightTheme.Primary }}
              thumbColor={gateway.enabled ? LightTheme.OnPrimary : LightTheme.OnSurface}
            />
          </View>

          {gateway.enabled && (
            <View style={styles.gatewayDetails}>
              <View style={styles.configRow}>
                <Text style={styles.configLabel}>API Key</Text>
                <TextInput
                  style={styles.configInput}
                  value={gateway.apiKey}
                  placeholder="Enter API Key"
                  secureTextEntry={editingGateway !== gateway.id}
                />
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setEditingGateway(
                    editingGateway === gateway.id ? null : gateway.id
                  )}
                >
                  <Text style={styles.editButtonText}>
                    {editingGateway === gateway.id ? 'Hide' : 'Edit'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.configRow}>
                <Text style={styles.configLabel}>Webhook URL</Text>
                <TextInput
                  style={[styles.configInput, styles.configInputFull]}
                  value={gateway.webhookUrl}
                  placeholder="Webhook URL"
                  editable={false}
                />
              </View>

              <View style={styles.configRow}>
                <Text style={styles.configLabel}>Test Mode</Text>
                <Switch
                  value={gateway.testMode}
                  onValueChange={() => toggleTestMode(gateway.id)}
                  trackColor={{ false: LightTheme.OutlineVariant, true: '#FF9800' }}
                  thumbColor={gateway.testMode ? LightTheme.OnPrimary : LightTheme.OnSurface}
                />
              </View>

              <View style={styles.currencyContainer}>
                <Text style={styles.configLabel}>Supported Currencies</Text>
                <View style={styles.currencyList}>
                  {gateway.currency.map((curr) => (
                    <View key={curr} style={styles.currencyTag}>
                      <Text style={styles.currencyText}>{curr}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}
        </View>
      ))}

      <TouchableOpacity style={styles.addGatewayButton}>
        <Text style={styles.addGatewayIcon}>+</Text>
        <Text style={styles.addGatewayText}>Add New Gateway</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFeeStructure = () => (
    <View style={styles.feesContainer}>
      {feeStructures.map((fee) => (
        <View key={fee.id} style={styles.feeCard}>
          <View style={styles.feeHeader}>
            <Text style={styles.feeName}>{fee.name}</Text>
            <View style={[
              styles.feeTypeTag,
              fee.type === 'fixed' ? styles.feeTypeFixed : styles.feeTypePercentage
            ]}>
              <Text style={styles.feeTypeText}>{fee.type}</Text>
            </View>
          </View>
          
          <View style={styles.feeDetails}>
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Amount</Text>
              <Text style={styles.feeValue}>
                {fee.type === 'percentage' ? `${fee.value}%` : `₹${fee.value}`}
              </Text>
            </View>
            
            {fee.minAmount && (
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Minimum</Text>
                <Text style={styles.feeValue}>₹{fee.minAmount}</Text>
              </View>
            )}
            
            {fee.maxAmount && (
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Maximum</Text>
                <Text style={styles.feeValue}>₹{fee.maxAmount}</Text>
              </View>
            )}
            
            <View style={styles.applicableContainer}>
              <Text style={styles.feeLabel}>Applicable For</Text>
              <View style={styles.applicableList}>
                {fee.applicableFor.map((item) => (
                  <View key={item} style={styles.applicableTag}>
                    <Text style={styles.applicableText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.feeActions}>
            <TouchableOpacity style={styles.editFeeButton}>
              <Text style={styles.editFeeText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteFeeButton}>
              <Text style={styles.deleteFeeText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.addFeeButton}>
        <Text style={styles.addFeeIcon}>+</Text>
        <Text style={styles.addFeeText}>Add New Fee Structure</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSecurity = () => (
    <View style={styles.securityContainer}>
      <View style={styles.securitySection}>
        <Text style={styles.securityTitle}>Fraud Detection</Text>
        <View style={styles.securityOption}>
          <Text style={styles.securityLabel}>Enable fraud detection</Text>
          <Switch
            value={true}
            trackColor={{ false: LightTheme.OutlineVariant, true: LightTheme.Primary }}
            thumbColor={LightTheme.OnPrimary}
          />
        </View>
        <View style={styles.securityOption}>
          <Text style={styles.securityLabel}>Velocity checking</Text>
          <Switch
            value={true}
            trackColor={{ false: LightTheme.OutlineVariant, true: LightTheme.Primary }}
            thumbColor={LightTheme.OnPrimary}
          />
        </View>
      </View>

      <View style={styles.securitySection}>
        <Text style={styles.securityTitle}>Transaction Limits</Text>
        <View style={styles.limitRow}>
          <Text style={styles.limitLabel}>Daily Limit</Text>
          <TextInput
            style={styles.limitInput}
            value="100000"
            placeholder="Daily limit"
          />
        </View>
        <View style={styles.limitRow}>
          <Text style={styles.limitLabel}>Transaction Limit</Text>
          <TextInput
            style={styles.limitInput}
            value="50000"
            placeholder="Per transaction limit"
          />
        </View>
      </View>

      <View style={styles.securitySection}>
        <Text style={styles.securityTitle}>Notifications</Text>
        <View style={styles.securityOption}>
          <Text style={styles.securityLabel}>Failed payment alerts</Text>
          <Switch
            value={true}
            trackColor={{ false: LightTheme.OutlineVariant, true: LightTheme.Primary }}
            thumbColor={LightTheme.OnPrimary}
          />
        </View>
        <View style={styles.securityOption}>
          <Text style={styles.securityLabel}>Large transaction alerts</Text>
          <Switch
            value={true}
            trackColor={{ false: LightTheme.OutlineVariant, true: LightTheme.Primary }}
            thumbColor={LightTheme.OnPrimary}
          />
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
        {activeTab === 'gateways' && renderPaymentGateways()}
        {activeTab === 'fees' && renderFeeStructure()}
        {activeTab === 'security' && renderSecurity()}
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
  saveButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.SM,
    borderRadius: 20,
  },
  saveButtonText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    fontWeight: '600',
    color: LightTheme.OnPrimary,
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
    paddingVertical: Spacing.MD,
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: LightTheme.Primary,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: Spacing.XS,
  },
  tabText: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    fontWeight: '500',
  },
  tabTextActive: {
    color: LightTheme.OnPrimary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  gatewaysContainer: {
    padding: Spacing.MD,
  },
  gatewayCard: {
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
  gatewayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  gatewayInfo: {
    flex: 1,
  },
  gatewayName: {
    fontSize: Typography.titleMedium.fontSize,
    fontFamily: Typography.titleMedium.fontFamily,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  gatewayStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  gatewayFee: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
  testModeTag: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: 12,
  },
  testModeActive: {
    backgroundColor: '#FFF3E0',
  },
  testModeInactive: {
    backgroundColor: '#E8F5E8',
  },
  testModeText: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    fontWeight: '600',
  },
  testModeActiveText: {
    color: '#FF9800',
  },
  testModeInactiveText: {
    color: '#4CAF50',
  },
  gatewayDetails: {
    marginTop: Spacing.LG,
    paddingTop: Spacing.LG,
    borderTopWidth: 1,
    borderTopColor: LightTheme.OutlineVariant,
  },
  configRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  configLabel: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurface,
    width: 100,
    fontWeight: '500',
  },
  configInput: {
    flex: 1,
    backgroundColor: LightTheme.SurfaceVariant,
    padding: Spacing.SM,
    borderRadius: 8,
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurface,
    marginRight: Spacing.SM,
  },
  configInputFull: {
    marginRight: 0,
  },
  editButton: {
    backgroundColor: LightTheme.Primary,
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    fontWeight: '600',
    color: LightTheme.OnPrimary,
  },
  currencyContainer: {
    marginTop: Spacing.SM,
  },
  currencyList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.SM,
  },
  currencyTag: {
    backgroundColor: LightTheme.primaryContainer,
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: 12,
    marginRight: Spacing.SM,
    marginBottom: Spacing.XS,
  },
  currencyText: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    fontWeight: '600',
    color: LightTheme.OnPrimaryContainer,
  },
  addGatewayButton: {
    backgroundColor: LightTheme.SurfaceVariant,
    padding: Spacing.XL,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: LightTheme.OutlineVariant,
    borderStyle: 'dashed',
  },
  addGatewayIcon: {
    fontSize: 32,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.SM,
  },
  addGatewayText: {
    fontSize: Typography.bodyLarge.fontSize,
    fontFamily: Typography.bodyLarge.fontFamily,
    fontWeight: '600',
    color: LightTheme.OnSurfaceVariant,
  },
  feesContainer: {
    padding: Spacing.MD,
  },
  feeCard: {
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
  feeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.LG,
  },
  feeName: {
    fontSize: Typography.titleMedium.fontSize,
    fontFamily: Typography.titleMedium.fontFamily,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
  },
  feeTypeTag: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: 12,
  },
  feeTypeFixed: {
    backgroundColor: '#E3F2FD',
  },
  feeTypePercentage: {
    backgroundColor: '#F3E5F5',
  },
  feeTypeText: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    textTransform: 'capitalize',
  },
  feeDetails: {
    marginBottom: Spacing.LG,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  feeLabel: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
  feeValue: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    fontWeight: '600',
    color: LightTheme.OnSurface,
  },
  applicableContainer: {
    marginTop: Spacing.SM,
  },
  applicableList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.SM,
  },
  applicableTag: {
    backgroundColor: LightTheme.secondaryContainer,
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: 12,
    marginRight: Spacing.SM,
    marginBottom: Spacing.XS,
  },
  applicableText: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    fontWeight: '600',
    color: LightTheme.OnSecondaryContainer,
  },
  feeActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  editFeeButton: {
    backgroundColor: LightTheme.Primary,
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: 8,
    marginRight: Spacing.SM,
  },
  editFeeText: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    fontWeight: '600',
    color: LightTheme.OnPrimary,
  },
  deleteFeeButton: {
    backgroundColor: LightTheme.errorContainer,
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: 8,
  },
  deleteFeeText: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    fontWeight: '600',
    color: LightTheme.OnErrorContainer,
  },
  addFeeButton: {
    backgroundColor: LightTheme.SurfaceVariant,
    padding: Spacing.XL,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: LightTheme.OutlineVariant,
    borderStyle: 'dashed',
  },
  addFeeIcon: {
    fontSize: 32,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.SM,
  },
  addFeeText: {
    fontSize: Typography.bodyLarge.fontSize,
    fontFamily: Typography.bodyLarge.fontFamily,
    fontWeight: '600',
    color: LightTheme.OnSurfaceVariant,
  },
  securityContainer: {
    padding: Spacing.MD,
  },
  securitySection: {
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
  securityTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontFamily: Typography.titleMedium.fontFamily,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.LG,
  },
  securityOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  securityLabel: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurface,
    flex: 1,
  },
  limitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  limitLabel: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurface,
    width: 120,
  },
  limitInput: {
    flex: 1,
    backgroundColor: LightTheme.SurfaceVariant,
    padding: Spacing.SM,
    borderRadius: 8,
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurface,
    textAlign: 'right',
  },
});

export default PaymentSettingsScreen;