# Deployment & DevOps Implementation Guide
## Coaching Management Mobile App - Production Deployment & Infrastructure Automation

### Executive Summary
This document provides comprehensive deployment strategies, DevOps automation, infrastructure as code, monitoring solutions, and production maintenance procedures for the Coaching Management Mobile App. It covers both backend API deployment on AWS and mobile app distribution through app stores.

---

## 1. Infrastructure Architecture

### 1.1 AWS Production Architecture

**High-Level Infrastructure Diagram**
```
┌─────────────────────────────────────────────────────────────────┐
│                        USERS & CLIENTS                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Mobile Apps   │  │   Admin Panel   │  │   Teacher Web   │ │
│  │  (iOS/Android)  │  │     (React)     │  │    (React)      │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        CDN & LOAD BALANCING                     │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              Amazon CloudFront CDN                          │ │
│  │  • Global content distribution                              │ │
│  │  • API response caching                                     │ │
│  │  • Static asset delivery                                    │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │            Application Load Balancer (ALB)                  │ │
│  │  • SSL termination                                          │ │
│  │  • Health checks                                            │ │
│  │  • Request routing                                          │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CONTAINER ORCHESTRATION                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Amazon ECS Fargate                       │ │
│  │                                                             │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │ │
│  │  │   API       │ │   Worker    │ │   Socket    │            │ │
│  │  │  Service    │ │   Service   │ │   Service   │            │ │
│  │  │  (3 tasks)  │ │  (2 tasks)  │ │  (2 tasks)  │            │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘            │ │
│  │                                                             │ │
│  │  Auto Scaling: CPU > 70% or Memory > 80%                   │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                              │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐    │ │
│  │   PostgreSQL    │ │      Redis      │ │  Elasticsearch  │    │ │
│  │   RDS Cluster   │ │   ElastiCache   │ │   OpenSearch    │    │ │
│  │  (Multi-AZ)     │ │   (Cluster)     │ │   (Cluster)     │    │ │
│  │                 │ │                 │ │                 │    │ │
│  │ • Read Replicas │ │ • Session Store │ │ • Search &      │    │ │
│  │ • Automated     │ │ • API Cache     │ │   Analytics     │    │ │
│  │   Backups       │ │ • Queue         │ │                 │    │ │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘    │ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      STORAGE & SECURITY                         │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐    │ │
│  │   Amazon S3     │ │   AWS Secrets   │ │   AWS WAF       │    │ │
│  │                 │ │    Manager      │ │                 │    │ │
│  │ • File Storage  │ │ • API Keys      │ │ • DDoS          │    │ │
│  │ • Media Assets  │ │ • DB Passwords  │ │   Protection    │    │ │
│  │ • Backups       │ │ • Certificates  │ │ • IP Filtering  │    │ │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘    │ │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Terraform Infrastructure as Code

**Main Infrastructure Configuration**
```hcl
# infrastructure/main.tf
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket         = "coaching-app-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-locks"
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Environment = var.environment
      Project     = "coaching-app"
      ManagedBy   = "terraform"
    }
  }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# Local values
locals {
  azs      = slice(data.aws_availability_zones.available.names, 0, 3)
  name     = "coaching-app-${var.environment}"
  region   = var.aws_region
  
  tags = {
    Environment = var.environment
    Project     = "coaching-app"
  }
}

# VPC Module
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = local.name
  cidr = var.vpc_cidr

  azs             = local.azs
  private_subnets = var.private_subnets
  public_subnets  = var.public_subnets
  database_subnets = var.database_subnets

  enable_nat_gateway = true
  enable_vpn_gateway = false
  enable_dns_hostnames = true
  enable_dns_support = true

  tags = local.tags
}

# Security Groups
resource "aws_security_group" "alb" {
  name_prefix = "${local.name}-alb"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.tags, {
    Name = "${local.name}-alb-sg"
  })
}

resource "aws_security_group" "ecs" {
  name_prefix = "${local.name}-ecs"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.tags, {
    Name = "${local.name}-ecs-sg"
  })
}

resource "aws_security_group" "database" {
  name_prefix = "${local.name}-db"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }

  tags = merge(local.tags, {
    Name = "${local.name}-db-sg"
  })
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = local.name
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = module.vpc.public_subnets

  enable_deletion_protection = var.environment == "production"

  tags = local.tags
}

