/**
 * Live Document Sharing Service
 * Phase 77: Advanced Real-Time Collaboration & Communication Suite
 * Enables real-time document collaboration and sharing
 */

import { supabase } from '../../lib/supabase';
import { logger } from '../utils/logger';
import { realTimeCollaborationService } from '../collaboration/RealTimeCollaborationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SharedDocument {
  id: string;
  title: string;
  content: string;
  document_type: 'text' | 'markdown' | 'code' | 'whiteboard' | 'presentation';
  owner_id: string;
  owner_name: string;
  collaboration_session_id?: string;
  permissions: DocumentPermissions;
  version: number;
  created_at: string;
  updated_at: string;
  last_edited_by?: string;
  is_template: boolean;
  is_archived: boolean;
  metadata: DocumentMetadata;
}

export interface DocumentPermissions {
  is_public: boolean;
  allow_comments: boolean;
  allow_suggestions: boolean;
  require_approval_for_edits: boolean;
  allowed_user_roles: string[];
  collaborator_permissions: CollaboratorPermission[];
}

export interface CollaboratorPermission {
  user_id: string;
  user_name: string;
  user_role: string;
  permission_level: 'view' | 'comment' | 'edit' | 'admin';
  granted_at: string;
  granted_by: string;
}

export interface DocumentMetadata {
  subject?: string;
  tags?: string[];
  language?: string;
  file_size: number;
  word_count: number;
  character_count: number;
  estimated_reading_time: number;
  last_export_format?: string;
  auto_save_enabled: boolean;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  content: string;
  changes_summary: string;
  created_by: string;
  created_by_name: string;
  created_at: string;
  is_major_version: boolean;
  commit_message?: string;
}

export interface DocumentComment {
  id: string;
  document_id: string;
  content: string;
  position: DocumentPosition;
  author_id: string;
  author_name: string;
  author_role: string;
  created_at: string;
  updated_at?: string;
  resolved_at?: string;
  resolved_by?: string;
  replies: DocumentComment[];
  is_suggestion: boolean;
  suggestion_content?: string;
}

export interface DocumentPosition {
  type: 'text' | 'line' | 'selection';
  line_number?: number;
  character_position?: number;
  selection_start?: number;
  selection_end?: number;
  context?: string;
}

export interface DocumentChange {
  id: string;
  document_id: string;
  user_id: string;
  user_name: string;
  operation: 'insert' | 'delete' | 'replace' | 'format';
  position: number;
  length: number;
  content: string;
  timestamp: string;
  applied: boolean;
  version_before: number;
  version_after: number;
}

export interface DocumentExportOptions {
  format: 'pdf' | 'docx' | 'html' | 'markdown' | 'txt' | 'json';
  include_comments: boolean;
  include_version_history: boolean;
  include_collaborator_info: boolean;
  page_settings?: {
    size: 'A4' | 'Letter' | 'Legal';
    orientation: 'portrait' | 'landscape';
    margins: { top: number; right: number; bottom: number; left: number };
  };
}

