# Database Design & Data Architecture Specifications
## Coaching Management Mobile App - Complete Database Schema & Optimization Guide

### Executive Summary
This document provides comprehensive database design specifications, including detailed schemas, relationships, indexing strategies, data migration plans, and performance optimization techniques for the Coaching Management Mobile App. The design supports multi-tenancy, scalability, and complex educational workflows.

---

## 1. Database Architecture Overview

### 1.1 High-Level Database Design

```
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   User Service  │  │ Academic Service│  │Payment Service  │ │
│  │   (Auth/Users)  │  │(Classes/Grades) │  │  (Payments)     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │             PostgreSQL 15+ Master Database                 │ │
│  │                                                             │ │
│  │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐     │ │
│  │  │   Core Data   │ │ Academic Data │ │Operational Data│     │ │
│  │  │ • Users       │ │ • Classes     │ │ • Payments    │     │ │
│  │  │ • Institutes  │ │ • Assignments │ │ • Messages    │     │ │
│  │  │ • Batches     │ │ • Grades      │ │ • Notifications│    │ │
│  │  │ • Roles       │ │ • Attendance  │ │ • Files       │     │ │
│  │  └───────────────┘ └───────────────┘ └───────────────┘     │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              Read Replicas (2x)                             │ │
│  │  • Analytics queries                                        │ │
│  │  • Reporting data                                           │ │
│  │  • Dashboard queries                                        │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Database Technology Stack

**PostgreSQL Configuration**
```sql
-- postgresql.conf optimizations
# Connection settings
max_connections = 200
shared_buffers = 8GB                    # 25% of total RAM (32GB)
effective_cache_size = 24GB             # 75% of total RAM
work_mem = 64MB                         # Per connection working memory
maintenance_work_mem = 1GB              # Maintenance operations memory

# Write-ahead logging
wal_buffers = 64MB
checkpoint_completion_target = 0.9
checkpoint_timeout = 15min
max_wal_size = 4GB
min_wal_size = 1GB

# Query planning
default_statistics_target = 500
random_page_cost = 1.1                  # SSD optimization
effective_io_concurrency = 200          # SSD concurrent I/O

# Logging and monitoring
log_min_duration_statement = 1000       # Log slow queries (>1s)
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on
log_temp_files = 10MB

# Replication settings
wal_level = replica
max_wal_senders = 3
max_replication_slots = 3
hot_standby = on
hot_standby_feedback = on
```

---

## 2. Core Database Schema

### 2.1 User Management Schema

**Users & Authentication Tables**
```sql
-- Main users table (all user types)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15) UNIQUE,
    password_hash TEXT NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    middle_name VARCHAR(50),
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    avatar_url TEXT,
    address JSONB,
    emergency_contact JSONB,
    preferences JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP,
    login_count INTEGER DEFAULT 0,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP,
    
    -- Audit fields
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    
    -- Search optimization
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', 
            coalesce(first_name, '') || ' ' || 
            coalesce(last_name, '') || ' ' || 
            coalesce(email, '') || ' ' ||
            coalesce(phone, '')
        )
    ) STORED
);

-- User roles and permissions
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'teacher', 'parent', 'admin', 'super_admin')),
    permissions JSONB DEFAULT '{}',
    is_primary BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    assigned_at TIMESTAMP DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id),
    expires_at TIMESTAMP,
    
    UNIQUE(user_id, institute_id, role)
);

-- Authentication tokens
CREATE TABLE user_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_type VARCHAR(20) NOT NULL CHECK (token_type IN ('access', 'refresh', 'reset', 'verify')),
    token_hash TEXT NOT NULL,
    device_id VARCHAR(100),
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    is_revoked BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    last_used_at TIMESTAMP,
    
    INDEX idx_user_tokens_user_type (user_id, token_type),
    INDEX idx_user_tokens_expires (expires_at),
    UNIQUE(token_hash)
);

-- User sessions tracking
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    device_id VARCHAR(100),
    device_type VARCHAR(50),
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    location JSONB,
    started_at TIMESTAMP DEFAULT NOW(),
    last_activity_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    
    INDEX idx_user_sessions_user_active (user_id, is_active),
    INDEX idx_user_sessions_last_activity (last_activity_at)
);

-- Password history (prevent reuse)
CREATE TABLE user_password_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_password_history_user (user_id, created_at)
);
```

### 2.2 Institute & Organization Schema

**Multi-tenant Institute Management**
```sql
-- Institutes (organizations/coaching centers)
CREATE TABLE institutes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    display_name VARCHAR(150),
    description TEXT,
    logo_url TEXT,
    
    -- Contact information
    email VARCHAR(100),
    phone VARCHAR(15),
    website VARCHAR(255),
    
    -- Address
    address JSONB NOT NULL,
    
    -- Business information
    registration_number VARCHAR(50),
    tax_id VARCHAR(50),
    license_number VARCHAR(50),
    
    -- Subscription and billing
    subscription_plan VARCHAR(50) DEFAULT 'basic',
    subscription_status VARCHAR(20) DEFAULT 'active',
    subscription_expires_at TIMESTAMP,
    billing_info JSONB,
    
    -- Settings and configuration
    settings JSONB DEFAULT '{}',
    features JSONB DEFAULT '{}',
    branding JSONB DEFAULT '{}',
    
    -- Status and lifecycle
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'active',
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    -- Search optimization
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', 
            coalesce(name, '') || ' ' || 
            coalesce(code, '') || ' ' || 
            coalesce(description, '')
        )
    ) STORED
);

-- Institute branches/campuses
CREATE TABLE institute_branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    address JSONB NOT NULL,
    contact_info JSONB,
    is_main_branch BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(institute_id, code)
);

-- Institute settings and configurations
CREATE TABLE institute_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    key VARCHAR(100) NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID REFERENCES users(id),
    
    UNIQUE(institute_id, category, key)
);
```

### 2.3 Academic Structure Schema

**Batches, Classes, and Subjects**
```sql
-- Academic years
CREATE TABLE academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    code VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(institute_id, code),
    CHECK (end_date > start_date)
);

