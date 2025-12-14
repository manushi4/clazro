import { logAuditEvent, AuditEventType } from '../auditLogger';
import { supabase } from '../../lib/supabase';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  },
}));

describe('auditLogger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should log user deletion event', async () => {
    const mockInsert = jest.fn().mockResolvedValue({ data: {}, error: null });
    (supabase.from as jest.Mock).mockReturnValue({
      insert: mockInsert,
    });

    await logAuditEvent({
      action: AuditEventType.USER_DELETED,
      entityType: 'parent',
      entityId: 'user-123',
      details: { reason: 'Account deactivation requested' },
    });

    expect(mockInsert).toHaveBeenCalledWith({
      action: 'user_deleted',
      entity_type: 'parent',
      entity_id: 'user-123',
      details: { reason: 'Account deactivation requested' },
      ip_address: null,
      user_agent: null,
    });
  });

  it('should throw error when audit logging fails', async () => {
    const mockInsert = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    });
    (supabase.from as jest.Mock).mockReturnValue({
      insert: mockInsert,
    });

    await expect(
      logAuditEvent({
        action: AuditEventType.FEE_WAIVED,
        entityType: 'fee',
        entityId: 'fee-456',
        details: { amount: 5000 },
      })
    ).rejects.toThrow('Failed to log audit event');
  });
});
