# System Architecture Design
## Coaching Management Mobile App - Technical Planning

### Executive Summary
This document outlines the comprehensive system architecture for a unified coaching management mobile application designed to eliminate external dependencies while providing superior functionality. The architecture supports a multi-role ecosystem (Students, Teachers, Parents, Admins) with AI-powered automation and real-time communication.

---

## 1. Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                              │
├─────────────────────────────────────────────────────────────┤
│  React Native App (iOS/Android)                             │
│  ├── Student Dashboard    ├── Teacher Dashboard             │
│  ├── Parent Dashboard     ├── Admin Dashboard               │
│  └── Offline-First Sync   └── Real-time Updates             │
└─────────────────────────────────────────────────────────────┘
                               │
                          API Gateway
                               │
┌─────────────────────────────────────────────────────────────┐
│                 MICROSERVICES LAYER                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐             │
│  │    Auth     │ │    User     │ │   Academic  │             │
│  │   Service   │ │ Management  │ │   Service   │             │
│  └─────────────┘ └─────────────┘ └─────────────┘             │
│                                                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐             │
│  │Communication│ │   Payment   │ │   AI/ML     │             │
│  │   Service   │ │   Service   │ │   Engine    │             │
│  └─────────────┘ └─────────────┘ └─────────────┘             │
└─────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────┐
│                   DATA LAYER                                │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐             │
│  │ PostgreSQL  │ │    Redis    │ │   AWS S3    │             │
│  │  Primary    │ │    Cache    │ │File Storage │             │
│  │  Database   │ │   & Session │ │             │             │
│  └─────────────┘ └─────────────┘ └─────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Microservices Breakdown

#### Authentication Service
- **Purpose**: User authentication, authorization, and session management
- **Technology**: Node.js + Express.js
- **Features**: 
  - JWT token management with biometric support
  - Multi-factor authentication
  - Role-based access control (RBAC)
  - Automated credential generation

#### User Management Service
- **Purpose**: User profile management across all roles
- **Technology**: Node.js + Express.js
- **Features**:
  - Student/Teacher/Parent/Admin profile management
  - Automated account linking (Parent-Child relationships)
  - Profile synchronization across roles

#### Academic Service
- **Purpose**: Core educational functionality
- **Technology**: Node.js + Express.js
- **Features**:
  - Class scheduling and management
  - Assignment creation and grading
  - Performance analytics
  - Attendance tracking

#### Communication Service
- **Purpose**: Real-time messaging and notifications
- **Technology**: Node.js + Socket.io
- **Features**:
  - Real-time chat between stakeholders
  - Push notifications via Firebase
  - Voice message support
  - Translation capabilities

#### Payment Service
- **Purpose**: Fee management and payment processing
- **Technology**: Node.js + Razorpay SDK
- **Features**:
  - Automated fee reminders
  - EMI setup and tracking
  - Receipt generation
  - Payment history management

#### AI/ML Engine
- **Purpose**: Intelligent automation and insights
- **Technology**: Node.js + OpenAI GPT-4
- **Features**:
  - Smart doubt resolution
  - Performance prediction
  - Automated scheduling optimization
  - Intelligent content recommendations

---

## 2. Database Architecture

### 2.1 PostgreSQL Schema Design

