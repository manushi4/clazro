# API Integration Guide & Technical Specifications
## Coaching Management Mobile App - Detailed Integration Documentation

### Executive Summary
This document provides detailed API integration specifications, third-party service integration guides, and technical implementation details for the Coaching Management Mobile App. It includes comprehensive examples, error handling patterns, and integration best practices for development teams.

---

## 1. Core API Architecture

### 1.1 REST API Design Patterns

**Base API Configuration**
```typescript
// api/config.ts
export const API_CONFIG = {
  BASE_URL: process.env.API_BASE_URL || 'https://api.coachingapp.com',
  VERSION: 'v1',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

export const ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
    BIOMETRIC_SETUP: '/auth/biometric/setup',
  },
  
  // User Management
  USERS: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    UPLOAD_AVATAR: '/users/avatar',
    PREFERENCES: '/users/preferences',
    DASHBOARD: (role: string) => `/users/dashboard/${role}`,
  },
  
  // Students
  STUDENTS: {
    DASHBOARD: (studentId: string) => `/students/${studentId}/dashboard`,
    SCHEDULE: (studentId: string) => `/students/${studentId}/schedule`,
    ASSIGNMENTS: (studentId: string) => `/students/${studentId}/assignments`,
    ASSIGNMENT_DETAIL: (studentId: string, assignmentId: string) => 
      `/students/${studentId}/assignments/${assignmentId}`,
    SUBMIT_ASSIGNMENT: (studentId: string, assignmentId: string) => 
      `/students/${studentId}/assignments/${assignmentId}/submit`,
    GRADES: (studentId: string) => `/students/${studentId}/grades`,
    ATTENDANCE: (studentId: string) => `/students/${studentId}/attendance`,
    DOUBTS: (studentId: string) => `/students/${studentId}/doubts`,
    SUBMIT_DOUBT: (studentId: string) => `/students/${studentId}/doubts/submit`,
    PERFORMANCE: (studentId: string) => `/students/${studentId}/performance`,
  },
  
  // Teachers
  TEACHERS: {
    DASHBOARD: (teacherId: string) => `/teachers/${teacherId}/dashboard`,
    CLASSES: (teacherId: string) => `/teachers/${teacherId}/classes`,
    STUDENTS: (teacherId: string) => `/teachers/${teacherId}/students`,
    ASSIGNMENTS: (teacherId: string) => `/teachers/${teacherId}/assignments`,
    CREATE_ASSIGNMENT: (teacherId: string) => `/teachers/${teacherId}/assignments`,
    GRADE_ASSIGNMENT: (teacherId: string, assignmentId: string) => 
      `/teachers/${teacherId}/assignments/${assignmentId}/grade`,
    ATTENDANCE: (teacherId: string, classId: string) => 
      `/teachers/${teacherId}/classes/${classId}/attendance`,
    MARK_ATTENDANCE: (teacherId: string) => `/teachers/${teacherId}/attendance/mark`,
    DOUBTS: (teacherId: string) => `/teachers/${teacherId}/doubts`,
    ANNOUNCEMENTS: (teacherId: string) => `/teachers/${teacherId}/announcements`,
  },
  
  // Parents
  PARENTS: {
    DASHBOARD: (parentId: string) => `/parents/${parentId}/dashboard`,
    CHILDREN: (parentId: string) => `/parents/${parentId}/children`,
    CHILD_PROGRESS: (parentId: string, studentId: string) => 
      `/parents/${parentId}/children/${studentId}/progress`,
    CHILD_ATTENDANCE: (parentId: string, studentId: string) => 
      `/parents/${parentId}/children/${studentId}/attendance`,
    CHILD_ASSIGNMENTS: (parentId: string, studentId: string) => 
      `/parents/${parentId}/children/${studentId}/assignments`,
    PAYMENTS: (parentId: string) => `/parents/${parentId}/payments`,
    PAYMENT_HISTORY: (parentId: string) => `/parents/${parentId}/payments/history`,
    REPORTS: (parentId: string) => `/parents/${parentId}/reports`,
  },
  
  // Communication
  MESSAGES: {
    CONVERSATIONS: '/messages/conversations',
    CONVERSATION_DETAIL: (userId: string) => `/messages/conversation/${userId}`,
    SEND: '/messages/send',
    VOICE_UPLOAD: '/messages/voice/upload',
    MARK_READ: (messageId: string) => `/messages/${messageId}/read`,
    UNREAD_COUNT: '/messages/unread/count',
  },
  
  // Notifications
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: (notificationId: string) => `/notifications/${notificationId}/read`,
    MARK_ALL_READ: '/notifications/read-all',
    PREFERENCES: '/notifications/preferences',
    DELETE: (notificationId: string) => `/notifications/${notificationId}`,
  },
  
  // Payments
  PAYMENTS: {
    INITIATE: '/payments/initiate',
    VERIFY: '/payments/verify',
    HISTORY: '/payments/history',
    STATUS: (paymentId: string) => `/payments/${paymentId}/status`,
    REFUND: '/payments/refund',
    WEBHOOK: '/payments/webhook',
  },
  
  // Academic
  ACADEMIC: {
    CLASSES: {
      SCHEDULE: '/classes/schedule',
      START: '/classes/start',
      END: '/classes/end',
      ATTENDANCE: (classId: string) => `/classes/${classId}/attendance`,
      MARK_ATTENDANCE: (classId: string) => `/classes/${classId}/attendance/mark`,
    },
    BATCHES: '/batches',
    SUBJECTS: '/subjects',
    INSTITUTES: '/institutes',
  },
  
  // File Management
  FILES: {
    UPLOAD: '/files/upload',
    DOWNLOAD: (fileId: string) => `/files/${fileId}/download`,
    DELETE: (fileId: string) => `/files/${fileId}`,
    BATCH_UPLOAD: '/files/batch-upload',
  },
  
  // AI Services
  AI: {
    RESOLVE_DOUBT: '/ai/resolve-doubt',
    ANALYZE_PERFORMANCE: '/ai/analyze-performance',
    GENERATE_QUESTIONS: '/ai/generate-questions',
    OPTIMIZE_SCHEDULE: '/ai/optimize-schedule',
  },
} as const;
```