resource "aws_lb_target_group" "api" {
  name     = "${local.name}-api"
  port     = 3000
  protocol = "HTTP"
  vpc_id   = module.vpc.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = local.tags
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = local.name

  configuration {
    execute_command_configuration {
      logging = "OVERRIDE"
      log_configuration {
        cloud_watch_log_group_name = aws_cloudwatch_log_group.ecs_exec.name
      }
    }
  }

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = local.tags
}

# ECS Task Definition
resource "aws_ecs_task_definition" "api" {
  family                   = "${local.name}-api"
  requires_compatibilities = ["FARGATE"]
  network_mode            = "awsvpc"
  cpu                     = var.api_cpu
  memory                  = var.api_memory
  execution_role_arn      = aws_iam_role.ecs_execution_role.arn
  task_role_arn          = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name  = "coaching-api"
      image = "${aws_ecr_repository.api.repository_url}:${var.api_image_tag}"
      
      portMappings = [
        {
          containerPort = 3000
          protocol      = "tcp"
        }
      ]
      
      environment = [
        {
          name  = "NODE_ENV"
          value = var.environment
        },
        {
          name  = "PORT"
          value = "3000"
        },
        {
          name  = "DATABASE_URL"
          value = "postgresql://${var.db_username}:${var.db_password}@${module.rds.db_instance_endpoint}/${module.rds.db_instance_name}"
        },
        {
          name  = "REDIS_URL"
          value = "redis://${aws_elasticache_replication_group.main.primary_endpoint_address}:6379"
        }
      ]
      
      secrets = [
        {
          name      = "JWT_SECRET"
          valueFrom = aws_ssm_parameter.jwt_secret.arn
        },
        {
          name      = "OPENAI_API_KEY"
          valueFrom = aws_ssm_parameter.openai_api_key.arn
        },
        {
          name      = "RAZORPAY_KEY_ID"
          valueFrom = aws_ssm_parameter.razorpay_key_id.arn
        },
        {
          name      = "RAZORPAY_KEY_SECRET"
          valueFrom = aws_ssm_parameter.razorpay_key_secret.arn
        }
      ]
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.api.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
      
      healthCheck = {
        command = ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"]
        interval = 30
        timeout = 5
        retries = 3
        startPeriod = 60
      }
    }
  ])

  tags = local.tags
}

# ECS Service
resource "aws_ecs_service" "api" {
  name            = "${local.name}-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = var.api_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    security_groups  = [aws_security_group.ecs.id]
    subnets          = module.vpc.private_subnets
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "coaching-api"
    container_port   = 3000
  }

  # Enable execute command for debugging
  enable_execute_command = var.environment != "production"

  # Deployment configuration
  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 100
  }

  # Service auto scaling
  lifecycle {
    ignore_changes = [desired_count]
  }

  tags = local.tags

  depends_on = [
    aws_lb_listener.api,
    aws_iam_role_policy_attachment.ecs_execution_role_policy,
    aws_iam_role_policy_attachment.ecs_task_role_policy,
  ]
}

# Auto Scaling
resource "aws_appautoscaling_target" "ecs_target" {
  max_capacity       = var.api_max_capacity
  min_capacity       = var.api_min_capacity
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.api.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "ecs_cpu_policy" {
  name               = "${local.name}-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 300
  }
}

resource "aws_appautoscaling_policy" "ecs_memory_policy" {
  name               = "${local.name}-memory-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value       = 80.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 300
  }
}
```

**Database Infrastructure**
```hcl
# infrastructure/database.tf

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = local.name
  subnet_ids = module.vpc.database_subnets

  tags = merge(local.tags, {
    Name = "${local.name}-db-subnet-group"
  })
}

# Parameter Group
resource "aws_db_parameter_group" "main" {
  family = "postgres15"
  name   = local.name

  parameter {
    name  = "shared_buffers"
    value = "8388608" # 8GB in 8KB pages
  }

  parameter {
    name  = "effective_cache_size"
    value = "25165824" # 24GB in 8KB pages
  }

  parameter {
    name  = "work_mem"
    value = "65536" # 64MB in KB
  }

  parameter {
    name  = "maintenance_work_mem"
    value = "1048576" # 1GB in KB
  }

  parameter {
    name  = "checkpoint_completion_target"
    value = "0.9"
  }

  parameter {
    name  = "wal_buffers"
    value = "8192" # 64MB in 8KB pages
  }

  parameter {
    name  = "default_statistics_target"
    value = "500"
  }

  parameter {
    name  = "random_page_cost"
    value = "1.1"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000" # Log queries taking > 1 second
  }

  tags = local.tags
}