```sql
-- Users table (all user types)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'teacher', 'parent', 'admin')),
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(15) UNIQUE,
    password_hash TEXT NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Institutes table for multi-tenancy
CREATE TABLE institutes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    address TEXT,
    contact_email VARCHAR(100),
    contact_phone VARCHAR(15),
    subscription_plan VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Students table
CREATE TABLE students (
    id UUID PRIMARY KEY REFERENCES users(id),
    student_id VARCHAR(20) UNIQUE NOT NULL,
    institute_id UUID REFERENCES institutes(id),
    batch_id UUID REFERENCES batches(id),
    parent_id UUID REFERENCES users(id),
    enrollment_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    academic_year VARCHAR(10),
    grade_level VARCHAR(10)
);

-- Teachers table
CREATE TABLE teachers (
    id UUID PRIMARY KEY REFERENCES users(id),
    teacher_id VARCHAR(20) UNIQUE NOT NULL,
    institute_id UUID REFERENCES institutes(id),
    subjects TEXT[] NOT NULL,
    specialization VARCHAR(100),
    experience_years INTEGER,
    salary DECIMAL(10,2),
    hire_date DATE,
    status VARCHAR(20) DEFAULT 'active'
);

-- Batches table
CREATE TABLE batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    institute_id UUID REFERENCES institutes(id),
    grade_level VARCHAR(10),
    academic_year VARCHAR(10),
    max_students INTEGER DEFAULT 50,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Classes table
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject VARCHAR(50) NOT NULL,
    teacher_id UUID REFERENCES teachers(id),
    batch_id UUID REFERENCES batches(id),
    institute_id UUID REFERENCES institutes(id),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled')),
    meeting_url TEXT,
    recording_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Assignments table
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    teacher_id UUID REFERENCES teachers(id),
    batch_id UUID REFERENCES batches(id),
    subject VARCHAR(50),
    due_date TIMESTAMP,
    total_marks INTEGER,
    assignment_type VARCHAR(50) DEFAULT 'homework',
    attachment_urls TEXT[],
    created_at TIMESTAMP DEFAULT NOW()
);

-- Assignment submissions table
CREATE TABLE assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES assignments(id),
    student_id UUID REFERENCES students(id),
    submission_text TEXT,
    attachment_urls TEXT[],
    submitted_at TIMESTAMP DEFAULT NOW(),
    marks_obtained INTEGER,
    feedback TEXT,
    graded_at TIMESTAMP,
    graded_by UUID REFERENCES teachers(id)
);

-- Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES users(id),
    receiver_id UUID REFERENCES users(id),
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'image', 'document')),
    content TEXT,
    media_url TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    notification_type VARCHAR(50),
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Attendance table
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id),
    class_id UUID REFERENCES classes(id),
    status VARCHAR(20) DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late')),
    marked_at TIMESTAMP DEFAULT NOW(),
    marked_by UUID REFERENCES teachers(id)
);

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_type VARCHAR(50) DEFAULT 'tuition_fee',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    due_date DATE,
    paid_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Doubts table for AI integration
CREATE TABLE doubts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id),
    subject VARCHAR(50),
    question TEXT NOT NULL,
    question_image_url TEXT,
    ai_response TEXT,
    teacher_response TEXT,
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'ai_answered', 'teacher_answered', 'resolved')),
    difficulty_level VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP
);

-- Performance analytics table
CREATE TABLE student_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id),
    subject VARCHAR(50),
    assessment_type VARCHAR(50),
    score DECIMAL(5,2),
    max_score DECIMAL(5,2),
    percentage DECIMAL(5,2),
    grade VARCHAR(5),
    assessment_date DATE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 2.2 Indexing Strategy

```sql
-- Performance indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_students_institute ON students(institute_id);
CREATE INDEX idx_classes_teacher_batch ON classes(teacher_id, batch_id);
CREATE INDEX idx_messages_sender_receiver ON messages(sender_id, receiver_id);
CREATE INDEX idx_attendance_student_date ON attendance(student_id, created_at);
CREATE INDEX idx_payments_student_status ON payments(student_id, status);

-- Composite indexes for common queries
CREATE INDEX idx_assignments_batch_subject ON assignments(batch_id, subject);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_doubts_student_status ON doubts(student_id, status);
```

---

## 3. API Architecture

### 3.1 RESTful API Design

```javascript
// Authentication Service APIs
POST   /auth/login
POST   /auth/register
POST   /auth/forgot-password
POST   /auth/reset-password
POST   /auth/change-password
GET    /auth/profile
PUT    /auth/profile
POST   /auth/biometric/setup
POST   /auth/refresh-token
POST   /auth/logout

// User Management APIs
GET    /users/profile
PUT    /users/profile
GET    /users/dashboard/{role}
POST   /users/avatar/upload

// Student APIs
GET    /students/dashboard
GET    /students/schedule
GET    /students/assignments
GET    /students/assignments/{id}
POST   /students/assignments/{id}/submit
GET    /students/grades
GET    /students/attendance
POST   /students/doubts/submit
GET    /students/doubts
GET    /students/materials

// Teacher APIs
GET    /teachers/dashboard
GET    /teachers/classes
GET    /teachers/students
POST   /teachers/assignments
PUT    /teachers/assignments/{id}
POST   /teachers/assignments/{id}/grade
GET    /teachers/attendance/batch/{batchId}
POST   /teachers/attendance/mark
POST   /teachers/announcements
GET    /teachers/doubts/pending