### 1.2 API Client Implementation

**HTTP Client with Interceptors**
```typescript
// api/client.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { API_CONFIG } from './config';
import { AuthService } from '../services/AuthService';
import { NetworkService } from '../services/NetworkService';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
}

class ApiClient {
  private client: AxiosInstance;
  private authService: AuthService;
  private networkService: NetworkService;

  constructor() {
    this.authService = new AuthService();
    this.networkService = new NetworkService();
    
    this.client = axios.create({
      baseURL: `${API_CONFIG.BASE_URL}/${API_CONFIG.VERSION}`,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        // Add authentication token
        const token = await this.authService.getAccessToken();
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }

        // Add device information
        config.headers['X-Device-ID'] = await this.getDeviceId();
        config.headers['X-App-Version'] = this.getAppVersion();
        config.headers['X-Platform'] = this.getPlatform();

        // Add request ID for tracking
        config.headers['X-Request-ID'] = this.generateRequestId();

        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
          headers: config.headers,
          data: config.data,
        });

        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        console.log(`API Response: ${response.status}`, {
          url: response.config.url,
          data: response.data,
        });

        return response;
      },
      async (error: AxiosError<ApiResponse>) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        console.error('API Error:', {
          url: error.config?.url,
          status: error.response?.status,
          message: error.message,
          data: error.response?.data,
        });

        // Handle token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            await this.authService.refreshToken();
            const newToken = await this.authService.getAccessToken();
            
            if (newToken && originalRequest.headers) {
              originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
              return this.client.request(originalRequest);
            }
          } catch (refreshError) {
            // Redirect to login if token refresh fails
            await this.authService.logout();
            throw new Error('Session expired. Please login again.');
          }
        }

        // Handle network errors
        if (!error.response) {
          if (!this.networkService.isConnected()) {
            throw new Error('No internet connection. Please check your network and try again.');
          }
          throw new Error('Network error. Please try again.');
        }

        // Handle specific error status codes
        const apiError: ApiError = {
          message: error.response.data?.message || error.message || 'An error occurred',
          status: error.response.status,
          code: error.response.data?.code,
          details: error.response.data?.errors,
        };

        throw apiError;
      }
    );
  }

  // HTTP Methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.patch<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    return response.data;
  }

  // File upload with progress
  async upload<T = any>(
    url: string,
    formData: FormData,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> {
    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          onProgress(progress);
        }
      },
    };

    const response = await this.client.post<ApiResponse<T>>(url, formData, config);
    return response.data;
  }

  // Retry mechanism
  async withRetry<T = any>(
    operation: () => Promise<ApiResponse<T>>,
    maxRetries: number = API_CONFIG.RETRY_ATTEMPTS
  ): Promise<ApiResponse<T>> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }

        // Exponential backoff
        const delay = API_CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        console.log(`Retry attempt ${attempt} after ${delay}ms`);
      }
    }

    throw lastError!;
  }

  // Helper methods
  private async getDeviceId(): Promise<string> {
    // Implementation to get unique device ID
    return 'device_id_placeholder';
  }

  private getAppVersion(): string {
    // Implementation to get app version
    return '1.0.0';
  }

  private getPlatform(): string {
    // Implementation to detect platform
    return 'react-native';
  }

  private generateRequestId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export const apiClient = new ApiClient();
```