-- Subjects/courses
CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    description TEXT,
    grade_levels INTEGER[] NOT NULL,
    category VARCHAR(50),
    color_code VARCHAR(7),
    icon VARCHAR(50),
    is_mandatory BOOLEAN DEFAULT true,
    credits INTEGER DEFAULT 1,
    sequence_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(institute_id, code)
);

-- Batches/classes
CREATE TABLE batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES institute_branches(id),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    description TEXT,
    
    -- Academic information
    grade_level VARCHAR(10) NOT NULL,
    section VARCHAR(10),
    medium VARCHAR(20) DEFAULT 'english',
    board VARCHAR(50),
    
    -- Capacity and enrollment
    max_students INTEGER DEFAULT 50,
    current_enrollment INTEGER DEFAULT 0,
    
    -- Schedule information
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    class_duration INTEGER DEFAULT 60, -- minutes
    
    -- Status and settings
    is_active BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'active',
    settings JSONB DEFAULT '{}',
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    UNIQUE(institute_id, academic_year_id, code),
    CHECK (end_date > start_date),
    CHECK (current_enrollment <= max_students)
);

-- Batch-subject mapping
CREATE TABLE batch_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES users(id), -- Primary teacher
    
    -- Schedule configuration
    weekly_hours INTEGER DEFAULT 4,
    schedule_config JSONB, -- Day/time configuration
    
    -- Assessment configuration
    assessment_config JSONB DEFAULT '{}',
    grading_scheme JSONB DEFAULT '{}',
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(batch_id, subject_id)
);
```

### 2.4 Student Management Schema

**Student Profiles and Academic Records**
```sql
-- Students
CREATE TABLE students (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    institute_id UUID NOT NULL REFERENCES institutes(id),
    batch_id UUID NOT NULL REFERENCES batches(id),
    branch_id UUID REFERENCES institute_branches(id),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    
    -- Parent/guardian information
    parent_id UUID REFERENCES users(id),
    guardian_name VARCHAR(100),
    guardian_phone VARCHAR(15),
    guardian_relationship VARCHAR(50),
    
    -- Academic information
    enrollment_date DATE NOT NULL,
    enrollment_number VARCHAR(50),
    previous_school TEXT,
    grade_when_joined VARCHAR(10),
    
    -- Personal details
    roll_number VARCHAR(20),
    admission_category VARCHAR(50),
    blood_group VARCHAR(5),
    medical_conditions TEXT,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'graduated', 'transferred')),
    attendance_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Academic performance metrics (updated by triggers)
    overall_grade VARCHAR(5),
    overall_percentage DECIMAL(5,2),
    rank_in_batch INTEGER,
    
    -- Fee information
    fee_structure_id UUID,
    fee_discount_percentage DECIMAL(5,2) DEFAULT 0,
    fee_status VARCHAR(20) DEFAULT 'pending',
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(institute_id, student_id),
    UNIQUE(batch_id, roll_number)
);

-- Student academic history
CREATE TABLE student_academic_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    batch_id UUID NOT NULL REFERENCES batches(id),
    
    -- Performance metrics
    total_classes INTEGER DEFAULT 0,
    classes_attended INTEGER DEFAULT 0,
    attendance_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Grade information
    final_grade VARCHAR(5),
    final_percentage DECIMAL(5,2),
    rank_in_batch INTEGER,
    
    -- Status
    promotion_status VARCHAR(20),
    remarks TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(student_id, academic_year_id)
);

-- Student guardians/parents relationship
CREATE TABLE student_guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    guardian_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    relationship VARCHAR(50) NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    can_pickup BOOLEAN DEFAULT false,
    emergency_contact BOOLEAN DEFAULT false,
    receive_notifications BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(student_id, guardian_id)
);
```

### 2.5 Teacher Management Schema

**Teacher Profiles and Assignments**
```sql
-- Teachers
CREATE TABLE teachers (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    teacher_id VARCHAR(20) UNIQUE NOT NULL,
    institute_id UUID NOT NULL REFERENCES institutes(id),
    branch_id UUID REFERENCES institute_branches(id),
    
    -- Professional information
    employee_id VARCHAR(50),
    designation VARCHAR(100),
    department VARCHAR(100),
    specialization TEXT[],
    subjects TEXT[] NOT NULL,
    grade_levels INTEGER[] NOT NULL,
    
    -- Qualification and experience
    qualifications JSONB,
    experience_years INTEGER,
    certifications JSONB,
    
    -- Employment details
    employment_type VARCHAR(20) DEFAULT 'full_time',
    hire_date DATE,
    contract_end_date DATE,
    salary DECIMAL(10,2),
    salary_currency VARCHAR(3) DEFAULT 'INR',
    
    -- Performance metrics
    average_rating DECIMAL(3,2),
    total_ratings INTEGER DEFAULT 0,
    classes_conducted INTEGER DEFAULT 0,
    
    -- Availability and schedule
    working_hours JSONB,
    availability JSONB,
    max_classes_per_day INTEGER DEFAULT 8,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'terminated')),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(institute_id, teacher_id),
    UNIQUE(institute_id, employee_id)
);

-- Teacher qualifications
CREATE TABLE teacher_qualifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    degree VARCHAR(100) NOT NULL,
    field_of_study VARCHAR(100),
    institution VARCHAR(200),
    year_of_completion INTEGER,
    grade_percentage DECIMAL(5,2),
    document_url TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Teacher-batch assignments
CREATE TABLE teacher_batch_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    
    role VARCHAR(20) DEFAULT 'teacher' CHECK (role IN ('teacher', 'assistant', 'coordinator')),
    is_primary BOOLEAN DEFAULT false,
    
    assigned_at TIMESTAMP DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id),
    
    UNIQUE(teacher_id, batch_id, subject_id)
);
```

---

## 3. Academic Operations Schema

### 3.1 Classes and Scheduling

**Class Management and Scheduling**
```sql
-- Class schedule templates
CREATE TABLE class_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id),
    
    -- Schedule information
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration INTEGER GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (end_time - start_time)) / 60
    ) STORED,
    
    -- Class details
    class_type VARCHAR(20) DEFAULT 'regular' CHECK (class_type IN ('regular', 'extra', 'makeup', 'exam', 'review')),
    room_number VARCHAR(20),
    online_meeting_link TEXT,
    
    -- Recurrence
    is_recurring BOOLEAN DEFAULT true,
    effective_from DATE NOT NULL,
    effective_until DATE,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(batch_id, day_of_week, start_time, effective_from),
    CHECK (end_time > start_time)
);