// Parent APIs
GET    /parents/dashboard
GET    /parents/children
GET    /parents/child/{studentId}/progress
GET    /parents/child/{studentId}/attendance
GET    /parents/child/{studentId}/assignments
POST   /parents/payments
GET    /parents/payments/history
GET    /parents/reports

// Communication APIs
POST   /messages/send
GET    /messages/conversations
GET    /messages/conversation/{userId}
POST   /messages/voice/upload
GET    /messages/unread/count

// Notification APIs
GET    /notifications
PUT    /notifications/{id}/read
POST   /notifications/preferences
DELETE /notifications/{id}

// Payment APIs
POST   /payments/initiate
GET    /payments/history
POST   /payments/verify
GET    /payments/status/{paymentId}
POST   /payments/refund

// Academic APIs
GET    /classes/schedule
POST   /classes/start
POST   /classes/end
GET    /classes/{id}/attendance
POST   /classes/{id}/attendance/mark
```

### 3.2 GraphQL Schema (Alternative)

```graphql
type User {
  id: ID!
  role: Role!
  email: String!
  phone: String!
  firstName: String!
  lastName: String!
  avatarUrl: String
  isActive: Boolean!
  createdAt: DateTime!
}

type Student {
  id: ID!
  user: User!
  studentId: String!
  batch: Batch!
  parent: Parent
  enrollmentDate: Date!
  status: StudentStatus!
  assignments: [Assignment!]!
  attendance: [Attendance!]!
  grades: [Grade!]!
}

type Teacher {
  id: ID!
  user: User!
  teacherId: String!
  subjects: [String!]!
  specialization: String
  experienceYears: Int
  classes: [Class!]!
}

type Class {
  id: ID!
  subject: String!
  teacher: Teacher!
  batch: Batch!
  startTime: DateTime!
  endTime: DateTime!
  status: ClassStatus!
  meetingUrl: String
  attendance: [Attendance!]!
}

type Assignment {
  id: ID!
  title: String!
  description: String
  teacher: Teacher!
  batch: Batch!
  subject: String!
  dueDate: DateTime
  totalMarks: Int
  submissions: [AssignmentSubmission!]!
}

type Query {
  me: User
  studentDashboard: StudentDashboard
  teacherDashboard: TeacherDashboard
  parentDashboard: ParentDashboard
  classes(batchId: ID!): [Class!]!
  assignments(studentId: ID!): [Assignment!]!
  messages(userId: ID!): [Message!]!
}

type Mutation {
  login(email: String!, password: String!): AuthPayload!
  submitAssignment(assignmentId: ID!, content: String!, attachments: [String!]): AssignmentSubmission!
  markAttendance(classId: ID!, studentId: ID!, status: AttendanceStatus!): Attendance!
  sendMessage(receiverId: ID!, content: String!, type: MessageType!): Message!
  initiatePayment(amount: Float!, type: PaymentType!): Payment!
}

type Subscription {
  messageReceived(userId: ID!): Message!
  classStarted(batchId: ID!): Class!
  assignmentGraded(studentId: ID!): AssignmentSubmission!
  notificationReceived(userId: ID!): Notification!
}
```

---

## 4. Real-time Communication Architecture

### 4.1 WebSocket Implementation

```javascript
// Socket.io Event Structure
const socketEvents = {
  // Connection events
  'user:connect': { userId, role },
  'user:disconnect': { userId },
  
  // Student events
  'student:assignment:new': { assignmentId, title, dueDate },
  'student:grade:updated': { assignmentId, marks, feedback },
  'student:class:started': { classId, meetingUrl },
  'student:message:received': { senderId, content, timestamp },
  'student:doubt:answered': { doubtId, response, answeredBy },
  
  // Teacher events
  'teacher:doubt:submitted': { doubtId, studentId, subject, question },
  'teacher:class:joined': { classId, studentId },
  'teacher:assignment:submitted': { assignmentId, studentId, submissionId },
  
  // Parent events
  'parent:child:absent': { studentId, classId, date },
  'parent:grade:updated': { studentId, subject, grade },
  'parent:payment:due': { studentId, amount, dueDate },
  
  // Admin events
  'admin:new:enrollment': { studentId, instituteId },
  'admin:payment:received': { paymentId, studentId, amount },
  'admin:system:alert': { type, message, severity }
};

