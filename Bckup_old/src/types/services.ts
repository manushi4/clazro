/**
 * Service Type Definitions
 * Type definitions for service classes
 */

export interface AdaptiveLearningPathService {
  analyzeUserPerformance: (userId: string) => Promise<any>;
  getStatus: () => Promise<{ health: string; [key: string]: any }>;
}

export interface AdvancedAIDecisionEngine {
  getStatus: () => Promise<{ health: string; [key: string]: any }>;
}

export interface IntelligentWorkflowAutomationService {
  getStatus: () => Promise<{ health: string; [key: string]: any }>;
}

export interface ProactiveSystemOptimizerService {
  getStatus: () => Promise<{ health: string; [key: string]: any }>;
}

export interface RealTimeCollaborationService {
  on: (event: string, handler: (...args: any[]) => void) => void;
  off: (event: string, handler: (...args: any[]) => void) => void;
  removeAllListeners: (event?: string) => void;
}

export interface NotificationService {
  removeAllListeners: (event?: string) => void;
}

export interface VideoCallService {
  removeAllListeners: (event?: string) => void;
}
