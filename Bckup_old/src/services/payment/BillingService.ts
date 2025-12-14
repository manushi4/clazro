/**
 * Billing Service
 * Manushi Coaching Platform - Phase 74
 * Complete billing and invoice management system with tax compliance
 */

import { 
  BillingInvoice, 
  InvoiceItem, 
  BillingAddress, 
  PaymentApiResponse,
  Currency,
  PaymentTransaction
} from '../../types/payment';
import { Database } from '../../types/database';
import { supabase } from '../../lib/supabase';
import { ErrorHandler } from '../utils/ErrorHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class BillingService {
  private readonly STORAGE_KEYS = {
    BILLING_CACHE: 'billing_cache',
    TAX_RATES: 'tax_rates_cache',
    INVOICE_TEMPLATES: 'invoice_templates'
  };

  private readonly TAX_RATES = {
    GST_INDIA: 0.18, // 18% GST for digital services in India
    VAT_EU: 0.20,    // 20% VAT for EU
    SALES_TAX_US: 0.08 // 8% average sales tax for US
  };

  /**
   * Generate invoice for subscription or one-time payment
   */
  public async generateInvoice(
    userId: string,
    items: InvoiceItem[],
    billingAddress: BillingAddress,
    subscriptionId?: string,
    dueDate?: string
  ): Promise<PaymentApiResponse<BillingInvoice>> {
    try {
      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
      const taxAmount = this.calculateTax(subtotal, billingAddress.country);
      const discountAmount = 0; // Can be calculated based on discount codes
      const totalAmount = subtotal + taxAmount - discountAmount;

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber();

      const invoiceData: any = {
        invoice_number: invoiceNumber,
        user_id: userId,
        subscription_id: subscriptionId || null,
        status: 'draft',
        subtotal,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        currency: this.getCurrencyByCountry(billingAddress.country),
        due_date: dueDate || this.getDefaultDueDate(),
        items,
        billing_address: billingAddress,
        metadata: {
          generated_at: new Date().toISOString(),
          generated_via: 'mobile_app',
          tax_rate: this.getTaxRate(billingAddress.country)
        }
      };

      const { data, error } = await supabase
        .from('billing_invoices')
        .insert(invoiceData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const invoice = data as BillingInvoice;

      // Generate PDF invoice (would integrate with a PDF generation service)
      await this.generateInvoicePDF(invoice);

      return {
        success: true,
        data: invoice
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INVOICE_GENERATION_ERROR',
          message: (error as Error).message
        }
      };
    }
  }

  /**
   * Get invoices for a user
   */
  public async getUserInvoices(
    userId: string,
    status?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<PaymentApiResponse<BillingInvoice[]>> {
    try {
      let query = supabase
        .from('billing_invoices')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: data as BillingInvoice[]
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INVOICES_FETCH_ERROR',
          message: (error as Error).message
        }
      };
    }
  }

  /**
   * Get invoice details by ID
   */
  public async getInvoiceDetails(invoiceId: string): Promise<PaymentApiResponse<BillingInvoice>> {
    try {
      const { data, error } = await supabase
        .from('billing_invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: data as BillingInvoice
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INVOICE_NOT_FOUND',
          message: 'Invoice not found'
        }
      };
    }
  }

  /**
   * Mark invoice as paid
   */
  public async markInvoicePaid(
    invoiceId: string,
    transactionId: string,
    paidAmount?: number
  ): Promise<PaymentApiResponse<BillingInvoice>> {
    try {
      const updateData = {
        status: 'paid',
        paid_at: new Date().toISOString(),
        metadata: {
          transaction_id: transactionId,
          paid_amount: paidAmount
        }
      };

      const { data, error } = await supabase
        .from('billing_invoices')
        .update(updateData)
        .eq('id', invoiceId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const invoice = data as BillingInvoice;

      // Send payment confirmation email
      await this.sendPaymentConfirmation(invoice);

      return {
        success: true,
        data: invoice
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INVOICE_UPDATE_ERROR',
          message: (error as Error).message
        }
      };
    }
  }

  /**
   * Cancel invoice
   */
  public async cancelInvoice(invoiceId: string, reason?: string): Promise<PaymentApiResponse<BillingInvoice>> {
    try {
      const updateData = {
        status: 'cancelled',
        metadata: {
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason
        }
      };

      const { data, error } = await supabase
        .from('billing_invoices')
        .update(updateData)
        .eq('id', invoiceId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: data as BillingInvoice
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INVOICE_CANCEL_ERROR',
          message: (error as Error).message
        }
      };
    }
  }

  /**
   * Send invoice to customer
   */
  public async sendInvoice(invoiceId: string): Promise<PaymentApiResponse<boolean>> {
    try {
      // Get invoice details
      const invoiceResponse = await this.getInvoiceDetails(invoiceId);
      if (!invoiceResponse.success) {
        return invoiceResponse;
      }

      const invoice = invoiceResponse.data!;

      // Update invoice status
      await supabase
        .from('billing_invoices')
        .update({ status: 'sent' })
        .eq('id', invoiceId);

      // Send email (integrate with email service)
      await this.sendInvoiceEmail(invoice);

      return {
        success: true,
        data: true
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INVOICE_SEND_ERROR',
          message: (error as Error).message
        }
      };
    }
  }

  /**
   * Apply discount to invoice
   */
  public async applyDiscount(
    invoiceId: string,
    discountCode: string,
    discountAmount: number,
    discountType: 'percentage' | 'fixed'
  ): Promise<PaymentApiResponse<BillingInvoice>> {
    try {
      // Get current invoice
      const invoiceResponse = await this.getInvoiceDetails(invoiceId);
      if (!invoiceResponse.success) {
        return invoiceResponse;
      }

      const invoice = invoiceResponse.data!;

      // Calculate new discount amount
      let newDiscountAmount = discountAmount;
      if (discountType === 'percentage') {
        newDiscountAmount = (invoice.subtotal * discountAmount) / 100;
      }

      // Calculate new total
      const newTotalAmount = invoice.subtotal + invoice.taxAmount - newDiscountAmount;

      const updateData = {
        discount_amount: newDiscountAmount,
        total_amount: newTotalAmount,
        metadata: {
          ...invoice.metadata,
          discount_code: discountCode,
          discount_type: discountType,
          discount_applied_at: new Date().toISOString()
        }
      };

      const { data, error } = await supabase
        .from('billing_invoices')
        .update(updateData)
        .eq('id', invoiceId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: data as BillingInvoice
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DISCOUNT_APPLY_ERROR',
          message: (error as Error).message
        }
      };
    }
  }

  /**
   * Get billing summary for a user
   */
  public async getBillingSummary(
    userId: string,
    fromDate?: string,
    toDate?: string
  ): Promise<PaymentApiResponse<any>> {
    try {
      const { data, error } = await supabase.rpc('get_billing_summary', {
        user_id: userId,
        from_date: fromDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        to_date: toDate || new Date().toISOString()
      });

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'BILLING_SUMMARY_ERROR',
          message: (error as Error).message
        }
      };
    }
  }

  /**
   * Get overdue invoices
   */
  public async getOverdueInvoices(userId?: string): Promise<PaymentApiResponse<BillingInvoice[]>> {
    try {
      let query = supabase
        .from('billing_invoices')
        .select('*')
        .eq('status', 'sent')
        .lt('due_date', new Date().toISOString())
        .order('due_date', { ascending: true });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: data as BillingInvoice[]
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'OVERDUE_INVOICES_ERROR',
          message: (error as Error).message
        }
      };
    }
  }

  /**
   * Process dunning for overdue invoices
   */
  public async processDunning(): Promise<PaymentApiResponse<any>> {
    try {
      const overdueResponse = await this.getOverdueInvoices();
      if (!overdueResponse.success) {
        return overdueResponse;
      }

      const overdueInvoices = overdueResponse.data!;
      const processedInvoices = [];

      for (const invoice of overdueInvoices) {
        const daysPastDue = Math.floor(
          (Date.now() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)
        );

        // Send reminder emails based on days past due
        if (daysPastDue === 1) {
          await this.sendFirstReminder(invoice);
        } else if (daysPastDue === 7) {
          await this.sendSecondReminder(invoice);
        } else if (daysPastDue === 14) {
          await this.sendFinalNotice(invoice);
        } else if (daysPastDue === 30) {
          await this.suspendService(invoice);
        }

        // Update invoice status to overdue
        await supabase
          .from('billing_invoices')
          .update({ 
            status: 'overdue',
            metadata: {
              ...invoice.metadata,
              days_past_due: daysPastDue,
              last_reminder_sent: new Date().toISOString()
            }
          })
          .eq('id', invoice.id);

        processedInvoices.push(invoice.id);
      }

      return {
        success: true,
        data: {
          processed_count: processedInvoices.length,
          processed_invoices: processedInvoices
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DUNNING_PROCESS_ERROR',
          message: (error as Error).message
        }
      };
    }
  }

  /**
   * Calculate tax amount based on country and amount
   */
  private calculateTax(amount: number, country: string): number {
    const taxRate = this.getTaxRate(country);
    return Math.round(amount * taxRate * 100) / 100;
  }

  /**
   * Get tax rate for country
   */
  private getTaxRate(country: string): number {
    switch (country.toUpperCase()) {
      case 'IN':
      case 'INDIA':
        return this.TAX_RATES.GST_INDIA;
      case 'US':
      case 'USA':
      case 'UNITED STATES':
        return this.TAX_RATES.SALES_TAX_US;
      default:
        // EU countries
        if (['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT'].includes(country.toUpperCase())) {
          return this.TAX_RATES.VAT_EU;
        }
        return 0; // No tax for other countries
    }
  }

  /**
   * Get currency based on country
   */
  private getCurrencyByCountry(country: string): Currency {
    switch (country.toUpperCase()) {
      case 'IN':
      case 'INDIA':
        return 'INR';
      case 'US':
      case 'USA':
      case 'UNITED STATES':
        return 'USD';
      case 'GB':
      case 'UK':
      case 'UNITED KINGDOM':
        return 'GBP';
      case 'AU':
      case 'AUSTRALIA':
        return 'AUD';
      case 'CA':
      case 'CANADA':
        return 'CAD';
      default:
        // EU countries
        if (['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT'].includes(country.toUpperCase())) {
          return 'EUR';
        }
        return 'USD'; // Default to USD
    }
  }

  /**
   * Generate unique invoice number
   */
  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    
    // Get count of invoices this month
    const { count } = await supabase
      .from('billing_invoices')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${year}-${month}-01`)
      .lt('created_at', `${year}-${month === '12' ? year + 1 : year}-${month === '12' ? '01' : (parseInt(month) + 1).toString().padStart(2, '0')}-01`);

    const sequence = ((count || 0) + 1).toString().padStart(4, '0');
    return `INV-${year}${month}-${sequence}`;
  }

  /**
   * Get default due date (30 days from now)
   */
  private getDefaultDueDate(): string {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    return dueDate.toISOString();
  }

  /**
   * Generate PDF invoice (placeholder - integrate with PDF service)
   */
  private async generateInvoicePDF(invoice: BillingInvoice): Promise<void> {
    try {
      // This would integrate with a PDF generation service
      // For now, just store the URL in metadata
      await supabase
        .from('billing_invoices')
        .update({
          metadata: {
            ...invoice.metadata,
            pdf_url: `https://your-app.com/invoices/${invoice.id}.pdf`
          }
        })
        .eq('id', invoice.id);
    } catch (error) {
      ErrorHandler.handle(error as Error, 'BillingService.generateInvoicePDF');
    }
  }

  /**
   * Send invoice email (placeholder - integrate with email service)
   */
  private async sendInvoiceEmail(invoice: BillingInvoice): Promise<void> {
    try {
      // This would integrate with an email service like SendGrid or Mailgun
      console.log(`Sending invoice ${invoice.invoiceNumber} to ${invoice.billingAddress.email}`);
      
      // Log the email sending attempt
      await supabase
        .from('email_logs')
        .insert({
          recipient: invoice.billingAddress.email,
          subject: `Invoice ${invoice.invoiceNumber} from Manushi Coaching Platform`,
          type: 'invoice',
          status: 'sent',
          metadata: {
            invoice_id: invoice.id,
            invoice_number: invoice.invoiceNumber
          }
        });
    } catch (error) {
      ErrorHandler.handle(error as Error, 'BillingService.sendInvoiceEmail');
    }
  }

  /**
   * Send payment confirmation (placeholder - integrate with email service)
   */
  private async sendPaymentConfirmation(invoice: BillingInvoice): Promise<void> {
    try {
      console.log(`Sending payment confirmation for invoice ${invoice.invoiceNumber}`);
      
      // Log the email sending attempt
      await supabase
        .from('email_logs')
        .insert({
          recipient: invoice.billingAddress.email,
          subject: `Payment Received - Invoice ${invoice.invoiceNumber}`,
          type: 'payment_confirmation',
          status: 'sent',
          metadata: {
            invoice_id: invoice.id,
            invoice_number: invoice.invoiceNumber,
            amount_paid: invoice.totalAmount
          }
        });
    } catch (error) {
      ErrorHandler.handle(error as Error, 'BillingService.sendPaymentConfirmation');
    }
  }

  /**
   * Send first reminder for overdue invoice
   */
  private async sendFirstReminder(invoice: BillingInvoice): Promise<void> {
    // Implementation for first reminder email
    console.log(`Sending first reminder for invoice ${invoice.invoiceNumber}`);
  }

  /**
   * Send second reminder for overdue invoice
   */
  private async sendSecondReminder(invoice: BillingInvoice): Promise<void> {
    // Implementation for second reminder email
    console.log(`Sending second reminder for invoice ${invoice.invoiceNumber}`);
  }

  /**
   * Send final notice for overdue invoice
   */
  private async sendFinalNotice(invoice: BillingInvoice): Promise<void> {
    // Implementation for final notice email
    console.log(`Sending final notice for invoice ${invoice.invoiceNumber}`);
  }

  /**
   * Suspend service for very overdue invoice
   */
  private async suspendService(invoice: BillingInvoice): Promise<void> {
    // Implementation to suspend user services
    console.log(`Suspending service for invoice ${invoice.invoiceNumber}`);
  }
}

// Export singleton instance
export const billingService = new BillingService();