// Socket.io Server Implementation
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS,
    methods: ["GET", "POST"]
  }
});

// Authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const user = await authenticateSocket(token);
    socket.userId = user.id;
    socket.role = user.role;
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
});

// Connection handling
io.on('connection', (socket) => {
  console.log(`User ${socket.userId} connected with role ${socket.role}`);
  
  // Join role-based rooms
  socket.join(`role:${socket.role}`);
  socket.join(`user:${socket.userId}`);
  
  // Handle role-specific events
  setupRoleEvents(socket);
  
  socket.on('disconnect', () => {
    console.log(`User ${socket.userId} disconnected`);
  });
});

const setupRoleEvents = (socket) => {
  switch (socket.role) {
    case 'student':
      setupStudentEvents(socket);
      break;
    case 'teacher':
      setupTeacherEvents(socket);
      break;
    case 'parent':
      setupParentEvents(socket);
      break;
    case 'admin':
      setupAdminEvents(socket);
      break;
  }
};
```

### 4.2 Real-time Data Synchronization

```javascript
// Redis pub/sub for scaling real-time features
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);
const subscriber = client.duplicate();

// Publish system-wide events
const publishEvent = async (channel, data) => {
  await client.publish(channel, JSON.stringify(data));
};

// Subscribe to system events
subscriber.subscribe('student_events', 'teacher_events', 'parent_events', 'admin_events');

subscriber.on('message', (channel, message) => {
  const data = JSON.parse(message);
  handleSystemEvent(channel, data);
});

const handleSystemEvent = (channel, data) => {
  switch (channel) {
    case 'student_events':
      io.to(`role:student`).emit(data.event, data.payload);
      break;
    case 'teacher_events':
      io.to(`role:teacher`).emit(data.event, data.payload);
      break;
    case 'parent_events':
      io.to(`role:parent`).emit(data.event, data.payload);
      break;
  }
};
```

---

## 5. AI Integration Architecture

### 5.1 OpenAI GPT-4 Integration

```javascript
// AI Service Implementation
const { Configuration, OpenAIApi } = require('openai');

class AIService {
  constructor() {
    this.openai = new OpenAIApi(new Configuration({
      apiKey: process.env.OPENAI_API_KEY
    }));
  }
  
  async resolveDoubt(question, subject, grade, context = '') {
    try {
      const prompt = this.buildDoubtPrompt(question, subject, grade, context);
      
      const response = await this.openai.createCompletion({
        model: "gpt-4",
        prompt,
        max_tokens: 500,
        temperature: 0.3,
        top_p: 1.0,
        frequency_penalty: 0.0,
        presence_penalty: 0.0
      });
      
      return {
        response: response.data.choices[0].text.trim(),
        confidence: this.calculateConfidence(response.data.choices[0]),
        requiresTeacher: this.shouldRouteToTeacher(question, subject)
      };
    } catch (error) {
      throw new Error('AI doubt resolution failed: ' + error.message);
    }
  }
  
  buildDoubtPrompt(question, subject, grade, context) {
    return `
You are an AI tutor helping a grade ${grade} student with ${subject}.

Context: ${context}

Student's Question: ${question}

Please provide:
1. A clear, step-by-step explanation
2. An example if applicable
3. Key concepts to remember
4. Practice tips

Keep your response appropriate for grade ${grade} level and under 400 words.
    `;
  }
  
  async analyzePerformance(studentData) {
    const prompt = `
Analyze this student's performance data and provide insights:

${JSON.stringify(studentData, null, 2)}

Provide:
1. Strengths and weaknesses
2. Improvement recommendations
3. Learning pattern analysis
4. Risk factors (if any)

Format as JSON with clear sections.
    `;
    
    const response = await this.openai.createCompletion({
      model: "gpt-4",
      prompt,
      max_tokens: 400,
      temperature: 0.2
    });
    
    return JSON.parse(response.data.choices[0].text);
  }
  