---

## 2. Third-Party Service Integrations

### 2.1 OpenAI GPT-4 Integration

**AI Service Implementation**
```typescript
// services/AIService.ts
import { Configuration, OpenAIApi } from 'openai';

export interface DoubtResolutionRequest {
  question: string;
  subject: string;
  grade: string;
  context?: string;
  attachments?: string[];
}

export interface DoubtResolutionResponse {
  answer: string;
  confidence: number;
  requiresTeacher: boolean;
  relatedConcepts: string[];
  practiceQuestions: string[];
  explanation: string;
  steps?: string[];
}

export interface PerformanceAnalysisRequest {
  studentId: string;
  timeframe: 'week' | 'month' | 'quarter' | 'year';
  subjects?: string[];
  includeComparison?: boolean;
}

export interface PerformanceAnalysisResponse {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  trendAnalysis: {
    improving: string[];
    declining: string[];
    stable: string[];
  };
  comparisonData?: {
    classAverage: number;
    percentile: number;
  };
}

class AIService {
  private openai: OpenAIApi;
  private readonly MODEL = 'gpt-4';
  private readonly MAX_TOKENS = 1000;
  private readonly TEMPERATURE = 0.3;

  constructor() {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
      organization: process.env.OPENAI_ORGANIZATION,
    });
    
    this.openai = new OpenAIApi(configuration);
  }

  async resolveDoubt(request: DoubtResolutionRequest): Promise<DoubtResolutionResponse> {
    try {
      const prompt = this.buildDoubtResolutionPrompt(request);
      
      const response = await this.openai.createCompletion({
        model: this.MODEL,
        prompt,
        max_tokens: this.MAX_TOKENS,
        temperature: this.TEMPERATURE,
        top_p: 1.0,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
      });

      const rawResponse = response.data.choices[0].text?.trim();
      if (!rawResponse) {
        throw new Error('Empty response from AI service');
      }

      return this.parseDoubtResolutionResponse(rawResponse, request);
    } catch (error) {
      console.error('AI doubt resolution error:', error);
      throw new Error('Failed to resolve doubt. Please try again or contact a teacher.');
    }
  }

  async analyzePerformance(request: PerformanceAnalysisRequest): Promise<PerformanceAnalysisResponse> {
    try {
      // Get student data from database
      const studentData = await this.getStudentPerformanceData(request);
      const prompt = this.buildPerformanceAnalysisPrompt(studentData, request);

      const response = await this.openai.createCompletion({
        model: this.MODEL,
        prompt,
        max_tokens: 800,
        temperature: 0.2,
      });

      const rawResponse = response.data.choices[0].text?.trim();
      if (!rawResponse) {
        throw new Error('Empty response from AI service');
      }

      return this.parsePerformanceAnalysisResponse(rawResponse);
    } catch (error) {
      console.error('AI performance analysis error:', error);
      throw new Error('Failed to analyze performance. Please try again later.');
    }
  }

  async generatePracticeQuestions(subject: string, grade: string, topic: string, count: number = 5): Promise<string[]> {
    try {
      const prompt = `Generate ${count} practice questions for ${grade} grade students studying ${subject}, specifically on the topic of ${topic}. 
      
Make the questions:
1. Age-appropriate for ${grade} grade level
2. Progressively challenging
3. Cover different aspects of the topic
4. Include both conceptual and application-based questions

Format each question clearly and number them.`;

      const response = await this.openai.createCompletion({
        model: this.MODEL,
        prompt,
        max_tokens: 600,
        temperature: 0.4,
      });

      const rawResponse = response.data.choices[0].text?.trim();
      if (!rawResponse) {
        throw new Error('Empty response from AI service');
      }

      // Parse questions from response
      return this.parseGeneratedQuestions(rawResponse);
    } catch (error) {
      console.error('AI question generation error:', error);
      throw new Error('Failed to generate practice questions.');
    }
  }

  private buildDoubtResolutionPrompt(request: DoubtResolutionRequest): string {
    return `You are an AI tutor helping a ${request.grade} grade student with ${request.subject}.