-- Individual class instances
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID REFERENCES class_schedules(id),
    batch_id UUID NOT NULL REFERENCES batches(id),
    subject_id UUID NOT NULL REFERENCES subjects(id),
    teacher_id UUID NOT NULL REFERENCES teachers(id),
    
    -- Class details
    title VARCHAR(200),
    description TEXT,
    class_type VARCHAR(20) DEFAULT 'regular',
    
    -- Timing
    scheduled_start_time TIMESTAMP NOT NULL,
    scheduled_end_time TIMESTAMP NOT NULL,
    actual_start_time TIMESTAMP,
    actual_end_time TIMESTAMP,
    duration_minutes INTEGER DEFAULT 60,
    
    -- Location and resources
    room_number VARCHAR(20),
    online_meeting_link TEXT,
    meeting_id VARCHAR(100),
    recording_url TEXT,
    
    -- Content and resources
    syllabus_topics TEXT[],
    resources JSONB,
    homework_assigned TEXT,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (
        status IN ('scheduled', 'live', 'completed', 'cancelled', 'postponed')
    ),
    cancellation_reason TEXT,
    
    -- Metrics
    students_enrolled INTEGER DEFAULT 0,
    students_attended INTEGER DEFAULT 0,
    attendance_percentage DECIMAL(5,2),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CHECK (scheduled_end_time > scheduled_start_time),
    INDEX idx_classes_batch_date (batch_id, scheduled_start_time),
    INDEX idx_classes_teacher_date (teacher_id, scheduled_start_time),
    INDEX idx_classes_status_date (status, scheduled_start_time)
);

-- Class attendance
CREATE TABLE class_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    
    status VARCHAR(20) DEFAULT 'present' CHECK (
        status IN ('present', 'absent', 'late', 'excused', 'partial')
    ),
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    duration_minutes INTEGER,
    
    -- Additional information
    notes TEXT,
    marked_by UUID REFERENCES users(id),
    marked_at TIMESTAMP DEFAULT NOW(),
    
    -- Late arrival tracking
    late_by_minutes INTEGER,
    early_leave_minutes INTEGER,
    
    UNIQUE(class_id, student_id),
    INDEX idx_attendance_student_date (student_id, marked_at),
    INDEX idx_attendance_class (class_id)
);
```

### 3.2 Assignments and Assessments

**Assignment Management System**
```sql
-- Assignment types and categories
CREATE TABLE assignment_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    weight_percentage DECIMAL(5,2) DEFAULT 100.00,
    color_code VARCHAR(7),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(institute_id, name)
);

-- Assignments
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES teachers(id),
    batch_id UUID NOT NULL REFERENCES batches(id),
    subject_id UUID NOT NULL REFERENCES subjects(id),
    category_id UUID REFERENCES assignment_categories(id),
    
    -- Basic information
    title VARCHAR(200) NOT NULL,
    description TEXT,
    instructions TEXT,
    
    -- Assignment configuration
    assignment_type VARCHAR(50) DEFAULT 'homework',
    difficulty_level VARCHAR(20) DEFAULT 'medium',
    estimated_duration INTEGER, -- in minutes
    
    -- Scoring and grading
    total_marks INTEGER NOT NULL DEFAULT 100,
    passing_marks INTEGER,
    grading_scheme VARCHAR(20) DEFAULT 'percentage',
    rubric JSONB,
    
    -- Due dates and timing
    assigned_date DATE DEFAULT CURRENT_DATE,
    due_date TIMESTAMP,
    late_submission_allowed BOOLEAN DEFAULT true,
    late_penalty_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Submission settings
    submission_type VARCHAR(20) DEFAULT 'online' CHECK (
        submission_type IN ('online', 'offline', 'both')
    ),
    allow_resubmission BOOLEAN DEFAULT false,
    max_submissions INTEGER DEFAULT 1,
    file_upload_allowed BOOLEAN DEFAULT true,
    max_file_size_mb INTEGER DEFAULT 10,
    allowed_file_types TEXT[] DEFAULT ARRAY['pdf', 'doc', 'docx', 'jpg', 'png'],
    
    -- Visibility and access
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMP,
    auto_publish_at TIMESTAMP,
    
    -- Resources and attachments
    attachments JSONB,
    reference_materials JSONB,
    external_links TEXT[],
    
    -- Status and tracking
    is_active BOOLEAN DEFAULT true,
    submissions_count INTEGER DEFAULT 0,
    avg_score DECIMAL(5,2),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_assignments_batch_due (batch_id, due_date),
    INDEX idx_assignments_teacher (teacher_id, created_at),
    INDEX idx_assignments_subject_date (subject_id, due_date)
);

-- Assignment submissions
CREATE TABLE assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    
    -- Submission details
    submission_text TEXT,
    attachments JSONB,
    submission_notes TEXT,
    
    -- Submission tracking
    submitted_at TIMESTAMP DEFAULT NOW(),
    is_late BOOLEAN DEFAULT false,
    late_by_hours INTEGER,
    attempt_number INTEGER DEFAULT 1,
    
    -- Grading information
    marks_obtained DECIMAL(5,2),
    percentage DECIMAL(5,2),
    grade VARCHAR(5),
    feedback TEXT,
    grading_rubric_scores JSONB,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'submitted' CHECK (
        status IN ('drafted', 'submitted', 'graded', 'returned', 'resubmitted')
    ),
    
    -- Grading workflow
    auto_graded BOOLEAN DEFAULT false,
    graded_by UUID REFERENCES teachers(id),
    graded_at TIMESTAMP,
    returned_at TIMESTAMP,
    
    -- Revision and feedback
    revision_requested BOOLEAN DEFAULT false,
    revision_notes TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(assignment_id, student_id, attempt_number),
    INDEX idx_submissions_student (student_id, submitted_at),
    INDEX idx_submissions_assignment_status (assignment_id, status),
    INDEX idx_submissions_grading (graded_by, graded_at)
);