  async optimizeSchedule(scheduleData, constraints) {
    const prompt = `
Optimize this class schedule considering the constraints:

Schedule Data: ${JSON.stringify(scheduleData)}
Constraints: ${JSON.stringify(constraints)}

Provide an optimized schedule that:
1. Minimizes conflicts
2. Balances teacher workload
3. Optimizes student learning patterns
4. Considers resource availability

Return as JSON with reasoning.
    `;
    
    const response = await this.openai.createCompletion({
      model: "gpt-4",
      prompt,
      max_tokens: 600,
      temperature: 0.1
    });
    
    return JSON.parse(response.data.choices[0].text);
  }
}

module.exports = new AIService();
```

### 5.2 Machine Learning Pipeline

```javascript
// ML Pipeline for Student Performance Prediction
class MLPipeline {
  constructor() {
    this.model = null;
    this.features = [
      'attendance_percentage',
      'assignment_completion_rate',
      'average_grade',
      'class_participation',
      'doubt_frequency',
      'login_frequency',
      'study_time_daily'
    ];
  }
  
  async prepareTrainingData(students) {
    const trainingData = [];
    
    for (const student of students) {
      const features = await this.extractFeatures(student);
      const outcome = await this.getOutcome(student);
      
      trainingData.push({
        features,
        outcome
      });
    }
    
    return trainingData;
  }
  
  async extractFeatures(student) {
    const attendance = await this.calculateAttendance(student.id);
    const assignments = await this.getAssignmentStats(student.id);
    const grades = await this.getGradeAverage(student.id);
    const engagement = await this.getEngagementMetrics(student.id);
    
    return {
      attendance_percentage: attendance,
      assignment_completion_rate: assignments.completionRate,
      average_grade: grades,
      class_participation: engagement.participation,
      doubt_frequency: engagement.doubtFrequency,
      login_frequency: engagement.loginFrequency,
      study_time_daily: engagement.studyTime
    };
  }
  
  async predictPerformance(studentId) {
    const features = await this.extractFeatures({ id: studentId });
    
    // Use AI for prediction if ML model not available
    return await AIService.analyzePerformance(features);
  }
  
  async identifyRiskyStudents() {
    const students = await this.getAllActiveStudents();
    const riskyStudents = [];
    
    for (const student of students) {
      const prediction = await this.predictPerformance(student.id);
      
      if (prediction.riskLevel === 'high') {
        riskyStudents.push({
          student,
          riskFactors: prediction.riskFactors,
          recommendations: prediction.recommendations
        });
      }
    }
    
    return riskyStudents;
  }
}
```

---

## 6. Security Architecture

### 6.1 Authentication & Authorization

```javascript
// JWT Implementation with Role-Based Access Control
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

class AuthService {
  generateTokens(user) {
    const accessToken = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        instituteId: user.instituteId
      },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );
    
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
    
    return { accessToken, refreshToken };
  }
  
  async validateToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }
      
      return { user, decoded };
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
  
  hasPermission(userRole, resource, action) {
    const permissions = {
      student: {
        assignments: ['read', 'submit'],
        classes: ['read', 'join'],
        grades: ['read'],
        profile: ['read', 'update']
      },
      teacher: {
        assignments: ['read', 'create', 'update', 'grade'],
        classes: ['read', 'create', 'update', 'manage'],
        students: ['read', 'update'],
        grades: ['read', 'create', 'update']
      },
      parent: {
        children: ['read'],
        payments: ['read', 'create'],
        reports: ['read'],
        communication: ['read', 'create']
      },
      admin: {
        '*': ['*'] // Full access
      }
    };
    
    const userPermissions = permissions[userRole];
    if (!userPermissions) return false;
    
    if (userPermissions['*'] && userPermissions['*'].includes('*')) {
      return true; // Admin access
    }
    
    const resourcePermissions = userPermissions[resource];
    return resourcePermissions && resourcePermissions.includes(action);
  }
}

// Middleware for route protection
const authorize = (resource, action) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: 'Access token required' });
      }
      
      const { user, decoded } = await authService.validateToken(token);
      
      if (!authService.hasPermission(user.role, resource, action)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      
      req.user = user;
      req.token = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ error: error.message });
    }
  };
};
```

### 6.2 Data Encryption & Privacy

```javascript
// Data encryption utilities
const crypto = require('crypto');