export interface WhiteboardElement {
  id: string;
  type: 'text' | 'shape' | 'line' | 'image' | 'sticky_note';
  position: { x: number; y: number };
  dimensions: { width: number; height: number };
  content: string;
  style: {
    color: string;
    backgroundColor: string;
    fontSize?: number;
    fontWeight?: string;
    borderColor?: string;
    borderWidth?: number;
  };
  created_by: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

class LiveDocumentSharingService {
  private isInitialized = false;
  private activeDocuments: Map<string, SharedDocument> = new Map();
  private documentCache: Map<string, string> = new Map();
  private autoSaveTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      this.isInitialized = true;
      logger.info('Live document sharing service initialized');
    } catch (error) {
      logger.error('Failed to initialize document sharing service:', error);
    }
  }

  /**
   * Create a new shared document
   */
  public async createDocument(
    title: string,
    documentType: SharedDocument['document_type'],
    initialContent = '',
    permissions: Partial<DocumentPermissions> = {},
    metadata: Partial<DocumentMetadata> = {}
  ): Promise<SharedDocument> {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        throw new Error('User must be logged in to create documents');
      }

      const defaultPermissions: DocumentPermissions = {
        is_public: false,
        allow_comments: true,
        allow_suggestions: true,
        require_approval_for_edits: false,
        allowed_user_roles: ['student', 'teacher', 'admin'],
        collaborator_permissions: [{
          user_id: currentUser.id,
          user_name: currentUser.name,
          user_role: currentUser.role,
          permission_level: 'admin',
          granted_at: new Date().toISOString(),
          granted_by: currentUser.id,
        }],
        ...permissions,
      };

      const defaultMetadata: DocumentMetadata = {
        tags: [],
        file_size: new Blob([initialContent]).size,
        word_count: initialContent.split(/\s+/).filter(word => word.length > 0).length,
        character_count: initialContent.length,
        estimated_reading_time: Math.ceil(initialContent.split(/\s+/).length / 200),
        auto_save_enabled: true,
        ...metadata,
      };

      const documentData = {
        title,
        content: initialContent,
        document_type: documentType,
        owner_id: currentUser.id,
        owner_name: currentUser.name,
        permissions: defaultPermissions,
        version: 1,
        is_template: false,
        is_archived: false,
        metadata: defaultMetadata,
      };

      const { data: document, error } = await supabase
        .from('shared_documents')
        .insert(documentData)
        .select()
        .single();

      if (error) throw error;

      // Create initial version
      await this.createDocumentVersion(
        document.id,
        1,
        initialContent,
        'Initial document creation',
        currentUser.id,
        currentUser.name,
        true,
        'Document created'
      );

      this.activeDocuments.set(document.id, document);
      this.emit('document_created', document);

      logger.info(`Shared document created: ${document.id}`);
      return document;
    } catch (error) {
      logger.error('Failed to create shared document:', error);
      throw error;
    }
  }

  /**
   * Open a document for collaboration
   */
  public async openDocument(documentId: string): Promise<SharedDocument> {
    try {
      // Check if already in cache
      if (this.activeDocuments.has(documentId)) {
        return this.activeDocuments.get(documentId)!;
      }

      const { data: document, error } = await supabase
        .from('shared_documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error) throw error;

      // Check permissions
      const hasAccess = await this.checkDocumentAccess(document);
      if (!hasAccess) {
        throw new Error('User does not have access to this document');
      }

      // Create or join collaboration session
      let collaborationSession;
      if (document.collaboration_session_id) {
        collaborationSession = await realTimeCollaborationService.joinSession(
          document.collaboration_session_id
        );
      } else {
        collaborationSession = await realTimeCollaborationService.createSession(
          `Document: ${document.title}`,
          'document_review',
          {
            max_participants: 50,
            enable_chat: true,
            enable_voice: false,
            enable_video: false,
            record_session: false,
          }
        );

        // Update document with collaboration session
        await supabase
          .from('shared_documents')
          .update({ collaboration_session_id: collaborationSession.id })
          .eq('id', documentId);

        document.collaboration_session_id = collaborationSession.id;
      }

      this.activeDocuments.set(documentId, document);
      this.documentCache.set(documentId, document.content);

      this.emit('document_opened', document);
      logger.info(`Document opened: ${documentId}`);

      return document;
    } catch (error) {
      logger.error('Failed to open document:', error);
      throw error;
    }
  }

  /**
   * Update document content
   */
  public async updateDocumentContent(
    documentId: string,
    content: string,
    autoSave = true
  ): Promise<void> {
    try {
      const document = this.activeDocuments.get(documentId);
      if (!document) {
        throw new Error('Document not found in active documents');
      }

      // Check edit permissions
      const canEdit = await this.checkEditPermission(document);
      if (!canEdit) {
        throw new Error('User does not have permission to edit this document');
      }

      // Update cache
      const oldContent = this.documentCache.get(documentId) || '';
      this.documentCache.set(documentId, content);

      // Calculate metadata
      const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
      const characterCount = content.length;
      const estimatedReadingTime = Math.ceil(wordCount / 200);

      // Update document metadata
      document.metadata = {
        ...document.metadata,
        word_count: wordCount,
        character_count: characterCount,
        estimated_reading_time: estimatedReadingTime,
        file_size: new Blob([content]).size,
      };

      // Send collaborative change if there's a collaboration session
      if (document.collaboration_session_id && oldContent !== content) {
        const change = this.calculateDocumentChange(oldContent, content);
        if (change) {
          await realTimeCollaborationService.applyDocumentChange(
            document.collaboration_session_id,
            change
          );
        }
      }

      if (autoSave && document.metadata.auto_save_enabled) {
        // Clear existing auto-save timeout
        const existingTimeout = this.autoSaveTimeouts.get(documentId);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        // Set new auto-save timeout
        const timeout = setTimeout(() => {
          this.saveDocument(documentId);
        }, 2000);

        this.autoSaveTimeouts.set(documentId, timeout);
      }

      this.emit('document_content_updated', { documentId, content });
    } catch (error) {
      logger.error('Failed to update document content:', error);
      throw error;
    }
  }

  /**
   * Save document to database
   */
  public async saveDocument(documentId: string, createVersion = false): Promise<void> {
    try {
      const document = this.activeDocuments.get(documentId);
      const content = this.documentCache.get(documentId);

      if (!document || !content) {
        throw new Error('Document or content not found');
      }

      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        throw new Error('User must be logged in to save documents');
      }

      // Update document in database
      const { error } = await supabase
        .from('shared_documents')
        .update({
          content,
          metadata: document.metadata,
          version: document.version + (createVersion ? 1 : 0),
          updated_at: new Date().toISOString(),
          last_edited_by: currentUser.id,
        })
        .eq('id', documentId);

      if (error) throw error;

      // Create version if requested
      if (createVersion) {
        await this.createDocumentVersion(
          documentId,
          document.version + 1,
          content,
          'Auto-save version',
          currentUser.id,
          currentUser.name
        );
        document.version += 1;
      }

      // Clear auto-save timeout
      const timeout = this.autoSaveTimeouts.get(documentId);
      if (timeout) {
        clearTimeout(timeout);
        this.autoSaveTimeouts.delete(documentId);
      }

      this.emit('document_saved', { documentId, version: document.version });
      logger.info(`Document saved: ${documentId}`);
    } catch (error) {
      logger.error('Failed to save document:', error);
      throw error;
    }
  }

  /**
   * Add comment to document
   */
  public async addComment(
    documentId: string,
    content: string,
    position: DocumentPosition,
    isSuggestion = false,
    suggestionContent?: string
  ): Promise<DocumentComment> {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        throw new Error('User must be logged in to add comments');
      }

      const commentData = {
        document_id: documentId,
        content,
        position,
        author_id: currentUser.id,
        author_name: currentUser.name,
        author_role: currentUser.role,
        replies: [],
        is_suggestion: isSuggestion,
        suggestion_content: suggestionContent,
      };

      const { data: comment, error } = await supabase
        .from('document_comments')
        .insert(commentData)
        .select()
        .single();

      if (error) throw error;

      this.emit('comment_added', comment);
      return comment;
    } catch (error) {
      logger.error('Failed to add document comment:', error);
      throw error;
    }
  }

  /**
   * Get document comments
   */
  public async getDocumentComments(documentId: string): Promise<DocumentComment[]> {
    try {
      const { data: comments, error } = await supabase
        .from('document_comments')
        .select('*')
        .eq('document_id', documentId)
        .is('resolved_at', null)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return comments || [];
    } catch (error) {
      logger.error('Failed to get document comments:', error);
      return [];
    }
  }

  /**
   * Get document versions
   */
  public async getDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
    try {
      const { data: versions, error } = await supabase
        .from('document_versions')
        .select('*')
        .eq('document_id', documentId)
        .order('version_number', { ascending: false })
        .limit(20);

      if (error) throw error;
      return versions || [];
    } catch (error) {
      logger.error('Failed to get document versions:', error);
      return [];
    }
  }

  /**
   * Export document
   */
  public async exportDocument(
    documentId: string,
    options: DocumentExportOptions
  ): Promise<string> {
    try {
      const document = this.activeDocuments.get(documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      // Check export permissions
      const canExport = await this.checkDocumentAccess(document);
      if (!canExport) {
        throw new Error('User does not have permission to export this document');
      }

      let exportContent = document.content;
      let exportData: any = {
        title: document.title,
        content: exportContent,
        metadata: document.metadata,
        exported_at: new Date().toISOString(),
        exported_by: await this.getCurrentUser(),
      };

      if (options.include_comments) {
        const comments = await this.getDocumentComments(documentId);
        exportData.comments = comments;
      }

      if (options.include_version_history) {
        const versions = await this.getDocumentVersions(documentId);
        exportData.version_history = versions;
      }

      if (options.include_collaborator_info) {
        exportData.collaborators = document.permissions.collaborator_permissions;
      }

      // Format based on export type
      switch (options.format) {
        case 'json':
          return JSON.stringify(exportData, null, 2);
        
        case 'markdown':
          return this.formatAsMarkdown(exportData);
        
        case 'html':
          return this.formatAsHTML(exportData);
        
        case 'txt':
          return exportContent;
        
        default:
          return exportContent;
      }
    } catch (error) {
      logger.error('Failed to export document:', error);
      throw error;
    }
  }

  /**
   * Create whiteboard element
   */
  public async createWhiteboardElement(
    documentId: string,
    element: Omit<WhiteboardElement, 'id' | 'created_by' | 'created_by_name' | 'created_at' | 'updated_at'>
  ): Promise<WhiteboardElement> {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        throw new Error('User must be logged in to create whiteboard elements');
      }

      const elementData = {
        document_id: documentId,
        ...element,
        created_by: currentUser.id,
        created_by_name: currentUser.name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: whiteboardElement, error } = await supabase
        .from('whiteboard_elements')
        .insert(elementData)
        .select()
        .single();

      if (error) throw error;

      this.emit('whiteboard_element_created', whiteboardElement);
      return whiteboardElement;
    } catch (error) {
      logger.error('Failed to create whiteboard element:', error);
      throw error;
    }
  }

  /**
   * Get shared documents for user
   */
  public async getUserDocuments(): Promise<SharedDocument[]> {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) return [];

      const { data: documents, error } = await supabase
        .from('shared_documents')
        .select('*')
        .or(`owner_id.eq.${currentUser.id},permissions->collaborator_permissions.cs.[{"user_id":"${currentUser.id}"}]`)
        .eq('is_archived', false)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return documents || [];
    } catch (error) {
      logger.error('Failed to get user documents:', error);
      return [];
    }
  }

  /**
   * Add event listener
   */
  public addEventListener(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  public removeEventListener(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Private helper methods

  private async getCurrentUser(): Promise<{ id: string; name: string; role: string } | null> {
    try {
      const userDataString = await AsyncStorage.getItem('user_data');
      if (!userDataString) return null;

      const userData = JSON.parse(userDataString);
      return {
        id: userData.id || `user_${Date.now()}`,
        name: `${userData.firstName || 'User'} ${userData.lastName || ''}`.trim(),
        role: userData.role || 'student',
      };
    } catch (error) {
      logger.error('Failed to get current user:', error);
      return null;
    }
  }

  private async checkDocumentAccess(document: SharedDocument): Promise<boolean> {
    try {
      if (document.permissions.is_public) return true;

      const currentUser = await this.getCurrentUser();
      if (!currentUser) return false;

      if (document.owner_id === currentUser.id) return true;

      return document.permissions.collaborator_permissions.some(
        collab => collab.user_id === currentUser.id
      );
    } catch (error) {
      return false;
    }
  }

  private async checkEditPermission(document: SharedDocument): Promise<boolean> {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) return false;

      if (document.owner_id === currentUser.id) return true;

      const collaborator = document.permissions.collaborator_permissions.find(
        collab => collab.user_id === currentUser.id
      );

      return collaborator?.permission_level === 'edit' || collaborator?.permission_level === 'admin';
    } catch (error) {
      return false;
    }
  }

  private calculateDocumentChange(oldContent: string, newContent: string): any | null {
    // Simple diff algorithm - in a real implementation you'd use a more sophisticated diff
    if (oldContent === newContent) return null;

    // Find first difference
    let position = 0;
    const minLength = Math.min(oldContent.length, newContent.length);
    
    for (let i = 0; i < minLength; i++) {
      if (oldContent[i] !== newContent[i]) {
        position = i;
        break;
      }
    }

    if (newContent.length > oldContent.length) {
      return {
        type: 'insert' as const,
        position,
        length: 0,
        content: newContent.slice(position, position + (newContent.length - oldContent.length)),
      };
    } else if (newContent.length < oldContent.length) {
      return {
        type: 'delete' as const,
        position,
        length: oldContent.length - newContent.length,
        content: '',
      };
    } else {
      return {
        type: 'replace' as const,
        position,
        length: oldContent.slice(position).length,
        content: newContent.slice(position),
      };
    }
  }

  private async createDocumentVersion(
    documentId: string,
    versionNumber: number,
    content: string,
    changesSummary: string,
    createdBy: string,
    createdByName: string,
    isMajorVersion = false,
    commitMessage?: string
  ): Promise<void> {
    try {
      const versionData = {
        document_id: documentId,
        version_number: versionNumber,
        content,
        changes_summary: changesSummary,
        created_by: createdBy,
        created_by_name: createdByName,
        is_major_version: isMajorVersion,
        commit_message: commitMessage,
      };

      const { error } = await supabase
        .from('document_versions')
        .insert(versionData);

      if (error) throw error;
    } catch (error) {
      logger.error('Failed to create document version:', error);
    }
  }

  private formatAsMarkdown(data: any): string {
    let markdown = `# ${data.title}\n\n`;
    markdown += `${data.content}\n\n`;
    
    if (data.comments && data.comments.length > 0) {
      markdown += `## Comments\n\n`;
      data.comments.forEach((comment: DocumentComment) => {
        markdown += `**${comment.author_name}**: ${comment.content}\n\n`;
      });
    }
    
    return markdown;
  }

  private formatAsHTML(data: any): string {
    let html = `<!DOCTYPE html><html><head><title>${data.title}</title></head><body>`;
    html += `<h1>${data.title}</h1>`;
    html += `<div>${data.content.replace(/\n/g, '<br>')}</div>`;
    
    if (data.comments && data.comments.length > 0) {
      html += `<h2>Comments</h2>`;
      data.comments.forEach((comment: DocumentComment) => {
        html += `<div><strong>${comment.author_name}:</strong> ${comment.content}</div>`;
      });
    }
    
    html += `</body></html>`;
    return html;
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          logger.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }
}

// Export singleton instance
export const liveDocumentSharingService = new LiveDocumentSharingService();
export default LiveDocumentSharingService;