Context: ${request.context || 'General question'}

Student's Question: ${request.question}

Please provide:
1. A clear, step-by-step explanation appropriate for ${request.grade} grade level
2. An example if applicable
3. Key concepts to remember
4. Practice tips
5. Related topics the student should explore

Keep your response under 400 words and use simple language appropriate for the grade level.

Response format:
EXPLANATION: [Your detailed explanation]
EXAMPLE: [Relevant example if applicable]
KEY_CONCEPTS: [Important concepts to remember]
PRACTICE_TIPS: [Tips for practicing this topic]
RELATED_TOPICS: [Related topics to explore]
CONFIDENCE: [Your confidence level from 1-10]
TEACHER_NEEDED: [true/false if this requires teacher intervention]`;
  }

  private buildPerformanceAnalysisPrompt(studentData: any, request: PerformanceAnalysisRequest): string {
    return `Analyze the following student performance data and provide insights:

Student Performance Data:
${JSON.stringify(studentData, null, 2)}

Time Period: ${request.timeframe}
Subjects: ${request.subjects?.join(', ') || 'All subjects'}

Please analyze and provide:
1. Overall performance score (1-100)
2. Top 3 strengths
3. Top 3 areas for improvement
4. Specific recommendations for improvement
5. Trend analysis (improving, declining, stable areas)

Keep recommendations practical and actionable for a ${studentData.grade} grade student.

Response format:
OVERALL_SCORE: [Score from 1-100]
STRENGTHS: [List top 3 strengths]
WEAKNESSES: [List top 3 areas needing improvement]
RECOMMENDATIONS: [List specific actionable recommendations]
TRENDS: [Analyze trends in performance]`;
  }

  private parseDoubtResolutionResponse(rawResponse: string, request: DoubtResolutionRequest): DoubtResolutionResponse {
    try {
      const sections = this.parseSections(rawResponse);
      
      return {
        answer: sections.EXPLANATION || rawResponse,
        confidence: parseInt(sections.CONFIDENCE || '7') / 10,
        requiresTeacher: sections.TEACHER_NEEDED === 'true',
        relatedConcepts: this.parseListItems(sections.KEY_CONCEPTS || ''),
        practiceQuestions: this.parseListItems(sections.PRACTICE_TIPS || ''),
        explanation: sections.EXPLANATION || rawResponse,
        steps: sections.EXAMPLE ? [sections.EXAMPLE] : undefined,
      };
    } catch (error) {
      console.error('Error parsing doubt resolution response:', error);
      // Return basic response if parsing fails
      return {
        answer: rawResponse,
        confidence: 0.7,
        requiresTeacher: false,
        relatedConcepts: [],
        practiceQuestions: [],
        explanation: rawResponse,
      };
    }
  }

  private parsePerformanceAnalysisResponse(rawResponse: string): PerformanceAnalysisResponse {
    try {
      const sections = this.parseSections(rawResponse);
      
      return {
        overallScore: parseInt(sections.OVERALL_SCORE || '75'),
        strengths: this.parseListItems(sections.STRENGTHS || ''),
        weaknesses: this.parseListItems(sections.WEAKNESSES || ''),
        recommendations: this.parseListItems(sections.RECOMMENDATIONS || ''),
        trendAnalysis: {
          improving: [],
          declining: [],
          stable: [],
        },
      };
    } catch (error) {
      console.error('Error parsing performance analysis response:', error);
      throw new Error('Failed to parse AI response');
    }
  }

  private parseSections(text: string): Record<string, string> {
    const sections: Record<string, string> = {};
    const lines = text.split('\n');
    let currentSection = '';
    let currentContent = '';

    for (const line of lines) {
      const sectionMatch = line.match(/^([A-Z_]+):\s*(.*)$/);
      if (sectionMatch) {
        if (currentSection) {
          sections[currentSection] = currentContent.trim();
        }
        currentSection = sectionMatch[1];
        currentContent = sectionMatch[2];
      } else if (currentSection) {
        currentContent += '\n' + line;
      }
    }

    if (currentSection) {
      sections[currentSection] = currentContent.trim();
    }

    return sections;
  }

  private parseListItems(text: string): string[] {
    return text.split(/[,\n]/)
      .map(item => item.trim())
      .filter(item => item.length > 0)
      .slice(0, 5); // Limit to 5 items
  }

  private parseGeneratedQuestions(text: string): string[] {
    return text.split(/\d+\./)
      .map(q => q.trim())
      .filter(q => q.length > 0)
      .map(q => q.replace(/^\d+\.?\s*/, ''))
      .slice(0, 10); // Maximum 10 questions
  }

  private async getStudentPerformanceData(request: PerformanceAnalysisRequest): Promise<any> {
    // This would fetch actual student data from the database
    // For now, returning a placeholder structure
    return {
      studentId: request.studentId,
      grade: '10th',
      subjects: request.subjects || ['Math', 'Science', 'English'],
      timeframe: request.timeframe,
      // Additional performance data would be fetched here
    };
  }
}

export const aiService = new AIService();
```