class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.secretKey = process.env.ENCRYPTION_SECRET;
  }
  
  encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.secretKey);
    cipher.setIV(iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }
  
  decrypt(encryptedData) {
    const decipher = crypto.createDecipher(this.algorithm, this.secretKey);
    decipher.setIV(Buffer.from(encryptedData.iv, 'hex'));
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  // Hash sensitive data
  hashData(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
  
  // Generate secure random passwords
  generateSecurePassword(length = 12) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      password += charset[randomIndex];
    }
    
    return password;
  }
}

// Database field encryption
const encryptSensitiveFields = (data) => {
  const sensitiveFields = ['phone', 'email', 'address'];
  const encryptedData = { ...data };
  
  sensitiveFields.forEach(field => {
    if (data[field]) {
      encryptedData[field] = encryptionService.encrypt(data[field]);
    }
  });
  
  return encryptedData;
};
```

---

## 7. Performance Optimization

### 7.1 Caching Strategy

```javascript
// Redis caching implementation
const Redis = require('ioredis');

class CacheService {
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD,
      db: 0,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3
    });
  }
  
  // Cache frequently accessed data
  async cacheUserSession(userId, sessionData, ttl = 3600) {
    const key = `session:${userId}`;
    await this.redis.setex(key, ttl, JSON.stringify(sessionData));
  }
  
  async getUserSession(userId) {
    const key = `session:${userId}`;
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }
  
  // Cache dashboard data
  async cacheDashboard(userId, role, data, ttl = 300) {
    const key = `dashboard:${role}:${userId}`;
    await this.redis.setex(key, ttl, JSON.stringify(data));
  }
  
  async getDashboardCache(userId, role) {
    const key = `dashboard:${role}:${userId}`;
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }
  
  // Cache API responses
  async cacheAPIResponse(endpoint, params, data, ttl = 600) {
    const key = `api:${endpoint}:${this.hashParams(params)}`;
    await this.redis.setex(key, ttl, JSON.stringify(data));
  }
  
  async getAPICache(endpoint, params) {
    const key = `api:${endpoint}:${this.hashParams(params)}`;
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }
  
  hashParams(params) {
    return crypto.createHash('md5').update(JSON.stringify(params)).digest('hex');
  }
  
  // Invalidate related caches
  async invalidateUserCaches(userId) {
    const pattern = `*:${userId}`;
    const keys = await this.redis.keys(pattern);
    
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

// Middleware for API caching
const apiCache = (ttl = 600) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }
    
    const cached = await cacheService.getAPICache(req.path, req.query);
    if (cached) {
      return res.json(cached);
    }
    
    // Override res.json to cache response
    const originalJson = res.json;
    res.json = function(data) {
      cacheService.cacheAPIResponse(req.path, req.query, data, ttl);
      return originalJson.call(this, data);
    };
    
    next();
  };
};
```

### 7.2 Database Optimization

```javascript
// Database connection pool and optimization
const { Pool } = require('pg');

class DatabaseService {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      max: 20, // Maximum number of connections
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  
  // Optimized queries with pagination
  async getStudentsByBatch(batchId, page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    
    const query = `
      SELECT s.*, u.first_name, u.last_name, u.email
      FROM students s
      JOIN users u ON s.id = u.id
      WHERE s.batch_id = $1 AND u.is_active = true
      ORDER BY u.first_name, u.last_name
      LIMIT $2 OFFSET $3
    `;
    
    const result = await this.pool.query(query, [batchId, limit, offset]);
    return result.rows;
  }
  
  // Batch operations for better performance
  async bulkInsertAttendance(attendanceData) {
    const values = attendanceData.map((record, index) => 
      `($${index * 4 + 1}, $${index * 4 + 2}, $${index * 4 + 3}, $${index * 4 + 4})`
    ).join(', ');
    
    const query = `
      INSERT INTO attendance (student_id, class_id, status, marked_by)
      VALUES ${values}
      ON CONFLICT (student_id, class_id) 
      DO UPDATE SET status = EXCLUDED.status, marked_at = NOW()
    `;
    
    const params = attendanceData.flatMap(record => [
      record.studentId,
      record.classId,
      record.status,
      record.markedBy
    ]);
    
    await this.pool.query(query, params);
  }
  