-- Assignment rubrics (detailed grading criteria)
CREATE TABLE assignment_rubrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    criterion_name VARCHAR(100) NOT NULL,
    criterion_description TEXT,
    max_points INTEGER NOT NULL,
    weight_percentage DECIMAL(5,2) DEFAULT 100.00,
    performance_levels JSONB NOT NULL, -- Different performance level descriptions
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(assignment_id, criterion_name)
);
```

### 3.3 Grading and Performance Tracking

**Comprehensive Grading System**
```sql
-- Grade categories and weightings
CREATE TABLE grade_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id),
    batch_id UUID REFERENCES batches(id),
    
    name VARCHAR(100) NOT NULL,
    description TEXT,
    weight_percentage DECIMAL(5,2) NOT NULL,
    min_scores_required INTEGER DEFAULT 1,
    drop_lowest_scores INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(institute_id, subject_id, batch_id, name)
);

-- Student grades
CREATE TABLE student_grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id),
    batch_id UUID NOT NULL REFERENCES batches(id),
    category_id UUID REFERENCES grade_categories(id),
    
    -- Assessment reference
    assignment_id UUID REFERENCES assignments(id),
    class_id UUID REFERENCES classes(id), -- for participation grades
    
    -- Grade information
    grade_name VARCHAR(100),
    grade_type VARCHAR(50) DEFAULT 'assignment',
    raw_score DECIMAL(8,2) NOT NULL,
    max_score DECIMAL(8,2) NOT NULL,
    percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN max_score > 0 THEN (raw_score / max_score) * 100 ELSE 0 END
    ) STORED,
    letter_grade VARCHAR(5),
    grade_points DECIMAL(3,2),
    
    -- Weight and calculation
    weight DECIMAL(5,2) DEFAULT 100.00,
    weighted_score DECIMAL(8,2) GENERATED ALWAYS AS (
        (raw_score / max_score) * weight
    ) STORED,
    
    -- Metadata
    assessment_date DATE DEFAULT CURRENT_DATE,
    graded_by UUID REFERENCES teachers(id),
    graded_at TIMESTAMP DEFAULT NOW(),
    comments TEXT,
    
    -- Status
    is_final BOOLEAN DEFAULT true,
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_grades_student_subject (student_id, subject_id, assessment_date),
    INDEX idx_grades_batch_subject (batch_id, subject_id, assessment_date),
    INDEX idx_grades_category (category_id, assessment_date),
    
    CONSTRAINT check_valid_score CHECK (raw_score >= 0 AND raw_score <= max_score),
    CONSTRAINT check_valid_percentage CHECK (percentage >= 0 AND percentage <= 100)
);

-- Calculated semester/term grades
CREATE TABLE student_term_grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id),
    batch_id UUID NOT NULL REFERENCES batches(id),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    
    term_name VARCHAR(50) NOT NULL, -- 'Semester 1', 'Quarter 1', etc.
    term_start_date DATE NOT NULL,
    term_end_date DATE NOT NULL,
    
    -- Calculated grades
    total_points_earned DECIMAL(8,2),
    total_points_possible DECIMAL(8,2),
    final_percentage DECIMAL(5,2),
    final_letter_grade VARCHAR(5),
    final_grade_points DECIMAL(3,2),
    
    -- Statistics
    class_rank INTEGER,
    class_size INTEGER,
    percentile DECIMAL(5,2),
    
    -- Attendance impact
    attendance_percentage DECIMAL(5,2),
    attendance_impact DECIMAL(5,2) DEFAULT 0,
    
    -- Teacher comments
    teacher_comments TEXT,
    improvement_areas TEXT[],
    strengths TEXT[],
    
    -- Status
    is_final BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(student_id, subject_id, batch_id, term_name),
    INDEX idx_term_grades_student (student_id, academic_year_id),
    INDEX idx_term_grades_batch_term (batch_id, term_name)
);
```

---

## 4. Communication and Messaging Schema

### 4.1 Messaging System

**Real-time Communication Infrastructure**
```sql
-- Message conversations
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) DEFAULT 'direct' CHECK (type IN ('direct', 'group', 'class', 'announcement')),
    title VARCHAR(200),
    description TEXT,
    
    -- Group/class specific
    batch_id UUID REFERENCES batches(id),
    subject_id UUID REFERENCES subjects(id),
    institute_id UUID REFERENCES institutes(id),
    
    -- Settings
    is_muted BOOLEAN DEFAULT false,
    allow_attachments BOOLEAN DEFAULT true,
    max_participants INTEGER,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_archived BOOLEAN DEFAULT false,
    archived_at TIMESTAMP,
    
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_message_at TIMESTAMP,
    
    INDEX idx_conversations_type_active (type, is_active),
    INDEX idx_conversations_batch (batch_id),
    INDEX idx_conversations_updated (last_message_at DESC)
);

-- Conversation participants
CREATE TABLE conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
    
    -- Permissions
    can_add_participants BOOLEAN DEFAULT false,
    can_remove_participants BOOLEAN DEFAULT false,
    can_edit_info BOOLEAN DEFAULT false,
    can_pin_messages BOOLEAN DEFAULT false,
    
    -- Status and settings
    is_muted BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    joined_at TIMESTAMP DEFAULT NOW(),
    left_at TIMESTAMP,
    
    -- Read status tracking
    last_read_message_id UUID,
    last_read_at TIMESTAMP,
    unread_count INTEGER DEFAULT 0,
    
    UNIQUE(conversation_id, user_id),
    INDEX idx_participants_user (user_id),
    INDEX idx_participants_conversation_active (conversation_id, is_active)
);

-- Messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    
    -- Message content
    message_type VARCHAR(20) DEFAULT 'text' CHECK (
        message_type IN ('text', 'voice', 'image', 'video', 'document', 'location', 'poll', 'announcement')
    ),
    content TEXT,
    formatted_content JSONB, -- Rich text formatting
    
    -- Attachments and media
    attachments JSONB,
    media_url TEXT,
    media_thumbnail TEXT,
    media_duration INTEGER, -- for voice/video messages
    file_size BIGINT,
    
    -- Message features
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP,
    deleted_by UUID REFERENCES users(id),
    
    -- Reply and thread
    reply_to_message_id UUID REFERENCES messages(id),
    thread_id UUID,
    
    -- Priority and importance
    priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    is_pinned BOOLEAN DEFAULT false,
    pinned_by UUID REFERENCES users(id),
    pinned_at TIMESTAMP,
    
    -- Delivery and read tracking
    delivered_at TIMESTAMP,
    read_count INTEGER DEFAULT 0,
    
    -- Mentions and tags
    mentioned_users UUID[] DEFAULT ARRAY[]::UUID[],
    hashtags TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_messages_conversation_time (conversation_id, created_at DESC),
    INDEX idx_messages_sender_time (sender_id, created_at DESC),
    INDEX idx_messages_type_time (message_type, created_at DESC),
    INDEX idx_messages_thread (thread_id, created_at),
    INDEX idx_messages_reply (reply_to_message_id),
    
    -- Full-text search index
    INDEX idx_messages_search USING GIN (to_tsvector('english', content))
);

-- Message read receipts
CREATE TABLE message_read_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(message_id, user_id),
    INDEX idx_read_receipts_message (message_id),
    INDEX idx_read_receipts_user_time (user_id, read_at DESC)
);

-- Message reactions
CREATE TABLE message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reaction_type VARCHAR(50) NOT NULL, -- emoji or reaction type
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(message_id, user_id, reaction_type),
    INDEX idx_reactions_message (message_id),
    INDEX idx_reactions_user (user_id)
);
```

### 4.2 Notification System

**Comprehensive Notification Infrastructure**
```sql
-- Notification templates
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID REFERENCES institutes(id),
    
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    
    -- Template content
    title_template TEXT NOT NULL,
    body_template TEXT NOT NULL,
    action_button_text VARCHAR(50),
    action_url_template TEXT,
    
    -- Delivery settings
    channels VARCHAR(20)[] DEFAULT ARRAY['push', 'email'], -- push, email, sms, in_app
    priority VARCHAR(10) DEFAULT 'normal',
    delay_minutes INTEGER DEFAULT 0,
    
    -- Personalization
    variables JSONB, -- Template variables and their descriptions
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(institute_id, event_type),
    INDEX idx_notification_templates_category (category),
    INDEX idx_notification_templates_event (event_type)
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID REFERENCES institutes(id),
    user_id UUID NOT NULL REFERENCES users(id),
    template_id UUID REFERENCES notification_templates(id),
    
    -- Notification content
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    action_button_text VARCHAR(50),
    action_url TEXT,
    
    -- Categorization
    category VARCHAR(50) NOT NULL,
    notification_type VARCHAR(100) NOT NULL,
    priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- Delivery channels
    channels VARCHAR(20)[] DEFAULT ARRAY['push'],
    delivery_status JSONB DEFAULT '{}', -- Status per channel
    
    -- Related entities
    related_entity_type VARCHAR(50), -- assignment, class, payment, etc.
    related_entity_id UUID,
    metadata JSONB DEFAULT '{}',
    
    -- User interaction
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    is_clicked BOOLEAN DEFAULT false,
    clicked_at TIMESTAMP,
    
    -- Delivery tracking
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    failed_at TIMESTAMP,
    failure_reason TEXT,
    
    -- Scheduling
    scheduled_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_notifications_user_unread (user_id, is_read, created_at DESC),
    INDEX idx_notifications_user_category (user_id, category, created_at DESC),
    INDEX idx_notifications_scheduled (scheduled_at),
    INDEX idx_notifications_type_entity (notification_type, related_entity_type, related_entity_id)
);

-- User notification preferences
CREATE TABLE user_notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    institute_id UUID REFERENCES institutes(id),
    
    -- Global settings
    push_enabled BOOLEAN DEFAULT true,
    email_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT false,
    
    -- Category-specific settings
    assignments_push BOOLEAN DEFAULT true,
    assignments_email BOOLEAN DEFAULT true,
    assignments_sms BOOLEAN DEFAULT false,
    
    classes_push BOOLEAN DEFAULT true,
    classes_email BOOLEAN DEFAULT false,
    classes_sms BOOLEAN DEFAULT false,
    
    grades_push BOOLEAN DEFAULT true,
    grades_email BOOLEAN DEFAULT true,
    grades_sms BOOLEAN DEFAULT false,
    
    payments_push BOOLEAN DEFAULT true,
    payments_email BOOLEAN DEFAULT true,
    payments_sms BOOLEAN DEFAULT true,
    
    announcements_push BOOLEAN DEFAULT true,
    announcements_email BOOLEAN DEFAULT true,
    announcements_sms BOOLEAN DEFAULT false,
    
    -- Timing preferences
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '07:00',
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    
    -- Digest settings
    daily_digest BOOLEAN DEFAULT false,
    weekly_digest BOOLEAN DEFAULT true,
    
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, institute_id),
    INDEX idx_user_preferences_user (user_id)
);
```

---

## 5. Payment and Financial Schema

### 5.1 Fee Management System

**Comprehensive Financial Tracking**
```sql
-- Fee structures
CREATE TABLE fee_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    
    name VARCHAR(100) NOT NULL,
    description TEXT,
    grade_levels INTEGER[] NOT NULL,
    
    -- Fee components
    total_annual_fee DECIMAL(10,2) NOT NULL,
    installment_count INTEGER DEFAULT 1,
    installment_amount DECIMAL(10,2),
    
    -- Fee breakdown
    tuition_fee DECIMAL(10,2) DEFAULT 0,
    admission_fee DECIMAL(10,2) DEFAULT 0,
    development_fee DECIMAL(10,2) DEFAULT 0,
    activity_fee DECIMAL(10,2) DEFAULT 0,
    library_fee DECIMAL(10,2) DEFAULT 0,
    lab_fee DECIMAL(10,2) DEFAULT 0,
    transport_fee DECIMAL(10,2) DEFAULT 0,
    hostel_fee DECIMAL(10,2) DEFAULT 0,
    other_fees JSONB DEFAULT '{}',
    
    -- Due dates and schedule
    installment_schedule JSONB, -- Due dates for each installment
    late_fee_percentage DECIMAL(5,2) DEFAULT 0,
    late_fee_grace_days INTEGER DEFAULT 0,
    
    -- Discounts and scholarships
    discount_applicable BOOLEAN DEFAULT true,
    scholarship_applicable BOOLEAN DEFAULT true,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(institute_id, academic_year_id, name),
    INDEX idx_fee_structures_institute_year (institute_id, academic_year_id),
    INDEX idx_fee_structures_grades (grade_levels)
);