### 2.2 Razorpay Payment Integration

**Payment Service Implementation**
```typescript
// services/PaymentService.ts
import Razorpay from 'razorpay';

export interface PaymentRequest {
  amount: number; // in paise
  currency: string;
  studentId: string;
  parentId?: string;
  description: string;
  paymentType: 'tuition_fee' | 'admission_fee' | 'exam_fee' | 'other';
  dueDate?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  orderId: string;
  amount: number;
  currency: string;
  razorpayOrderId: string;
  status: 'created' | 'attempted' | 'paid' | 'failed' | 'cancelled';
  createdAt: string;
}

export interface PaymentVerificationRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

class PaymentService {
  private razorpay: Razorpay;

  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }

  async createOrder(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const orderOptions = {
        amount: request.amount,
        currency: request.currency,
        receipt: `receipt_${request.studentId}_${Date.now()}`,
        notes: {
          student_id: request.studentId,
          parent_id: request.parentId || '',
          payment_type: request.paymentType,
          description: request.description,
          ...request.metadata,
        },
      };

      const order = await this.razorpay.orders.create(orderOptions);

      // Save order details to database
      const paymentRecord = await this.savePaymentRecord({
        orderId: order.id,
        amount: request.amount,
        currency: request.currency,
        studentId: request.studentId,
        parentId: request.parentId,
        paymentType: request.paymentType,
        description: request.description,
        status: 'created',
        dueDate: request.dueDate,
        razorpayOrderId: order.id,
      });

      return {
        orderId: paymentRecord.id,
        amount: order.amount,
        currency: order.currency,
        razorpayOrderId: order.id,
        status: 'created',
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Payment order creation error:', error);
      throw new Error('Failed to create payment order');
    }
  }

  async verifyPayment(request: PaymentVerificationRequest): Promise<boolean> {
    try {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(`${request.razorpayOrderId}|${request.razorpayPaymentId}`)
        .digest('hex');

      if (expectedSignature !== request.razorpaySignature) {
        await this.updatePaymentStatus(request.razorpayOrderId, 'failed', {
          reason: 'Signature verification failed',
          razorpayPaymentId: request.razorpayPaymentId,
        });
        return false;
      }

      // Payment verified successfully
      await this.updatePaymentStatus(request.razorpayOrderId, 'paid', {
        razorpayPaymentId: request.razorpayPaymentId,
        paidAt: new Date().toISOString(),
      });

      // Send confirmation notifications
      await this.sendPaymentConfirmation(request.razorpayOrderId);

      return true;
    } catch (error) {
      console.error('Payment verification error:', error);
      throw new Error('Failed to verify payment');
    }
  }

  async initiateRefund(paymentId: string, amount?: number, reason?: string): Promise<any> {
    try {
      const payment = await this.getPaymentByRazorpayId(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      const refundAmount = amount || payment.amount;
      const refund = await this.razorpay.payments.refund(paymentId, {
        amount: refundAmount,
        notes: {
          reason: reason || 'Refund requested',
          refund_type: amount ? 'partial' : 'full',
        },
      });

      // Update payment record
      await this.updatePaymentRefund(payment.id, {
        refundId: refund.id,
        refundAmount: refundAmount,
        refundStatus: refund.status,
        refundReason: reason,
        refundedAt: new Date().toISOString(),
      });

      return refund;
    } catch (error) {
      console.error('Refund initiation error:', error);
      throw new Error('Failed to initiate refund');
    }
  }

  async handleWebhook(webhookBody: any, signature: string): Promise<void> {
    try {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
        .update(JSON.stringify(webhookBody))
        .digest('hex');

      if (expectedSignature !== signature) {
        throw new Error('Webhook signature verification failed');
      }

      const { event, payload } = webhookBody;
      
      switch (event) {
        case 'payment.captured':
          await this.handlePaymentCaptured(payload.payment.entity);
          break;
        
        case 'payment.failed':
          await this.handlePaymentFailed(payload.payment.entity);
          break;
        
        case 'refund.processed':
          await this.handleRefundProcessed(payload.refund.entity);
          break;
        
        default:
          console.log(`Unhandled webhook event: ${event}`);
      }
    } catch (error) {
      console.error('Webhook handling error:', error);
      throw error;
    }
  }

  private async handlePaymentCaptured(paymentData: any): Promise<void> {
    await this.updatePaymentStatus(paymentData.order_id, 'paid', {
      razorpayPaymentId: paymentData.id,
      capturedAt: new Date(paymentData.created_at * 1000).toISOString(),
      method: paymentData.method,
      bank: paymentData.bank,
      wallet: paymentData.wallet,
    });

    await this.sendPaymentConfirmation(paymentData.order_id);
  }

  private async handlePaymentFailed(paymentData: any): Promise<void> {
    await this.updatePaymentStatus(paymentData.order_id, 'failed', {
      razorpayPaymentId: paymentData.id,
      failureReason: paymentData.error_description,
      failedAt: new Date(paymentData.created_at * 1000).toISOString(),
    });

    await this.sendPaymentFailureNotification(paymentData.order_id);
  }

  private async handleRefundProcessed(refundData: any): Promise<void> {
    // Update refund status in database
    console.log('Refund processed:', refundData);
    // Implementation for handling processed refunds
  }

  private async savePaymentRecord(data: any): Promise<any> {
    // Implementation to save payment record to database
    return { id: 'payment_' + Date.now(), ...data };
  }

  private async updatePaymentStatus(orderId: string, status: string, metadata: any): Promise<void> {
    // Implementation to update payment status in database
    console.log(`Updating payment ${orderId} to ${status}`, metadata);
  }

  private async updatePaymentRefund(paymentId: string, refundData: any): Promise<void> {
    // Implementation to update refund information in database
    console.log(`Updating refund for payment ${paymentId}`, refundData);
  }

  private async getPaymentByRazorpayId(razorpayId: string): Promise<any> {
    // Implementation to get payment by Razorpay ID
    return { id: 'payment_123', amount: 10000, razorpayPaymentId: razorpayId };
  }

  private async sendPaymentConfirmation(orderId: string): Promise<void> {
    // Implementation to send payment confirmation notifications
    console.log(`Sending payment confirmation for order ${orderId}`);
  }

  private async sendPaymentFailureNotification(orderId: string): Promise<void> {
    // Implementation to send payment failure notifications
    console.log(`Sending payment failure notification for order ${orderId}`);
  }
}

export const paymentService = new PaymentService();
```

