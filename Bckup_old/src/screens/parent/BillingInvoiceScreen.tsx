import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  FlatList,
  Dimensions,
  BackHandler,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { Appbar, Portal, Snackbar } from 'react-native-paper';
import { LightTheme } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import DashboardCard from '../../components/core/DashboardCard';
import { useInvoices } from '../../hooks/api/useParentAPI';
// TODO: Add useInvoiceItems when backend service is ready
const useInvoiceItems = () => ({ data: [], isLoading: false, refetch: async () => {} });

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: 'paid' | 'pending' | 'overdue' | 'partial';
  items: InvoiceItem[];
  paymentMethod?: string;
  paymentDate?: string;
  notes?: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  category: 'tuition' | 'lab' | 'library' | 'transport' | 'exam' | 'other';
}

interface PaymentReminder {
  id: string;
  invoiceId: string;
  type: 'first_reminder' | 'second_reminder' | 'final_notice';
  sentDate: string;
  dueAmount: number;
  description: string;
  status: 'sent' | 'delivered' | 'read';
}

interface RefundRequest {
  id: string;
  invoiceId: string;
  amount: number;
  reason: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'processed' | 'rejected';
  processedDate?: string;
  refundMethod?: string;
}

interface TaxDocument {
  id: string;
  type: '80C' | 'fee_receipt' | 'annual_summary';
  year: string;
  amount: number;
  generatedDate: string;
  downloadUrl: string;
}

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ParentStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<ParentStackParamList, 'BillingInvoice'>;