-- Student fee assignments
CREATE TABLE student_fee_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    fee_structure_id UUID NOT NULL REFERENCES fee_structures(id),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    
    -- Customized amounts (if different from structure)
    total_fee_amount DECIMAL(10,2) NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    scholarship_amount DECIMAL(10,2) DEFAULT 0,
    final_amount DECIMAL(10,2) NOT NULL,
    
    -- Payment schedule
    installment_count INTEGER NOT NULL,
    installment_amount DECIMAL(10,2) NOT NULL,
    
    -- Status tracking
    total_paid DECIMAL(10,2) DEFAULT 0,
    total_pending DECIMAL(10,2),
    overdue_amount DECIMAL(10,2) DEFAULT 0,
    
    assigned_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(student_id, academic_year_id),
    INDEX idx_student_fees_student (student_id),
    INDEX idx_student_fees_structure (fee_structure_id),
    
    CONSTRAINT check_fee_amounts CHECK (
        total_paid + total_pending = final_amount
    )
);

-- Payment transactions
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    fee_assignment_id UUID REFERENCES student_fee_assignments(id),
    
    -- Payment details
    payment_reference VARCHAR(100) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    
    -- Payment categorization
    payment_type VARCHAR(50) DEFAULT 'tuition_fee',
    payment_method VARCHAR(50) NOT NULL, -- card, netbanking, upi, cash, cheque
    installment_number INTEGER,
    
    -- Gateway information
    gateway_name VARCHAR(50), -- razorpay, payu, etc.
    gateway_transaction_id VARCHAR(100),
    gateway_order_id VARCHAR(100),
    gateway_signature TEXT,
    gateway_fee DECIMAL(8,2) DEFAULT 0,
    
    -- Status and workflow
    status VARCHAR(20) DEFAULT 'pending' CHECK (
        status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'partially_refunded')
    ),
    
    -- Important dates
    initiated_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    failed_at TIMESTAMP,
    due_date DATE,
    
    -- Additional information
    description TEXT,
    receipt_number VARCHAR(100),
    receipt_url TEXT,
    
    -- Late fee handling
    late_fee_amount DECIMAL(8,2) DEFAULT 0,
    is_late_payment BOOLEAN DEFAULT false,
    late_days INTEGER DEFAULT 0,
    
    -- Refund information
    refund_amount DECIMAL(8,2) DEFAULT 0,
    refund_reason TEXT,
    refunded_at TIMESTAMP,
    refund_reference VARCHAR(100),
    
    -- User and session information
    paid_by UUID REFERENCES users(id), -- who made the payment
    payment_ip_address INET,
    payment_device_info JSONB,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_payments_student_status (student_id, status),
    INDEX idx_payments_gateway_id (gateway_transaction_id),
    INDEX idx_payments_status_date (status, created_at),
    INDEX idx_payments_due_date (due_date),
    INDEX idx_payments_reference (payment_reference)
);

-- Payment webhooks log
CREATE TABLE payment_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gateway_name VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    webhook_id VARCHAR(100),
    
    -- Request information
    raw_payload JSONB NOT NULL,
    signature TEXT,
    headers JSONB,
    ip_address INET,
    
    -- Processing information
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP,
    payment_id UUID REFERENCES payments(id),
    
    -- Error handling
    processing_error TEXT,
    retry_count INTEGER DEFAULT 0,
    
    received_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_webhooks_gateway_type (gateway_name, event_type),
    INDEX idx_webhooks_processed (processed, received_at),
    INDEX idx_webhooks_payment (payment_id)
);
```

---

## 6. Advanced Features Schema

### 6.1 AI and Analytics

**AI Integration and Performance Analytics**
```sql
-- AI doubt resolution system
CREATE TABLE student_doubts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id),
    batch_id UUID REFERENCES batches(id),
    
    -- Question details
    question_text TEXT NOT NULL,
    question_context TEXT,
    question_images TEXT[] DEFAULT ARRAY[]::TEXT[],
    question_audio_url TEXT,
    
    -- Classification
    subject_topic VARCHAR(100),
    difficulty_level VARCHAR(20) DEFAULT 'unknown',
    question_type VARCHAR(50), -- conceptual, numerical, theoretical
    
    -- AI processing
    ai_processed BOOLEAN DEFAULT false,
    ai_response TEXT,
    ai_confidence DECIMAL(3,2),
    ai_processing_time INTEGER, -- milliseconds
    ai_model_version VARCHAR(50),
    
    -- Teacher involvement
    requires_teacher BOOLEAN DEFAULT false,
    teacher_assigned UUID REFERENCES teachers(id),
    teacher_response TEXT,
    teacher_responded_at TIMESTAMP,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'submitted' CHECK (
        status IN ('submitted', 'ai_processing', 'ai_answered', 'teacher_assigned', 'teacher_answered', 'resolved', 'escalated')
    ),
    
    -- Feedback and rating
    student_rating INTEGER CHECK (student_rating BETWEEN 1 AND 5),
    student_feedback TEXT,
    is_helpful BOOLEAN,
    
    -- Metadata
    submitted_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP,
    response_time INTEGER, -- minutes to resolution
    
    INDEX idx_doubts_student_subject (student_id, subject_id, submitted_at DESC),
    INDEX idx_doubts_status_submitted (status, submitted_at),
    INDEX idx_doubts_teacher_pending (teacher_assigned, status),
    INDEX idx_doubts_ai_processing (ai_processed, submitted_at),
    
    -- Full-text search on questions
    INDEX idx_doubts_question_search USING GIN (to_tsvector('english', question_text))
);