### 2.3 Real-time Communication with Socket.io

**WebSocket Service Implementation**
```typescript
// services/SocketService.ts
import io, { Socket } from 'socket.io-client';

export interface SocketEvent {
  event: string;
  data: any;
  timestamp: string;
}

export interface MessageEvent {
  messageId: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'voice' | 'image' | 'document';
  mediaUrl?: string;
  timestamp: string;
}

export interface ClassEvent {
  classId: string;
  action: 'started' | 'ended' | 'joined' | 'left';
  userId: string;
  meetingUrl?: string;
  timestamp: string;
}

class SocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private eventListeners: Map<string, Function[]> = new Map();

  async connect(token: string, userId: string): Promise<void> {
    try {
      this.socket = io(process.env.SOCKET_URL || 'http://localhost:3001', {
        auth: {
          token,
          userId,
        },
        transports: ['websocket'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
      });

      this.setupEventHandlers();
      
      return new Promise((resolve, reject) => {
        this.socket?.on('connect', () => {
          console.log('Socket connected successfully');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve();
        });

        this.socket?.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          reject(error);
        });

        // Set timeout for connection
        setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error('Socket connection timeout'));
          }
        }, 10000);
      });
    } catch (error) {
      console.error('Failed to connect socket:', error);
      throw error;
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('Socket disconnected');
    }
  }

  // Message events
  sendMessage(receiverId: string, content: string, type: 'text' | 'voice' | 'image' | 'document' = 'text', mediaUrl?: string): void {
    if (!this.isConnected) {
      throw new Error('Socket not connected');
    }

    const messageData: Omit<MessageEvent, 'messageId' | 'timestamp'> = {
      senderId: '', // Will be set by server
      receiverId,
      content,
      type,
      mediaUrl,
    };

    this.socket?.emit('message:send', messageData);
  }

  // Class events
  joinClass(classId: string): void {
    if (!this.isConnected) return;
    this.socket?.emit('class:join', { classId });
  }

  leaveClass(classId: string): void {
    if (!this.isConnected) return;
    this.socket?.emit('class:leave', { classId });
  }

  startClass(classId: string, meetingUrl: string): void {
    if (!this.isConnected) return;
    this.socket?.emit('class:start', { classId, meetingUrl });
  }

  endClass(classId: string): void {
    if (!this.isConnected) return;
    this.socket?.emit('class:end', { classId });
  }

  // Notification events
  markNotificationRead(notificationId: string): void {
    if (!this.isConnected) return;
    this.socket?.emit('notification:read', { notificationId });
  }

  // Event listeners
  onMessage(callback: (message: MessageEvent) => void): void {
    this.addEventListener('message:received', callback);
  }

  onClassUpdate(callback: (classEvent: ClassEvent) => void): void {
    this.addEventListener('class:update', callback);
  }

  onNotification(callback: (notification: any) => void): void {
    this.addEventListener('notification:received', callback);
  }

  onAssignmentUpdate(callback: (assignment: any) => void): void {
    this.addEventListener('assignment:update', callback);
  }

  onGradeUpdate(callback: (grade: any) => void): void {
    this.addEventListener('grade:update', callback);
  }

  // Generic event listener management
  addEventListener(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)?.push(callback);

    // Also add to socket if connected
    if (this.socket) {
      this.socket.on(event, callback as any);
    }
  }

  removeEventListener(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }

    // Also remove from socket
    if (this.socket) {
      this.socket.off(event, callback as any);
    }
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
      
      // Try to reconnect for certain disconnect reasons
      if (reason === 'io server disconnect') {
        // Server disconnected, don't reconnect automatically
        return;
      }
      
      this.handleReconnection();
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`Socket reconnected after ${attemptNumber} attempts`);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        // Notify user about connection issues
        this.notifyConnectionIssue();
      }
    });

    // Set up all previously registered event listeners
    this.eventListeners.forEach((callbacks, event) => {
      callbacks.forEach(callback => {
        this.socket?.on(event, callback as any);
      });
    });
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      console.log(`Attempting to reconnect... (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
    }
  }

  private notifyConnectionIssue(): void {
    // Implementation to notify user about connection issues
    console.error('Connection issues detected. Please check your network.');
  }

  // Utility methods
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  getConnectionStatus(): 'connected' | 'disconnected' | 'connecting' {
    if (this.isConnected) return 'connected';
    if (this.socket && !this.socket.connected) return 'connecting';
    return 'disconnected';
  }
}