  // Query optimization with materialized views
  async createPerformanceView() {
    const query = `
      CREATE MATERIALIZED VIEW student_performance_summary AS
      SELECT 
        s.id as student_id,
        s.student_id,
        u.first_name,
        u.last_name,
        COUNT(DISTINCT c.id) as total_classes,
        COUNT(DISTINCT a.id) as attended_classes,
        ROUND(COUNT(DISTINCT a.id)::numeric / COUNT(DISTINCT c.id) * 100, 2) as attendance_percentage,
        AVG(asub.marks_obtained) as average_marks,
        COUNT(DISTINCT ass.id) as total_assignments,
        COUNT(DISTINCT asub.id) as submitted_assignments
      FROM students s
      JOIN users u ON s.id = u.id
      LEFT JOIN classes c ON c.batch_id = s.batch_id
      LEFT JOIN attendance a ON a.student_id = s.id AND a.class_id = c.id
      LEFT JOIN assignments ass ON ass.batch_id = s.batch_id
      LEFT JOIN assignment_submissions asub ON asub.assignment_id = ass.id AND asub.student_id = s.id
      WHERE u.is_active = true
      GROUP BY s.id, s.student_id, u.first_name, u.last_name;
      
      CREATE UNIQUE INDEX ON student_performance_summary (student_id);
    `;
    
    await this.pool.query(query);
  }
  
  // Refresh materialized view periodically
  async refreshPerformanceView() {
    await this.pool.query('REFRESH MATERIALIZED VIEW student_performance_summary');
  }
}
```

---

## 8. Monitoring & Analytics

### 8.1 System Monitoring

```javascript
// Application monitoring setup
const prometheus = require('prom-client');

// Custom metrics
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status']
});

const activeConnections = new prometheus.Gauge({
  name: 'websocket_active_connections',
  help: 'Number of active WebSocket connections',
  labelNames: ['role']
});

const databaseQueryDuration = new prometheus.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['query_type']
});

// Middleware for request monitoring
const monitorRequests = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration);
  });
  
  next();
};

// Health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {}
  };
  
  try {
    // Check database connection
    await db.pool.query('SELECT 1');
    health.services.database = 'healthy';
  } catch (error) {
    health.services.database = 'unhealthy';
    health.status = 'degraded';
  }
  
  try {
    // Check Redis connection
    await cacheService.redis.ping();
    health.services.redis = 'healthy';
  } catch (error) {
    health.services.redis = 'unhealthy';
    health.status = 'degraded';
  }
  
  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(prometheus.register.metrics());
});
```

### 8.2 Business Analytics

```javascript
// Analytics service for business insights
class AnalyticsService {
  async trackUserActivity(userId, action, metadata = {}) {
    const event = {
      user_id: userId,
      action,
      metadata,
      timestamp: new Date(),
      session_id: metadata.sessionId
    };
    
    await this.storeEvent(event);
    await this.updateUserMetrics(userId, action);
  }
  
  async getEngagementMetrics(instituteId, timeframe = '30d') {
    const query = `
      SELECT 
        DATE_TRUNC('day', created_at) as date,
        COUNT(DISTINCT user_id) as daily_active_users,
        COUNT(*) as total_events,
        AVG(session_duration) as avg_session_duration
      FROM user_activities 
      WHERE institute_id = $1 
        AND created_at >= NOW() - INTERVAL '${timeframe}'
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY date
    `;
    
    const result = await db.pool.query(query, [instituteId]);
    return result.rows;
  }
  
  async getPerformanceInsights(instituteId) {
    const insights = await Promise.all([
      this.getAttendanceTrends(instituteId),
      this.getGradingAnalytics(instituteId),
      this.getEngagementPatterns(instituteId),
      this.getPaymentMetrics(instituteId)
    ]);
    
    return {
      attendance: insights[0],
      grading: insights[1],
      engagement: insights[2],
      payments: insights[3],
      generatedAt: new Date()
    };
  }
  
  async generateCustomReport(instituteId, reportConfig) {
    const { metrics, filters, timeframe, format } = reportConfig;
    
    const data = await this.executeCustomQuery(metrics, filters, timeframe);
    
    switch (format) {
      case 'pdf':
        return await this.generatePDFReport(data, reportConfig);
      case 'excel':
        return await this.generateExcelReport(data, reportConfig);
      default:
        return data;
    }
  }
}
```

This comprehensive system architecture provides a robust foundation for the Coaching Management Mobile App with scalable microservices, efficient data management, real-time capabilities, AI integration, and comprehensive monitoring.