-- AI-generated practice questions
CREATE TABLE ai_practice_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL REFERENCES subjects(id),
    generated_for_student UUID REFERENCES students(id),
    
    -- Question content
    question_text TEXT NOT NULL,
    question_type VARCHAR(50), -- mcq, descriptive, numerical
    difficulty_level VARCHAR(20),
    topic VARCHAR(100),
    subtopic VARCHAR(100),
    
    -- Answer and solutions
    correct_answer TEXT,
    answer_explanation TEXT,
    hints TEXT[],
    solution_steps JSONB,
    
    -- MCQ specific
    options JSONB, -- for multiple choice questions
    
    -- AI metadata
    generated_by_model VARCHAR(50),
    generation_prompt TEXT,
    confidence_score DECIMAL(3,2),
    
    -- Usage tracking
    times_attempted INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2),
    avg_time_taken INTEGER, -- seconds
    
    -- Quality control
    is_reviewed BOOLEAN DEFAULT false,
    reviewed_by UUID REFERENCES teachers(id),
    quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
    is_approved BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_practice_questions_subject_difficulty (subject_id, difficulty_level),
    INDEX idx_practice_questions_student (generated_for_student, created_at),
    INDEX idx_practice_questions_topic (topic, subtopic),
    
    -- Full-text search
    INDEX idx_practice_questions_search USING GIN (to_tsvector('english', question_text))
);

-- Student performance analytics
CREATE TABLE student_performance_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id),
    batch_id UUID REFERENCES batches(id),
    analysis_period VARCHAR(20) NOT NULL, -- weekly, monthly, quarterly
    
    -- Time period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Performance metrics
    overall_score DECIMAL(5,2),
    improvement_rate DECIMAL(5,2), -- compared to previous period
    consistency_score DECIMAL(5,2),
    engagement_score DECIMAL(5,2),
    
    -- Detailed analytics
    strengths TEXT[],
    weaknesses TEXT[],
    recommendations TEXT[],
    
    -- Attendance impact
    attendance_percentage DECIMAL(5,2),
    attendance_correlation DECIMAL(3,2), -- correlation with performance
    
    -- Assignment analytics
    assignments_completed INTEGER DEFAULT 0,
    assignments_total INTEGER DEFAULT 0,
    avg_assignment_score DECIMAL(5,2),
    
    -- Class participation
    participation_score DECIMAL(5,2),
    doubts_asked INTEGER DEFAULT 0,
    doubts_quality_score DECIMAL(5,2),
    
    -- Comparative analysis
    class_rank INTEGER,
    percentile DECIMAL(5,2),
    comparison_to_class_avg DECIMAL(5,2),
    
    -- Learning patterns
    preferred_learning_time VARCHAR(20),
    learning_style VARCHAR(50),
    difficulty_pattern JSONB, -- topics where student struggles
    
    -- AI insights
    ai_generated_insights JSONB,
    personalized_study_plan JSONB,
    
    -- Status
    is_current BOOLEAN DEFAULT true,
    generated_at TIMESTAMP DEFAULT NOW(),
    generated_by VARCHAR(20) DEFAULT 'system', -- system, teacher, ai
    
    UNIQUE(student_id, subject_id, analysis_period, period_start),
    INDEX idx_performance_analytics_student_period (student_id, analysis_period, period_start DESC),
    INDEX idx_performance_analytics_batch_period (batch_id, analysis_period, period_start),
    INDEX idx_performance_analytics_current (is_current, generated_at DESC)
);
```

### 6.2 File Management and Media

**Comprehensive File Storage System**
```sql
-- File storage and management
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID REFERENCES institutes(id),
    uploaded_by UUID NOT NULL REFERENCES users(id),
    
    -- File information
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_extension VARCHAR(10),
    
    -- File categorization
    file_type VARCHAR(50) NOT NULL, -- image, document, video, audio
    category VARCHAR(100), -- assignment_submission, profile_picture, class_material
    
    -- Associated entities
    related_entity_type VARCHAR(50), -- assignment, user, class, etc.
    related_entity_id UUID,
    
    -- Storage information
    storage_provider VARCHAR(50) DEFAULT 's3', -- s3, local, cloudinary
    storage_path TEXT NOT NULL,
    storage_url TEXT,
    public_url TEXT,
    thumbnail_url TEXT,
    
    -- Media-specific metadata
    media_duration INTEGER, -- for video/audio files
    media_dimensions JSONB, -- width, height for images/videos
    media_metadata JSONB,
    
    -- Security and access
    is_public BOOLEAN DEFAULT false,
    access_permissions JSONB DEFAULT '{}',
    virus_scan_status VARCHAR(20) DEFAULT 'pending',
    virus_scan_result JSONB,
    
    -- Lifecycle management
    download_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP,
    expires_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_files_uploaded_by (uploaded_by, created_at DESC),
    INDEX idx_files_entity (related_entity_type, related_entity_id),
    INDEX idx_files_category_type (category, file_type),
    INDEX idx_files_institute (institute_id, created_at DESC),
    INDEX idx_files_storage_path (storage_path),
    
    -- Full-text search on filename
    INDEX idx_files_filename_search USING GIN (to_tsvector('english', original_filename))
);

-- File access logs
CREATE TABLE file_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    accessed_by UUID NOT NULL REFERENCES users(id),
    
    -- Access details
    access_type VARCHAR(20) NOT NULL, -- view, download, upload, delete
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,
    
    -- Response information
    response_status INTEGER, -- HTTP status code
    response_time INTEGER, -- milliseconds
    bytes_transferred BIGINT,
    
    accessed_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_file_access_file (file_id, accessed_at DESC),
    INDEX idx_file_access_user (accessed_by, accessed_at DESC),
    INDEX idx_file_access_type (access_type, accessed_at)
);
```

---

## 7. Database Optimization and Maintenance

### 7.1 Indexing Strategy

**Performance Optimization Indexes**
```sql
-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY idx_students_institute_batch_status 
ON students(institute_id, batch_id, status) WHERE status = 'active';