export const socketService = new SocketService();
```

---

## 3. Error Handling & Resilience Patterns

### 3.1 Comprehensive Error Handling

**Error Handler Service**
```typescript
// services/ErrorHandlerService.ts
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  CLIENT_ERROR = 'CLIENT_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

export interface AppError {
  type: ErrorType;
  message: string;
  code?: string;
  details?: any;
  retryable: boolean;
  userMessage: string;
  timestamp: string;
}

class ErrorHandlerService {
  handleError(error: any): AppError {
    console.error('Error occurred:', error);

    // Network errors
    if (!error.response && error.code === 'ECONNABORTED') {
      return {
        type: ErrorType.TIMEOUT_ERROR,
        message: 'Request timeout',
        retryable: true,
        userMessage: 'Request timed out. Please try again.',
        timestamp: new Date().toISOString(),
      };
    }

    if (!error.response) {
      return {
        type: ErrorType.NETWORK_ERROR,
        message: 'Network error',
        retryable: true,
        userMessage: 'Please check your internet connection and try again.',
        timestamp: new Date().toISOString(),
      };
    }

    // HTTP status code based errors
    const status = error.response?.status;
    const data = error.response?.data;

    switch (status) {
      case 401:
        return {
          type: ErrorType.AUTHENTICATION_ERROR,
          message: 'Authentication failed',
          code: data?.code,
          retryable: false,
          userMessage: 'Please login again to continue.',
          timestamp: new Date().toISOString(),
        };

      case 403:
        return {
          type: ErrorType.AUTHENTICATION_ERROR,
          message: 'Access denied',
          retryable: false,
          userMessage: 'You do not have permission to perform this action.',
          timestamp: new Date().toISOString(),
        };

      case 422:
        return {
          type: ErrorType.VALIDATION_ERROR,
          message: 'Validation failed',
          details: data?.errors,
          retryable: false,
          userMessage: this.formatValidationErrors(data?.errors),
          timestamp: new Date().toISOString(),
        };

      case 429:
        return {
          type: ErrorType.RATE_LIMIT_ERROR,
          message: 'Rate limit exceeded',
          retryable: true,
          userMessage: 'Too many requests. Please wait a moment and try again.',
          timestamp: new Date().toISOString(),
        };

      case 500:
      case 502:
      case 503:
      case 504:
        return {
          type: ErrorType.SERVER_ERROR,
          message: 'Server error',
          code: status.toString(),
          retryable: true,
          userMessage: 'Server is temporarily unavailable. Please try again later.',
          timestamp: new Date().toISOString(),
        };

      default:
        return {
          type: ErrorType.CLIENT_ERROR,
          message: data?.message || error.message || 'An error occurred',
          code: status?.toString(),
          retryable: false,
          userMessage: data?.message || 'Something went wrong. Please try again.',
          timestamp: new Date().toISOString(),
        };
    }
  }