export const BillingInvoiceScreen: React.FC<Props> = ({ navigation, route }) => {
  // Use hardcoded parentId for now (in production, get from auth context)
  const parentId = 'parent-001';
  const [activeTab, setActiveTab] = useState<'invoices' | 'reminders' | 'refunds' | 'tax'>('invoices');
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [showCustomInvoiceModal, setShowCustomInvoiceModal] = useState(false);
  const [customInvoiceData, setCustomInvoiceData] = useState({
    category: 'tuition' as 'tuition' | 'lab' | 'library' | 'transport' | 'exam' | 'other',
    description: '',
    amount: '',
    notes: '',
  });
  const [filterStatus, setFilterStatus] = useState<'paid' | 'pending' | 'overdue' | 'partial' | undefined>(undefined);

  // Real data hooks - Phase 1 implementation
  const {
    data: invoicesData = [],
    isLoading: invoicesLoading,
    error: invoicesError,
    refetch: refetchInvoices
  } = useInvoices(parentId, filterStatus);

  const {
    data: invoiceItemsData = [],
    isLoading: itemsLoading,
    error: itemsError,
    refetch: refetchItems
  } = useInvoiceItems(selectedInvoice || '');

  const isLoading = invoicesLoading || itemsLoading;

  // Lifecycle functions
  const showSnackbar = useCallback((message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  }, []);

  const setupBackHandler = useCallback(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (selectedInvoice) {
        setSelectedInvoice(null);
        return true;
      }
      navigation.goBack();
      return true;
    });
    return backHandler;
  }, [navigation, selectedInvoice]);

  // Handle errors
  useEffect(() => {
    if (invoicesError) {
      showSnackbar('Failed to load invoices');
    }
    if (itemsError) {
      showSnackbar('Failed to load invoice items');
    }
  }, [invoicesError, itemsError, showSnackbar]);

  useEffect(() => {
    const backHandler = setupBackHandler();
    return () => backHandler.remove();
  }, [setupBackHandler]);

  // Transform invoice data from Supabase
  const invoices: Invoice[] = React.useMemo(() => {
    if (!invoicesData) return [];

    return invoicesData.map((invoice: any) => {
      // Fetch items for this invoice if it's selected
      const items: InvoiceItem[] = selectedInvoice === invoice.id && invoiceItemsData
        ? invoiceItemsData.map((item: any) => ({
            id: item.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: parseFloat(item.unit_price),
            amount: parseFloat(item.amount),
            category: item.category as 'tuition' | 'lab' | 'library' | 'transport' | 'exam' | 'other',
          }))
        : [];

      return {
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        date: invoice.invoice_date,
        dueDate: invoice.due_date,
        amount: parseFloat(invoice.total_amount),
        paidAmount: parseFloat(invoice.paid_amount),
        status: invoice.status as 'paid' | 'pending' | 'overdue' | 'partial',
        items,
        paymentMethod: invoice.payment_method || undefined,
        paymentDate: invoice.payment_date || undefined,
        notes: invoice.notes || undefined,
      };
    });
  }, [invoicesData, invoiceItemsData, selectedInvoice]);

  // Keep original mock data for reference
  const _mockInvoices: Invoice[] = [
    {
      id: '1',
      invoiceNumber: 'INV-2024-001234',
      date: '2024-12-01',
      dueDate: '2024-12-05',
      amount: 2850,
      paidAmount: 2850,
      status: 'paid',
      paymentMethod: 'UPI - PhonePe',
      paymentDate: '2024-12-02',
      items: [
        { id: '1', description: 'Monthly Tuition Fee - December 2024', quantity: 1, unitPrice: 2500, amount: 2500, category: 'tuition' },
        { id: '2', description: 'Science Lab Fee', quantity: 1, unitPrice: 350, amount: 350, category: 'lab' },
      ],
      notes: 'Payment received on time. Thank you!',
    },
    {
      id: '2',
      invoiceNumber: 'INV-2024-001235',
      date: '2024-11-28',
      dueDate: '2024-12-10',
      amount: 680,
      paidAmount: 0,
      status: 'pending',
      items: [
        { id: '1', description: 'Library Annual Membership', quantity: 1, unitPrice: 500, amount: 500, category: 'library' },
        { id: '2', description: 'December Transport Fee', quantity: 1, unitPrice: 180, amount: 180, category: 'transport' },
      ],
    },
    {
      id: '3',
      invoiceNumber: 'INV-2024-001236',
      date: '2024-11-15',
      dueDate: '2024-11-25',
      amount: 3200,
      paidAmount: 1500,
      status: 'partial',
      paymentMethod: 'Partial - Credit Card',
      paymentDate: '2024-11-20',
      items: [
        { id: '1', description: 'Term Exam Fee', quantity: 1, unitPrice: 800, amount: 800, category: 'exam' },
        { id: '2', description: 'Monthly Tuition Fee - November 2024', quantity: 1, unitPrice: 2400, amount: 2400, category: 'tuition' },
      ],
      notes: 'Partial payment received. Balance amount pending.',
    },
    {
      id: '4',
      invoiceNumber: 'INV-2024-001237',
      date: '2024-10-25',
      dueDate: '2024-11-05',
      amount: 420,
      paidAmount: 0,
      status: 'overdue',
      items: [
        { id: '1', description: 'Late Transport Fee - October', quantity: 1, unitPrice: 180, amount: 180, category: 'transport' },
        { id: '2', description: 'Late Fee Penalty', quantity: 1, unitPrice: 50, amount: 50, category: 'other' },
        { id: '3', description: 'Additional Lab Materials', quantity: 1, unitPrice: 190, amount: 190, category: 'lab' },
      ],
    },
  ];

  const mockReminders: PaymentReminder[] = [
    {
      id: '1',
      invoiceId: '2',
      type: 'first_reminder',
      sentDate: '2024-12-06',
      dueAmount: 680,
      description: 'Gentle reminder for Invoice INV-2024-001235 due on Dec 10',
      status: 'read',
    },
    {
      id: '2',
      invoiceId: '4',
      type: 'final_notice',
      sentDate: '2024-11-10',
      dueAmount: 420,
      description: 'Final notice for overdue Invoice INV-2024-001237',
      status: 'delivered',
    },
    {
      id: '3',
      invoiceId: '3',
      type: 'second_reminder',
      sentDate: '2024-11-28',
      dueAmount: 1700,
      description: 'Second reminder for partial payment of Invoice INV-2024-001236',
      status: 'read',
    },
  ];

  const mockRefunds: RefundRequest[] = [
    {
      id: '1',
      invoiceId: '1',
      amount: 100,
      reason: 'Lab session cancelled due to equipment maintenance',
      requestDate: '2024-12-03',
      status: 'approved',
      processedDate: '2024-12-05',
      refundMethod: 'Original Payment Method',
    },
    {
      id: '2',
      invoiceId: '2',
      amount: 50,
      reason: 'Transport service not used for 3 days',
      requestDate: '2024-11-30',
      status: 'pending',
    },
  ];

  const mockTaxDocuments: TaxDocument[] = [
    {
      id: '1',
      type: '80C',
      year: '2024-25',
      amount: 28450,
      generatedDate: '2024-12-01',
      downloadUrl: '#',
    },
    {
      id: '2',
      type: 'annual_summary',
      year: '2024',
      amount: 31200,
      generatedDate: '2024-12-01',
      downloadUrl: '#',
    },
    {
      id: '3',
      type: 'fee_receipt',
      year: '2024',
      amount: 31200,
      generatedDate: '2024-12-01',
      downloadUrl: '#',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'overdue': return '#EF4444';
      case 'partial': return '#8B5CF6';
      default: return LightTheme.OnSurfaceVariant;
    }
  };

  const getReminderTypeColor = (type: string) => {
    switch (type) {
      case 'first_reminder': return '#3B82F6';
      case 'second_reminder': return '#F59E0B';
      case 'final_notice': return '#EF4444';
      default: return LightTheme.OnSurfaceVariant;
    }
  };

  const getRefundStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#10B981';
      case 'processed': return '#059669';
      case 'pending': return '#F59E0B';
      case 'rejected': return '#EF4444';
      default: return LightTheme.OnSurfaceVariant;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'tuition': return '🎓';
      case 'lab': return '🔬';
      case 'library': return '📚';
      case 'transport': return '🚌';
      case 'exam': return '📝';
      default: return '💰';
    }
  };

  const handleSubmitCustomInvoice = () => {
    if (!customInvoiceData.description.trim()) {
      showSnackbar('Please enter a description');
      return;
    }

    if (!customInvoiceData.amount.trim() || isNaN(Number(customInvoiceData.amount))) {
      showSnackbar('Please enter a valid amount');
      return;
    }

    // In a real app, this would send the request to the backend
    showSnackbar('Custom invoice request submitted successfully!');

    // Reset form and close modal
    setCustomInvoiceData({
      category: 'tuition',
      description: '',
      amount: '',
      notes: '',
    });
    setShowCustomInvoiceModal(false);
  };

  const renderCustomInvoiceModal = () => (
    <Modal
      visible={showCustomInvoiceModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCustomInvoiceModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Request Custom Invoice</Text>
            <TouchableOpacity
              onPress={() => setShowCustomInvoiceModal(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.fieldLabel}>Category *</Text>
            <View style={styles.categoryContainer}>
              {(['tuition', 'lab', 'library', 'transport', 'exam', 'other'] as const).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryButton,
                    customInvoiceData.category === cat && styles.categoryButtonActive,
                  ]}
                  onPress={() => setCustomInvoiceData({ ...customInvoiceData, category: cat })}
                >
                  <Text style={styles.categoryIcon}>{getCategoryIcon(cat)}</Text>
                  <Text
                    style={[
                      styles.categoryButtonText,
                      customInvoiceData.category === cat && styles.categoryButtonTextActive,
                    ]}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Description *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Extra coaching sessions for mathematics"
              value={customInvoiceData.description}
              onChangeText={(text) => setCustomInvoiceData({ ...customInvoiceData, description: text })}
              placeholderTextColor={LightTheme.OnSurfaceVariant}
              multiline
            />

            <Text style={styles.fieldLabel}>Amount (₹) *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter amount"
              value={customInvoiceData.amount}
              onChangeText={(text) => setCustomInvoiceData({ ...customInvoiceData, amount: text })}
              placeholderTextColor={LightTheme.OnSurfaceVariant}
              keyboardType="numeric"
            />

            <Text style={styles.fieldLabel}>Additional Notes</Text>
            <TextInput
              style={[styles.textInput, styles.textAreaInput]}
              placeholder="Any additional information or special requests..."
              value={customInvoiceData.notes}
              onChangeText={(text) => setCustomInvoiceData({ ...customInvoiceData, notes: text })}
              placeholderTextColor={LightTheme.OnSurfaceVariant}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelModalButton}
              onPress={() => setShowCustomInvoiceModal(false)}
            >
              <Text style={styles.cancelModalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitModalButton}
              onPress={handleSubmitCustomInvoice}
            >
              <Text style={styles.submitModalButtonText}>Submit Request</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderTabNavigation = () => (
    <View style={styles.tabContainer}>
      {(['invoices', 'reminders', 'refunds', 'tax'] as const).map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[
            styles.tabButton,
            activeTab === tab && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab(tab)}
        >
          <Text style={[
            styles.tabButtonText,
            activeTab === tab && styles.tabButtonTextActive,
          ]}>
            {tab === 'invoices' ? 'Invoices' :
             tab === 'reminders' ? 'Reminders' :
             tab === 'refunds' ? 'Refunds' : 'Tax Docs'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderInvoiceDetail = (invoice: Invoice) => (
    <DashboardCard title={`Invoice Details - ${invoice.invoiceNumber}`} style={styles.detailCard}>
      <TouchableOpacity
        style={styles.closeDetailButton}
        onPress={() => setSelectedInvoice(null)}
      >
        <Text style={styles.closeDetailButtonText}>✕</Text>
      </TouchableOpacity>

      <View style={styles.invoiceHeader}>
        <View style={styles.invoiceInfo}>
          <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
          <Text style={styles.invoiceDate}>
            Date: {new Date(invoice.date).toLocaleDateString()}
          </Text>
          <Text style={styles.invoiceDueDate}>
            Due: {new Date(invoice.dueDate).toLocaleDateString()}
          </Text>
        </View>
        <View style={[styles.invoiceStatusBadge, { backgroundColor: getStatusColor(invoice.status) }]}>
          <Text style={styles.invoiceStatusText}>{invoice.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.invoiceItemsSection}>
        <Text style={styles.sectionTitle}>Invoice Items</Text>
        {invoice.items.map((item) => (
          <View key={item.id} style={styles.invoiceItem}>
            <Text style={styles.itemIcon}>{getCategoryIcon(item.category)}</Text>
            <View style={styles.itemDetails}>
              <Text style={styles.itemDescription}>{item.description}</Text>
              <Text style={styles.itemQuantity}>Qty: {item.quantity} × ₹{item.unitPrice}</Text>
            </View>
            <Text style={styles.itemAmount}>₹{item.amount}</Text>
          </View>
        ))}
      </View>

      <View style={styles.invoiceSummary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Amount:</Text>
          <Text style={styles.summaryValue}>₹{invoice.amount}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Paid Amount:</Text>
          <Text style={styles.summaryValue}>₹{invoice.paidAmount}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Balance:</Text>
          <Text style={[styles.summaryValue, styles.balanceAmount]}>
            ₹{invoice.amount - invoice.paidAmount}
          </Text>
        </View>
      </View>

      {invoice.notes && (
        <View style={styles.notesSection}>
          <Text style={styles.notesTitle}>Notes:</Text>
          <Text style={styles.notesText}>{invoice.notes}</Text>
        </View>
      )}

      <View style={styles.invoiceActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>📄 Download PDF</Text>
        </TouchableOpacity>
        {invoice.status !== 'paid' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.payButton]}
            onPress={() => navigation.navigate('MakePayment', {})}
          >
            <Text style={styles.payButtonText}>💳 Pay Now</Text>
          </TouchableOpacity>
        )}
      </View>
    </DashboardCard>
  );

  const renderInvoicesSection = () => (
    <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {selectedInvoice ? (
        renderInvoiceDetail(invoices.find(inv => inv.id === selectedInvoice)!)
      ) : (
        <>
          <DashboardCard title="📄 Invoice Management" style={styles.sectionCard}>
            <Text style={styles.cardDescription}>
              Manage all your invoices, track payment status, and download receipts
            </Text>

            <FlatList
              data={invoices}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.invoiceCard}
                  onPress={() => setSelectedInvoice(item.id)}
                >
                  <View style={styles.invoiceCardHeader}>
                    <View style={styles.invoiceCardInfo}>
                      <Text style={styles.invoiceCardNumber}>{item.invoiceNumber}</Text>
                      <Text style={styles.invoiceCardDate}>
                        {new Date(item.date).toLocaleDateString()}
                      </Text>
                      <Text style={styles.invoiceCardDue}>
                        Due: {new Date(item.dueDate).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.invoiceCardAmount}>
                      <Text style={styles.invoiceCardAmountText}>₹{item.amount}</Text>
                      {item.status === 'partial' && (
                        <Text style={styles.invoiceCardPaid}>
                          Paid: ₹{item.paidAmount}
                        </Text>
                      )}
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                        <Text style={styles.statusBadgeText}>{item.status.toUpperCase()}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.invoiceCardPreview}>
                    <Text style={styles.previewLabel}>Items:</Text>
                    <Text style={styles.previewText} numberOfLines={1}>
                      {item.items.map(i => i.description).join(', ')}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
              windowSize={10}
              maxToRenderPerBatch={5}
              initialNumToRender={5}
              removeClippedSubviews={true}
              updateCellsBatchingPeriod={100}
            />
          </DashboardCard>

          <TouchableOpacity
            style={styles.generateInvoiceButton}
            onPress={() => setShowCustomInvoiceModal(true)}
          >
            <Text style={styles.generateInvoiceButtonText}>➕ Request Custom Invoice</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );

  const renderRemindersSection = () => (
    <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <DashboardCard title="🔔 Payment Reminders" style={styles.sectionCard}>
        <Text style={styles.cardDescription}>
          Track automated payment reminders and notifications
        </Text>
        
        <FlatList
          data={mockReminders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.reminderItem}>
              <View style={styles.reminderHeader}>
                <View style={[
                  styles.reminderTypeBadge,
                  { backgroundColor: getReminderTypeColor(item.type) }
                ]}>
                  <Text style={styles.reminderTypeText}>
                    {item.type.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.reminderDate}>
                  {new Date(item.sentDate).toLocaleDateString()}
                </Text>
              </View>

              <Text style={styles.reminderDescription}>{item.description}</Text>
              <Text style={styles.reminderAmount}>Amount Due: ₹{item.dueAmount}</Text>

              <View style={styles.reminderStatus}>
                <Text style={styles.reminderStatusLabel}>Status:</Text>
                <Text style={[
                  styles.reminderStatusText,
                  { color: item.status === 'read' ? '#10B981' : '#F59E0B' }
                ]}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Text>
              </View>
            </View>
          )}
          showsVerticalScrollIndicator={false}
          windowSize={10}
          maxToRenderPerBatch={5}
          initialNumToRender={5}
          removeClippedSubviews={true}
          updateCellsBatchingPeriod={100}
        />
      </DashboardCard>

      <TouchableOpacity
        style={styles.reminderSettingsButton}
        onPress={() => showSnackbar('Configure payment reminder preferences')}
      >
        <Text style={styles.reminderSettingsButtonText}>⚙️ Configure Reminders</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderRefundsSection = () => (
    <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <DashboardCard title="💸 Refund Management" style={styles.sectionCard}>
        <Text style={styles.cardDescription}>
          Track refund requests and processed refunds
        </Text>
        
        <FlatList
          data={mockRefunds}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.refundItem}>
              <View style={styles.refundHeader}>
                <View style={styles.refundInfo}>
                  <Text style={styles.refundAmount}>₹{item.amount}</Text>
                  <Text style={styles.refundDate}>
                    Requested: {new Date(item.requestDate).toLocaleDateString()}
                  </Text>
                  {item.processedDate && (
                    <Text style={styles.refundProcessedDate}>
                      Processed: {new Date(item.processedDate).toLocaleDateString()}
                    </Text>
                  )}
                </View>
                <View style={[styles.refundStatusBadge, { backgroundColor: getRefundStatusColor(item.status) }]}>
                  <Text style={styles.refundStatusText}>{item.status.toUpperCase()}</Text>
                </View>
              </View>

              <Text style={styles.refundReason}>{item.reason}</Text>

              {item.refundMethod && (
                <Text style={styles.refundMethod}>
                  Refund Method: {item.refundMethod}
                </Text>
              )}
            </View>
          )}
          showsVerticalScrollIndicator={false}
          windowSize={10}
          maxToRenderPerBatch={5}
          initialNumToRender={5}
          removeClippedSubviews={true}
          updateCellsBatchingPeriod={100}
        />
      </DashboardCard>

      <TouchableOpacity
        style={styles.newRefundButton}
        onPress={() => showSnackbar('Submit a new refund request')}
      >
        <Text style={styles.newRefundButtonText}>➕ Request Refund</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderTaxSection = () => (
    <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <DashboardCard title="🏛️ Tax Documents" style={styles.sectionCard}>
        <Text style={styles.cardDescription}>
          Download tax-compliant receipts and annual summaries
        </Text>
        
        <FlatList
          data={mockTaxDocuments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.taxItem}>
              <View style={styles.taxHeader}>
                <View style={styles.taxInfo}>
                  <Text style={styles.taxType}>
                    {item.type === '80C' ? 'Section 80C Certificate' :
                     item.type === 'annual_summary' ? 'Annual Fee Summary' :
                     'Fee Receipt'}
                  </Text>
                  <Text style={styles.taxYear}>Financial Year: {item.year}</Text>
                  <Text style={styles.taxGenerated}>
                    Generated: {new Date(item.generatedDate).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.taxAmount}>
                  <Text style={styles.taxAmountText}>₹{item.amount.toLocaleString()}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.downloadTaxButton}>
                <Text style={styles.downloadTaxButtonText}>📄 Download PDF</Text>
              </TouchableOpacity>
            </View>
          )}
          showsVerticalScrollIndicator={false}
          windowSize={10}
          maxToRenderPerBatch={5}
          initialNumToRender={5}
          removeClippedSubviews={true}
          updateCellsBatchingPeriod={100}
        />
      </DashboardCard>

      <TouchableOpacity
        style={styles.generateTaxButton}
        onPress={() => showSnackbar('Generate custom tax document')}
      >
        <Text style={styles.generateTaxButtonText}>🧾 Generate Custom Tax Document</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderAppBar = () => (
    <Appbar.Header elevated style={{ backgroundColor: '#7C3AED' }}>
      <Appbar.BackAction onPress={() => selectedInvoice ? setSelectedInvoice(null) : navigation.goBack()} />
      <Appbar.Content title="Billing & Invoices" subtitle="Manage payments and tax documents" />
      <Appbar.Action icon="file-document" onPress={() => showSnackbar('Download all invoices')} />
    </Appbar.Header>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#7C3AED" barStyle="light-content" />
        {renderAppBar()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={LightTheme.Primary} />
          <Text style={styles.loadingText}>Loading billing information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#7C3AED" />
      {renderAppBar()}

      {renderTabNavigation()}

      {activeTab === 'invoices' && renderInvoicesSection()}
      {activeTab === 'reminders' && renderRemindersSection()}
      {activeTab === 'refunds' && renderRefundsSection()}
      {activeTab === 'tax' && renderTaxSection()}

      {renderCustomInvoiceModal()}

      <Portal>
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          action={{
            label: 'Dismiss',
            onPress: () => setSnackbarVisible(false),
          }}
        >
          {snackbarMessage}
        </Snackbar>
      </Portal>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LightTheme.Background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: LightTheme.Background,
  },
  loadingText: {
    marginTop: Spacing.MD,
    fontSize: 16,
    color: LightTheme.Outline,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: LightTheme.Surface,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.SurfaceVariant,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.MD,
    alignItems: 'center',
  },
  tabButtonActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#7C3AED',
  },
  tabButtonText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    fontWeight: '500',
  },
  tabButtonTextActive: {
    color: '#7C3AED',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    padding: Spacing.LG,
  },
  sectionCard: {
    marginBottom: Spacing.LG,
  },
  cardDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.LG,
    lineHeight: 20,
    textAlign: 'center',
  },
  detailCard: {
    position: 'relative',
  },
  closeDetailButton: {
    position: 'absolute',
    top: Spacing.MD,
    right: Spacing.MD,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: LightTheme.ErrorContainer,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  closeDetailButtonText: {
    fontSize: 18,
    color: LightTheme.OnErrorContainer,
    fontWeight: 'bold',
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.LG,
    marginTop: Spacing.XL,
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: '700',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  invoiceDate: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  invoiceDueDate: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  invoiceStatusBadge: {
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: BorderRadius.MD,
  },
  invoiceStatusText: {
    fontSize: Typography.bodySmall.fontSize,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  invoiceItemsSection: {
    marginBottom: Spacing.LG,
  },
  sectionTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.MD,
  },
  invoiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.SM,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.Outline,
  },
  itemIcon: {
    fontSize: 20,
    marginRight: Spacing.MD,
  },
  itemDetails: {
    flex: 1,
  },
  itemDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '500',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  itemQuantity: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  itemAmount: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
  },
  invoiceSummary: {
    backgroundColor: LightTheme.SurfaceVariant,
    padding: Spacing.LG,
    borderRadius: BorderRadius.MD,
    marginBottom: Spacing.LG,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  summaryLabel: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  summaryValue: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
  },
  balanceAmount: {
    color: '#EF4444',
    fontWeight: '700',
  },
  notesSection: {
    backgroundColor: LightTheme.PrimaryContainer,
    padding: Spacing.MD,
    borderRadius: BorderRadius.MD,
    marginBottom: Spacing.LG,
  },
  notesTitle: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: LightTheme.OnPrimaryContainer,
    marginBottom: Spacing.XS,
  },
  notesText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnPrimaryContainer,
    lineHeight: 18,
  },
  invoiceActions: {
    flexDirection: 'row',
    gap: Spacing.MD,
  },
  actionButton: {
    flex: 1,
    backgroundColor: LightTheme.SecondaryContainer,
    paddingVertical: Spacing.MD,
    paddingHorizontal: Spacing.LG,
    borderRadius: BorderRadius.MD,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSecondaryContainer,
    fontWeight: '600',
  },
  payButton: {
    backgroundColor: '#7C3AED',
  },
  payButtonText: {
    color: '#FFFFFF',
  },
  invoiceCard: {
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.MD,
    padding: Spacing.LG,
    marginBottom: Spacing.MD,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  invoiceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.MD,
  },
  invoiceCardInfo: {
    flex: 1,
  },
  invoiceCardNumber: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  invoiceCardDate: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  invoiceCardDue: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  invoiceCardAmount: {
    alignItems: 'flex-end',
  },
  invoiceCardAmountText: {
    fontSize: Typography.headlineSmall.fontSize,
    fontWeight: '700',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  invoiceCardPaid: {
    fontSize: Typography.bodySmall.fontSize,
    color: '#10B981',
    marginBottom: Spacing.XS,
  },
  statusBadge: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
  },
  statusBadgeText: {
    fontSize: Typography.bodySmall.fontSize,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  invoiceCardPreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginRight: Spacing.SM,
  },
  previewText: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurface,
    flex: 1,
  },
  generateInvoiceButton: {
    backgroundColor: LightTheme.PrimaryContainer,
    paddingVertical: Spacing.LG,
    paddingHorizontal: Spacing.LG,
    borderRadius: BorderRadius.MD,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#7C3AED',
    borderStyle: 'dashed',
  },
  generateInvoiceButtonText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: '#7C3AED',
    fontWeight: '600',
  },
  reminderItem: {
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.MD,
    padding: Spacing.LG,
    marginBottom: Spacing.MD,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  reminderTypeBadge: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
  },
  reminderTypeText: {
    fontSize: Typography.bodySmall.fontSize,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  reminderDate: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  reminderDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  reminderAmount: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: Spacing.SM,
  },
  reminderStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderStatusLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginRight: Spacing.SM,
  },
  reminderStatusText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
  },
  reminderSettingsButton: {
    backgroundColor: LightTheme.SecondaryContainer,
    paddingVertical: Spacing.LG,
    paddingHorizontal: Spacing.LG,
    borderRadius: BorderRadius.MD,
    alignItems: 'center',
  },
  reminderSettingsButtonText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSecondaryContainer,
    fontWeight: '600',
  },
  refundItem: {
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.MD,
    padding: Spacing.LG,
    marginBottom: Spacing.MD,
  },
  refundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.MD,
  },
  refundInfo: {
    flex: 1,
  },
  refundAmount: {
    fontSize: Typography.headlineSmall.fontSize,
    fontWeight: '700',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  refundDate: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  refundProcessedDate: {
    fontSize: Typography.bodySmall.fontSize,
    color: '#10B981',
  },
  refundStatusBadge: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
  },
  refundStatusText: {
    fontSize: Typography.bodySmall.fontSize,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  refundReason: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  refundMethod: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  newRefundButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: Spacing.LG,
    paddingHorizontal: Spacing.LG,
    borderRadius: BorderRadius.MD,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  newRefundButtonText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  taxItem: {
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.MD,
    padding: Spacing.LG,
    marginBottom: Spacing.MD,
  },
  taxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.MD,
  },
  taxInfo: {
    flex: 1,
  },
  taxType: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  taxYear: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  taxGenerated: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  taxAmount: {
    alignItems: 'flex-end',
  },
  taxAmountText: {
    fontSize: Typography.headlineSmall.fontSize,
    fontWeight: '700',
    color: '#7C3AED',
  },
  downloadTaxButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: Spacing.SM,
    paddingHorizontal: Spacing.MD,
    borderRadius: BorderRadius.MD,
    alignItems: 'center',
  },
  downloadTaxButtonText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  generateTaxButton: {
    backgroundColor: LightTheme.SecondaryContainer,
    paddingVertical: Spacing.LG,
    paddingHorizontal: Spacing.LG,
    borderRadius: BorderRadius.MD,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#7C3AED',
    borderStyle: 'dashed',
  },
  generateTaxButtonText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: '#7C3AED',
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: LightTheme.Surface,
    borderRadius: BorderRadius.LG,
    padding: Spacing.LG,
    width: width - Spacing.XL * 2,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.LG,
  },
  modalTitle: {
    fontSize: Typography.titleLarge.fontSize,
    fontWeight: '700',
    color: LightTheme.OnSurface,
    flex: 1,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: LightTheme.ErrorContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: LightTheme.OnErrorContainer,
  },
  fieldLabel: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
    marginTop: Spacing.MD,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.SM,
    marginBottom: Spacing.MD,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.SM,
    paddingHorizontal: Spacing.MD,
    borderRadius: BorderRadius.MD,
    borderWidth: 1,
    borderColor: LightTheme.Outline,
    backgroundColor: LightTheme.Surface,
  },
  categoryButtonActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: Spacing.SM,
  },
  categoryButtonText: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurface,
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderColor: LightTheme.Outline,
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    backgroundColor: LightTheme.Surface,
    marginBottom: Spacing.MD,
  },
  textAreaInput: {
    minHeight: 100,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.MD,
    marginTop: Spacing.LG,
  },
  cancelModalButton: {
    paddingVertical: Spacing.MD,
    paddingHorizontal: Spacing.LG,
    borderRadius: BorderRadius.MD,
    borderWidth: 1,
    borderColor: LightTheme.Outline,
  },
  cancelModalButtonText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    fontWeight: '600',
  },
  submitModalButton: {
    paddingVertical: Spacing.MD,
    paddingHorizontal: Spacing.LG,
    borderRadius: BorderRadius.MD,
    backgroundColor: '#7C3AED',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  submitModalButtonText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default BillingInvoiceScreen;