CREATE INDEX CONCURRENTLY idx_classes_batch_date_status 
ON classes(batch_id, scheduled_start_time, status) WHERE status IN ('scheduled', 'live');

CREATE INDEX CONCURRENTLY idx_assignments_batch_due_published 
ON assignments(batch_id, due_date, is_published) WHERE is_published = true;

CREATE INDEX CONCURRENTLY idx_messages_conversation_time_deleted 
ON messages(conversation_id, created_at DESC) WHERE is_deleted = false;

CREATE INDEX CONCURRENTLY idx_notifications_user_unread_priority 
ON notifications(user_id, is_read, priority, created_at DESC) WHERE is_read = false;

CREATE INDEX CONCURRENTLY idx_payments_student_status_date 
ON payments(student_id, status, created_at DESC) WHERE status IN ('completed', 'pending');

-- Partial indexes for better performance
CREATE INDEX CONCURRENTLY idx_active_user_sessions 
ON user_sessions(user_id, last_activity_at DESC) WHERE is_active = true;

CREATE INDEX CONCURRENTLY idx_pending_assignments 
ON assignment_submissions(student_id, status, submitted_at DESC) WHERE status IN ('submitted', 'graded');

CREATE INDEX CONCURRENTLY idx_current_academic_year 
ON academic_years(institute_id, start_date, end_date) WHERE is_current = true;

-- GIN indexes for JSONB columns
CREATE INDEX CONCURRENTLY idx_user_preferences_gin ON users USING GIN (preferences);
CREATE INDEX CONCURRENTLY idx_institute_settings_gin ON institutes USING GIN (settings);
CREATE INDEX CONCURRENTLY idx_assignment_rubric_gin ON assignments USING GIN (rubric);
CREATE INDEX CONCURRENTLY idx_notification_metadata_gin ON notifications USING GIN (metadata);

-- Full-text search indexes
CREATE INDEX CONCURRENTLY idx_users_search_gin ON users USING GIN (search_vector);
CREATE INDEX CONCURRENTLY idx_institutes_search_gin ON institutes USING GIN (search_vector);
CREATE INDEX CONCURRENTLY idx_messages_content_search ON messages USING GIN (to_tsvector('english', content));
```

### 7.2 Database Maintenance Procedures

**Automated Maintenance Tasks**
```sql
-- Create maintenance procedures
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete inactive sessions older than 30 days
    DELETE FROM user_sessions 
    WHERE is_active = false 
      AND ended_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete expired tokens
    DELETE FROM user_tokens 
    WHERE expires_at < NOW()
      AND is_revoked = false;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Mark old refresh tokens as revoked instead of deleting
    UPDATE user_tokens 
    SET is_revoked = true 
    WHERE token_type = 'refresh' 
      AND created_at < NOW() - INTERVAL '90 days'
      AND is_revoked = false;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION archive_old_messages()
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    -- Archive messages older than 1 year
    INSERT INTO archived_messages 
    SELECT * FROM messages 
    WHERE created_at < NOW() - INTERVAL '1 year'
      AND is_deleted = false;
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    
    -- Delete archived messages from main table
    DELETE FROM messages 
    WHERE created_at < NOW() - INTERVAL '1 year'
      AND is_deleted = false;
    
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- Schedule maintenance tasks
-- (These would typically be scheduled using pg_cron or external cron jobs)
```

### 7.3 Performance Monitoring

**Database Performance Views and Functions**
```sql
-- Create monitoring views
CREATE VIEW slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    max_time,
    stddev_time,
    rows
FROM pg_stat_statements 
WHERE mean_time > 1000 -- queries taking more than 1 second on average
ORDER BY mean_time DESC;

CREATE VIEW index_usage AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan,
    CASE 
        WHEN idx_scan = 0 THEN 'UNUSED'
        WHEN idx_scan < 100 THEN 'LOW_USAGE'
        ELSE 'ACTIVE'
    END as usage_status
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

CREATE VIEW table_sizes AS
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Create performance monitoring function
CREATE OR REPLACE FUNCTION get_database_health_report()
RETURNS TABLE (
    metric VARCHAR(50),
    value TEXT,
    status VARCHAR(20),
    recommendation TEXT
) AS $$
BEGIN
    -- Check database size
    RETURN QUERY
    SELECT 
        'database_size'::VARCHAR(50),
        pg_size_pretty(pg_database_size(current_database())),
        CASE 
            WHEN pg_database_size(current_database()) > 100*1024*1024*1024 THEN 'WARNING'
            ELSE 'OK'
        END::VARCHAR(20),
        'Monitor disk usage and consider archiving old data'::TEXT;
    
    -- Check connection count
    RETURN QUERY
    SELECT 
        'active_connections'::VARCHAR(50),
        count(*)::TEXT,
        CASE 
            WHEN count(*) > 150 THEN 'WARNING'
            WHEN count(*) > 180 THEN 'CRITICAL'
            ELSE 'OK'
        END::VARCHAR(20),
        'Monitor connection pool usage'::TEXT
    FROM pg_stat_activity 
    WHERE state = 'active';
    
    -- Check for unused indexes
    RETURN QUERY
    SELECT 
        'unused_indexes'::VARCHAR(50),
        count(*)::TEXT,
        CASE 
            WHEN count(*) > 10 THEN 'WARNING'
            ELSE 'OK'
        END::VARCHAR(20),
        'Consider dropping unused indexes to improve write performance'::TEXT
    FROM pg_stat_user_indexes 
    WHERE idx_scan = 0;
    
END;
$$ LANGUAGE plpgsql;
```

This comprehensive database design provides a robust, scalable foundation for the Coaching Management Mobile App with proper indexing, optimization strategies, and maintenance procedures to ensure high performance and data integrity.