  private formatValidationErrors(errors: Record<string, string[]>): string {
    if (!errors) return 'Please check your input and try again.';

    const errorMessages = Object.values(errors).flat();
    return errorMessages.join('. ');
  }

  logError(error: AppError, context?: any): void {
    const logData = {
      ...error,
      context,
      userAgent: navigator.userAgent,
      url: window.location?.href,
      userId: this.getCurrentUserId(),
    };

    // Send to logging service
    console.error('Application Error:', logData);
    
    // In production, send to error tracking service like Sentry
    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorTracking(logData);
    }
  }

  private getCurrentUserId(): string | null {
    // Implementation to get current user ID
    return null;
  }

  private sendToErrorTracking(errorData: any): void {
    // Implementation to send error to tracking service
    console.log('Sending error to tracking service:', errorData);
  }
}

export const errorHandlerService = new ErrorHandlerService();
```

### 3.2 Retry and Circuit Breaker Patterns

**Resilience Service**
```typescript
// services/ResilienceService.ts
interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryCondition?: (error: any) => boolean;
}

interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private successCount: number = 0;

  constructor(private options: CircuitBreakerOptions) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime < this.options.resetTimeout) {
        throw new Error('Circuit breaker is OPEN');
      } else {
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= 3) { // Require 3 successes to close
        this.state = CircuitState.CLOSED;
      }
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.options.failureThreshold) {
      this.state = CircuitState.OPEN;
    }
  }

  getState(): CircuitState {
    return this.state;
  }
}

class ResilienceService {
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();

  async withRetry<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    const config: RetryOptions = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      retryCondition: (error) => {
        // Retry on network errors and 5xx server errors
        return !error.response || (error.response.status >= 500 && error.response.status < 600);
      },
      ...options,
    };

    let lastError: Error;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt === config.maxAttempts || !config.retryCondition!(error)) {
          throw lastError;
        }

        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
          config.maxDelay
        );

        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms:`, error.message);
        await this.delay(delay);
      }
    }

    throw lastError!;
  }

  async withCircuitBreaker<T>(
    key: string,
    operation: () => Promise<T>,
    options: Partial<CircuitBreakerOptions> = {}
  ): Promise<T> {
    if (!this.circuitBreakers.has(key)) {
      const config: CircuitBreakerOptions = {
        failureThreshold: 5,
        resetTimeout: 60000, // 1 minute
        monitoringPeriod: 10000, // 10 seconds
        ...options,
      };
      this.circuitBreakers.set(key, new CircuitBreaker(config));
    }

    const circuitBreaker = this.circuitBreakers.get(key)!;
    return await circuitBreaker.execute(operation);
  }

  // Combine retry and circuit breaker patterns
  async withResilience<T>(
    key: string,
    operation: () => Promise<T>,
    retryOptions: Partial<RetryOptions> = {},
    circuitOptions: Partial<CircuitBreakerOptions> = {}
  ): Promise<T> {
    return await this.withCircuitBreaker(
      key,
      () => this.withRetry(operation, retryOptions),
      circuitOptions
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getCircuitBreakerState(key: string): CircuitState | undefined {
    return this.circuitBreakers.get(key)?.getState();
  }

  resetCircuitBreaker(key: string): void {
    this.circuitBreakers.delete(key);
  }
}

export const resilienceService = new ResilienceService();
```

This comprehensive API integration guide provides development teams with detailed technical specifications, implementation examples, and best practices for integrating all third-party services and building resilient, scalable APIs for the Coaching Management Mobile App.