# RDS Instance
module "rds" {
  source = "terraform-aws-modules/rds/aws"
  version = "~> 6.0"

  identifier = local.name

  # Database configuration
  engine               = "postgres"
  engine_version       = "15.3"
  family               = "postgres15"
  major_engine_version = "15"
  instance_class       = var.db_instance_class

  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_encrypted     = true
  storage_type          = "gp3"
  iops                 = var.db_iops

  # Database settings
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password
  port     = 5432

  # Network settings
  vpc_security_group_ids = [aws_security_group.database.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  parameter_group_name   = aws_db_parameter_group.main.name

  # Backup settings
  backup_retention_period = var.environment == "production" ? 30 : 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  # Monitoring
  performance_insights_enabled = true
  performance_insights_retention_period = var.environment == "production" ? 731 : 7
  monitoring_interval = 60
  monitoring_role_name = "${local.name}-rds-monitoring-role"
  create_monitoring_role = true

  # Security
  deletion_protection = var.environment == "production"
  skip_final_snapshot = var.environment != "production"
  final_snapshot_identifier = "${local.name}-final-snapshot"

  # Multi-AZ for production
  multi_az = var.environment == "production"

  tags = local.tags
}

# Read Replica for production
resource "aws_db_instance" "read_replica" {
  count = var.environment == "production" ? 1 : 0

  identifier = "${local.name}-read-replica"

  replicate_source_db = module.rds.db_instance_identifier

  instance_class = var.db_read_replica_instance_class
  publicly_accessible = false

  auto_minor_version_upgrade = true

  vpc_security_group_ids = [aws_security_group.database.id]

  performance_insights_enabled = true
  monitoring_interval = 60

  tags = merge(local.tags, {
    Name = "${local.name}-read-replica"
  })
}

# ElastiCache Subnet Group
resource "aws_elasticache_subnet_group" "main" {
  name       = local.name
  subnet_ids = module.vpc.private_subnets

  tags = local.tags
}

# ElastiCache Parameter Group
resource "aws_elasticache_parameter_group" "main" {
  family = "redis7.x"
  name   = local.name

  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  tags = local.tags
}

# ElastiCache Redis Cluster
resource "aws_elasticache_replication_group" "main" {
  replication_group_id         = local.name
  description                  = "Redis cluster for ${local.name}"

  port               = 6379
  parameter_group_name = aws_elasticache_parameter_group.main.name
  node_type          = var.redis_node_type
  num_cache_clusters = var.redis_num_clusters

  engine_version = "7.0"

  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]

  # Encryption
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                = var.redis_auth_token

  # High availability for production
  automatic_failover_enabled = var.environment == "production"
  multi_az_enabled          = var.environment == "production"

  # Backup settings
  snapshot_retention_limit = var.environment == "production" ? 7 : 1
  snapshot_window         = "03:00-05:00"

  tags = local.tags
}

# Security group for Redis
resource "aws_security_group" "redis" {
  name_prefix = "${local.name}-redis"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }

  tags = merge(local.tags, {
    Name = "${local.name}-redis-sg"
  })
}
```

---

## 2. CI/CD Pipeline Implementation

### 2.1 GitHub Actions Workflows

**Main CI/CD Workflow**
```yaml
# .github/workflows/ci-cd-production.yml
name: Production CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  AWS_REGION: us-east-1
  ECS_CLUSTER: coaching-app-production
  ECS_SERVICE: coaching-app-production-api
  ECR_REPOSITORY: coaching-app-api

jobs:
  # Quality checks and testing
  quality-check:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: coaching_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run type checking
        run: npm run type-check

      - name: Run unit tests
        run: npm run test:unit
        env:
          NODE_ENV: test

      - name: Run integration tests
        run: npm run test:integration
        env:
          NODE_ENV: test
          DATABASE_URL: postgresql://test:test@localhost:5432/coaching_test
          REDIS_URL: redis://localhost:6379

      - name: Run security audit
        run: npm audit --audit-level=moderate

      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: |
            coverage/
            test-results.xml

      - name: SonarCloud Scan
        uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}

  # Security scanning
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

  # Build and push Docker image
  build:
    needs: [quality-check, security-scan]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    outputs:
      image-tag: ${{ steps.meta.outputs.tags }}
      image-digest: ${{ steps.build.outputs.digest }}

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ steps.login-ecr.outputs.registry }}/${{ env.ECR_REPOSITORY }}
          tags: |
            type=ref,event=branch
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build and push Docker image
        id: build
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./Dockerfile.production
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          platforms: linux/amd64

      - name: Generate SBOM
        uses: anchore/sbom-action@v0
        with:
          image: ${{ steps.meta.outputs.tags }}
          format: spdx-json
          output-file: sbom.spdx.json

      - name: Upload SBOM
        uses: actions/upload-artifact@v3
        with:
          name: sbom
          path: sbom.spdx.json

  # Deploy to staging
  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Deploy to ECS Staging
        run: |
          aws ecs update-service \
            --cluster coaching-app-staging \
            --service coaching-app-staging-api \
            --force-new-deployment \
            --task-definition coaching-app-staging-api

      - name: Wait for deployment
        run: |
          aws ecs wait services-stable \
            --cluster coaching-app-staging \
            --services coaching-app-staging-api

      - name: Run smoke tests
        run: |
          curl -f https://staging-api.coachingapp.com/health || exit 1
          curl -f https://staging-api.coachingapp.com/api/v1/health/detailed || exit 1

  # Deploy to production
  deploy-production:
    needs: [build, deploy-staging]
    runs-on: ubuntu-latest
    environment: production
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID_PROD }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY_PROD }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Update ECS task definition
        id: task-def
        run: |
          # Get current task definition
          TASK_DEFINITION=$(aws ecs describe-task-definition \
            --task-definition ${{ env.ECS_SERVICE }} \
            --query taskDefinition)
          
          # Update image in task definition
          NEW_TASK_DEFINITION=$(echo $TASK_DEFINITION | jq --arg IMAGE "${{ needs.build.outputs.image-tag }}" \
            '.containerDefinitions[0].image = $IMAGE')
          
          # Remove fields that cause registration to fail
          NEW_TASK_DEFINITION=$(echo $NEW_TASK_DEFINITION | jq 'del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .placementConstraints, .compatibilities, .registeredAt, .registeredBy)')
          
          # Register new task definition
          NEW_TASK_DEF_ARN=$(echo $NEW_TASK_DEFINITION | aws ecs register-task-definition \
            --cli-input-json file:///dev/stdin \
            --query 'taskDefinition.taskDefinitionArn' \
            --output text)
          
          echo "task-def-arn=$NEW_TASK_DEF_ARN" >> $GITHUB_OUTPUT

      - name: Blue-Green deployment
        run: |
          # Update service with new task definition
          aws ecs update-service \
            --cluster ${{ env.ECS_CLUSTER }} \
            --service ${{ env.ECS_SERVICE }} \
            --task-definition ${{ steps.task-def.outputs.task-def-arn }}

      - name: Wait for deployment
        run: |
          aws ecs wait services-stable \
            --cluster ${{ env.ECS_CLUSTER }} \
            --services ${{ env.ECS_SERVICE }}

      - name: Run production smoke tests
        run: |
          curl -f https://api.coachingapp.com/health || exit 1
          curl -f https://api.coachingapp.com/api/v1/health/detailed || exit 1

      - name: Notify deployment success
        uses: 8398a7/action-slack@v3
        with:
          status: success
          channel: '#deployments'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
          fields: repo,message,commit,author,took
        if: success()

      - name: Notify deployment failure
        uses: 8398a7/action-slack@v3
        with:
          status: failure
          channel: '#deployments'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
          fields: repo,message,commit,author,took
        if: failure()

  # Database migrations
  migrate-database:
    needs: deploy-production
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID_PROD }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY_PROD }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Run database migrations
        run: |
          # Run migration task on ECS
          MIGRATION_TASK_ARN=$(aws ecs run-task \
            --cluster ${{ env.ECS_CLUSTER }} \
            --task-definition coaching-app-migration \
            --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-zzz]}" \
            --launch-type FARGATE \
            --query 'tasks[0].taskArn' \
            --output text)
          
          # Wait for migration to complete
          aws ecs wait tasks-stopped \
            --cluster ${{ env.ECS_CLUSTER }} \
            --tasks $MIGRATION_TASK_ARN
          
          # Check if migration was successful
          EXIT_CODE=$(aws ecs describe-tasks \
            --cluster ${{ env.ECS_CLUSTER }} \
            --tasks $MIGRATION_TASK_ARN \
            --query 'tasks[0].containers[0].exitCode' \
            --output text)
          
          if [ "$EXIT_CODE" != "0" ]; then
            echo "Migration failed with exit code: $EXIT_CODE"
            exit 1
          fi

      - name: Update database schema documentation
        run: |
          # Generate updated schema documentation
          npx @dbml/cli sql2dbml --postgres "$DATABASE_URL" -o schema.dbml
          npx @dbml/cli dbml2docs schema.dbml -o docs/database/
        env:
          DATABASE_URL: ${{ secrets.PRODUCTION_DATABASE_URL }}
```

### 2.2 Mobile App Deployment

**React Native App Store Deployment**
```yaml
# .github/workflows/mobile-deployment.yml
name: Mobile App Deployment

on:
  push:
    branches: [main, develop]
    paths:
      - 'mobile/**'
  pull_request:
    branches: [main, develop]
    paths:
      - 'mobile/**'

env:
  WORKING_DIRECTORY: ./mobile
  EXPO_PUBLIC_API_URL: https://api.coachingapp.com

jobs:
  # Mobile app testing
  test-mobile:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ${{ env.WORKING_DIRECTORY }}
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: ${{ env.WORKING_DIRECTORY }}/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run type checking
        run: npm run type-check

      - name: Run unit tests
        run: npm run test

      - name: Run component tests
        run: npm run test:component

  # Build for Android
  build-android:
    needs: test-mobile
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'
    defaults:
      run:
        working-directory: ${{ env.WORKING_DIRECTORY }}
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: ${{ env.WORKING_DIRECTORY }}/package-lock.json

      - name: Setup Java
        uses: actions/setup-java@v3
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      - name: Install dependencies
        run: npm ci

      - name: Setup environment variables
        run: |
          if [ "${{ github.ref }}" = "refs/heads/main" ]; then
            echo "EXPO_PUBLIC_API_URL=https://api.coachingapp.com" >> $GITHUB_ENV
            echo "APP_VARIANT=production" >> $GITHUB_ENV
          else
            echo "EXPO_PUBLIC_API_URL=https://staging-api.coachingapp.com" >> $GITHUB_ENV
            echo "APP_VARIANT=staging" >> $GITHUB_ENV
          fi

      - name: Decode keystore
        run: |
          echo "${{ secrets.ANDROID_KEYSTORE_BASE64 }}" | base64 -d > android/app/release.keystore

      - name: Build Android APK
        run: |
          cd android
          ./gradlew assembleRelease
        env:
          MYAPP_UPLOAD_STORE_FILE: release.keystore
          MYAPP_UPLOAD_KEY_ALIAS: ${{ secrets.ANDROID_KEY_ALIAS }}
          MYAPP_UPLOAD_STORE_PASSWORD: ${{ secrets.ANDROID_STORE_PASSWORD }}
          MYAPP_UPLOAD_KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}

      - name: Build Android AAB
        run: |
          cd android
          ./gradlew bundleRelease
        env:
          MYAPP_UPLOAD_STORE_FILE: release.keystore
          MYAPP_UPLOAD_KEY_ALIAS: ${{ secrets.ANDROID_KEY_ALIAS }}
          MYAPP_UPLOAD_STORE_PASSWORD: ${{ secrets.ANDROID_STORE_PASSWORD }}
          MYAPP_UPLOAD_KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}

      - name: Upload APK artifact
        uses: actions/upload-artifact@v3
        with:
          name: android-apk-${{ env.APP_VARIANT }}
          path: ${{ env.WORKING_DIRECTORY }}/android/app/build/outputs/apk/release/app-release.apk

      - name: Upload AAB artifact
        uses: actions/upload-artifact@v3
        with:
          name: android-aab-${{ env.APP_VARIANT }}
          path: ${{ env.WORKING_DIRECTORY }}/android/app/build/outputs/bundle/release/app-release.aab

  # Build for iOS
  build-ios:
    needs: test-mobile
    runs-on: macos-latest
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'
    defaults:
      run:
        working-directory: ${{ env.WORKING_DIRECTORY }}
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: ${{ env.WORKING_DIRECTORY }}/package-lock.json

      - name: Setup Ruby
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.0'
          bundler-cache: true
          working-directory: ${{ env.WORKING_DIRECTORY }}/ios

      - name: Install dependencies
        run: npm ci

      - name: Install CocoaPods
        run: |
          cd ios
          pod install --repo-update

      - name: Setup environment variables
        run: |
          if [ "${{ github.ref }}" = "refs/heads/main" ]; then
            echo "EXPO_PUBLIC_API_URL=https://api.coachingapp.com" >> $GITHUB_ENV
            echo "APP_VARIANT=production" >> $GITHUB_ENV
            echo "CONFIGURATION=Release" >> $GITHUB_ENV
          else
            echo "EXPO_PUBLIC_API_URL=https://staging-api.coachingapp.com" >> $GITHUB_ENV
            echo "APP_VARIANT=staging" >> $GITHUB_ENV
            echo "CONFIGURATION=Staging" >> $GITHUB_ENV
          fi

      - name: Build iOS app
        run: |
          cd ios
          bundle exec fastlane build_app \
            configuration:${{ env.CONFIGURATION }} \
            scheme:"CoachingApp" \
            export_method:"ad-hoc" \
            output_directory:"build"
        env:
          MATCH_PASSWORD: ${{ secrets.IOS_CERTIFICATES_PASSWORD }}
          FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD: ${{ secrets.IOS_APP_SPECIFIC_PASSWORD }}

      - name: Upload IPA artifact
        uses: actions/upload-artifact@v3
        with:
          name: ios-ipa-${{ env.APP_VARIANT }}
          path: ${{ env.WORKING_DIRECTORY }}/ios/build/*.ipa

  # Deploy to Play Store
  deploy-android:
    needs: build-android
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Download AAB artifact
        uses: actions/download-artifact@v3
        with:
          name: android-aab-production
          path: ./

      - name: Deploy to Play Store
        uses: r0adkll/upload-google-play@v1
        with:
          serviceAccountJsonPlainText: ${{ secrets.GOOGLE_PLAY_SERVICE_ACCOUNT }}
          packageName: com.coachingapp.mobile
          releaseFiles: app-release.aab
          track: production
          status: completed
          whatsNewDirectory: metadata/android/en-US/changelogs/

  # Deploy to App Store
  deploy-ios:
    needs: build-ios
    runs-on: macos-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    defaults:
      run:
        working-directory: ${{ env.WORKING_DIRECTORY }}
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Ruby
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.0'
          bundler-cache: true
          working-directory: ${{ env.WORKING_DIRECTORY }}/ios

      - name: Download IPA artifact
        uses: actions/download-artifact@v3
        with:
          name: ios-ipa-production
          path: ${{ env.WORKING_DIRECTORY }}/ios/build/

      - name: Deploy to App Store
        run: |
          cd ios
          bundle exec fastlane upload_to_app_store \
            ipa:"build/CoachingApp.ipa" \
            submit_for_review:false \
            automatic_release:false
        env:
          FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD: ${{ secrets.IOS_APP_SPECIFIC_PASSWORD }}
          FASTLANE_SESSION: ${{ secrets.IOS_FASTLANE_SESSION }}
```

---

## 3. Monitoring and Observability

### 3.1 CloudWatch Monitoring Setup

**Application Monitoring Configuration**
```hcl
# infrastructure/monitoring.tf

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "api" {
  name              = "/ecs/${local.name}-api"
  retention_in_days = var.environment == "production" ? 90 : 30

  tags = local.tags
}

resource "aws_cloudwatch_log_group" "ecs_exec" {
  name              = "/ecs/${local.name}-exec"
  retention_in_days = 30

  tags = local.tags
}

# Custom Metrics Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = local.name

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ServiceName", aws_ecs_service.api.name, "ClusterName", aws_ecs_cluster.main.name],
            [".", "MemoryUtilization", ".", ".", ".", "."],
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "ECS Service Metrics"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", aws_lb.main.arn_suffix],
            [".", "TargetResponseTime", ".", "."],
            [".", "HTTPCode_Target_2XX_Count", ".", "."],
            [".", "HTTPCode_Target_4XX_Count", ".", "."],
            [".", "HTTPCode_Target_5XX_Count", ".", "."],
          ]
          view   = "timeSeries"
          region = var.aws_region
          title  = "Application Load Balancer Metrics"
          period = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", module.rds.db_instance_identifier],
            [".", "DatabaseConnections", ".", "."],
            [".", "ReadLatency", ".", "."],
            [".", "WriteLatency", ".", "."],
          ]
          view   = "timeSeries"
          region = var.aws_region
          title  = "RDS Database Metrics"
          period = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 18
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ElastiCache", "CPUUtilization", "CacheClusterId", "${aws_elasticache_replication_group.main.replication_group_id}-001"],
            [".", "CurrConnections", ".", "."],
            [".", "CacheHits", ".", "."],
            [".", "CacheMisses", ".", "."],
          ]
          view   = "timeSeries"
          region = var.aws_region
          title  = "ElastiCache Redis Metrics"
          period = 300
        }
      }
    ]
  })

  tags = local.tags
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "${local.name}-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ECS CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ServiceName = aws_ecs_service.api.name
    ClusterName = aws_ecs_cluster.main.name
  }

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "high_memory" {
  alarm_name          = "${local.name}-high-memory"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "85"
  alarm_description   = "This metric monitors ECS memory utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ServiceName = aws_ecs_service.api.name
    ClusterName = aws_ecs_cluster.main.name
  }

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "high_response_time" {
  alarm_name          = "${local.name}-high-response-time"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Average"
  threshold           = "2"
  alarm_description   = "This metric monitors ALB response time"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  alarm_name          = "${local.name}-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors ALB 5xx error rate"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "database_cpu" {
  alarm_name          = "${local.name}-database-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = module.rds.db_instance_identifier
  }

  tags = local.tags
}

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  name = "${local.name}-alerts"

  tags = local.tags
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# Lambda for Slack notifications
resource "aws_lambda_function" "slack_notifications" {
  filename         = "slack-notifications.zip"
  function_name    = "${local.name}-slack-notifications"
  role            = aws_iam_role.lambda_slack.arn
  handler         = "index.handler"
  runtime         = "python3.11"
  timeout         = 30

  environment {
    variables = {
      SLACK_WEBHOOK_URL = var.slack_webhook_url
    }
  }

  tags = local.tags
}

resource "aws_sns_topic_subscription" "slack" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.slack_notifications.arn
}
```

### 3.2 Application Performance Monitoring

**APM Integration with DataDog**
```typescript
// src/monitoring/datadog.ts
import { datadogLogs } from '@datadog/browser-logs';
import { datadogRum } from '@datadog/browser-rum';
import tracer from 'dd-trace';

// Initialize DataDog tracer for Node.js
if (process.env.NODE_ENV === 'production') {
  tracer.init({
    service: 'coaching-app-api',
    version: process.env.APP_VERSION || '1.0.0',
    env: process.env.NODE_ENV,
    logInjection: true,
    analytics: true,
  });
}

// Browser RUM setup for admin panel
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  datadogRum.init({
    applicationId: process.env.DATADOG_APPLICATION_ID!,
    clientToken: process.env.DATADOG_CLIENT_TOKEN!,
    site: 'datadoghq.com',
    service: 'coaching-app-web',
    env: process.env.NODE_ENV,
    version: process.env.APP_VERSION || '1.0.0',
    sessionSampleRate: 100,
    premiumSampleRate: 100,
    trackUserInteractions: true,
    trackResources: true,
    trackLongTasks: true,
    defaultPrivacyLevel: 'mask-user-input',
  });

  datadogLogs.init({
    clientToken: process.env.DATADOG_CLIENT_TOKEN!,
    site: 'datadoghq.com',
    forwardErrorsToLogs: true,
    sessionSampleRate: 100,
  });
}

// Custom metrics collection
export class MetricsCollector {
  static recordCustomMetric(name: string, value: number, tags: Record<string, string> = {}) {
    if (process.env.NODE_ENV === 'production') {
      // Send custom metrics to DataDog
      tracer.dogstatsd.histogram(name, value, tags);
    }
  }

  static recordApiCall(endpoint: string, method: string, statusCode: number, duration: number) {
    this.recordCustomMetric('api.request.duration', duration, {
      endpoint,
      method,
      status_code: statusCode.toString(),
    });

    this.recordCustomMetric('api.request.count', 1, {
      endpoint,
      method,
      status_code: statusCode.toString(),
    });
  }

  static recordDatabaseQuery(operation: string, table: string, duration: number) {
    this.recordCustomMetric('database.query.duration', duration, {
      operation,
      table,
    });
  }

  static recordCacheOperation(operation: 'hit' | 'miss' | 'set', key: string) {
    this.recordCustomMetric('cache.operation', 1, {
      operation,
      cache_type: 'redis',
    });
  }

  static recordPaymentTransaction(status: 'success' | 'failure', gateway: string, amount: number) {
    this.recordCustomMetric('payment.transaction', 1, {
      status,
      gateway,
    });

    if (status === 'success') {
      this.recordCustomMetric('payment.amount', amount, {
        gateway,
      });
    }
  }

  static recordUserAction(action: string, userRole: string) {
    this.recordCustomMetric('user.action', 1, {
      action,
      role: userRole,
    });
  }
}

// Express middleware for automatic API monitoring
export const apiMonitoringMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const endpoint = req.route?.path || req.path;
    
    MetricsCollector.recordApiCall(
      endpoint,
      req.method,
      res.statusCode,
      duration
    );
  });

  next();
};
```

**Health Check Endpoints**
```typescript
// src/routes/health.ts
import { Router, Request, Response } from 'express';
import { DatabaseService } from '@services/DatabaseService';
import { RedisService } from '@services/RedisService';
import { PaymentService } from '@services/PaymentService';
import { AIService } from '@services/AIService';

const router = Router();

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    [key: string]: {
      status: 'healthy' | 'unhealthy';
      responseTime?: number;
      error?: string;
      details?: any;
    };
  };
}

// Basic health check
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0',
  });
});

// Detailed health check
router.get('/health/detailed', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const result: HealthCheckResult = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0',
    uptime: process.uptime(),
    checks: {},
  };

  // Database health check
  try {
    const dbStart = Date.now();
    await DatabaseService.healthCheck();
    result.checks.database = {
      status: 'healthy',
      responseTime: Date.now() - dbStart,
    };
  } catch (error) {
    result.checks.database = {
      status: 'unhealthy',
      error: error.message,
    };
    result.status = 'unhealthy';
  }

  // Redis health check
  try {
    const redisStart = Date.now();
    await RedisService.healthCheck();
    result.checks.redis = {
      status: 'healthy',
      responseTime: Date.now() - redisStart,
    };
  } catch (error) {
    result.checks.redis = {
      status: 'unhealthy',
      error: error.message,
    };
    result.status = result.status === 'healthy' ? 'degraded' : 'unhealthy';
  }

  // Payment gateway health check
  try {
    const paymentStart = Date.now();
    await PaymentService.healthCheck();
    result.checks.payment = {
      status: 'healthy',
      responseTime: Date.now() - paymentStart,
    };
  } catch (error) {
    result.checks.payment = {
      status: 'unhealthy',
      error: error.message,
    };
    result.status = result.status === 'healthy' ? 'degraded' : result.status;
  }

  // AI service health check
  try {
    const aiStart = Date.now();
    await AIService.healthCheck();
    result.checks.ai = {
      status: 'healthy',
      responseTime: Date.now() - aiStart,
    };
  } catch (error) {
    result.checks.ai = {
      status: 'unhealthy',
      error: error.message,
    };
    // AI service degradation doesn't mark overall service as unhealthy
    if (result.status === 'healthy') {
      result.status = 'degraded';
    }
  }

  // Memory and CPU usage
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  result.checks.system = {
    status: 'healthy',
    details: {
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
    },
  };

  const statusCode = result.status === 'healthy' ? 200 : 
                    result.status === 'degraded' ? 200 : 503;

  res.status(statusCode).json(result);
});

// Readiness check for Kubernetes
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check if app is ready to receive traffic
    await DatabaseService.ping();
    await RedisService.ping();
    
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Liveness check for Kubernetes
router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
```

This comprehensive deployment and DevOps guide provides development teams with detailed infrastructure automation, CI/CD pipelines, monitoring solutions, and production maintenance procedures for successfully deploying and operating the Coaching Management Mobile App at scale.