/**
 * Live Class Service
 * Handles live class participation, real-time chat, polls, and collaboration features
 *
 * NOTE: Currently using mock data. Will integrate with Stream.io and Supabase once:
 * - Stream.io for real-time chat and video
 * - Supabase for class data, polls, and participant tracking
 * - Realtime subscriptions for live updates
 */

export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

// ==================== INTERFACES ====================

export interface ChatMessage {
  id: string;
  sender: string;
  senderRole: 'student' | 'teacher';
  message: string;
  timestamp: string;
  type: 'text' | 'image' | 'file' | 'poll_response';
}

export interface Poll {
  id: string;
  question: string;
  options: string[];
  responses: {[key: string]: number};
  totalResponses: number;
  userResponse?: string;
  isActive: boolean;
  timeRemaining: number;
}

export interface HandRaise {
  id: string;
  studentName: string;
  timestamp: string;
  question: string;
  status: 'raised' | 'acknowledged' | 'answered';
}

export interface Participant {
  id: string;
  name: string;
  role: 'student' | 'teacher';
  isOnline: boolean;
  isMuted: boolean;
  hasVideo: boolean;
  handRaised: boolean;
}

export interface ClassInfo {
  id: string;
  title: string;
  teacher: string;
  subject: string;
  duration: string;
  participantCount: number;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'live' | 'ended';
}

// ==================== MOCK DATA ====================

const mockChatMessages: ChatMessage[] = [
  {
    id: '1',
    sender: 'Prof. Sarah Johnson',
    senderRole: 'teacher',
    message: 'Welcome to today\'s calculus session! We\'ll be covering derivatives and their applications.',
    timestamp: '10:00 AM',
    type: 'text',
  },
  {
    id: '2',
    sender: 'Alex Parker',
    senderRole: 'student',
    message: 'Good morning professor! Looking forward to learning about derivatives.',
    timestamp: '10:01 AM',
    type: 'text',
  },
  {
    id: '3',
    sender: 'Prof. Sarah Johnson',
    senderRole: 'teacher',
    message: 'Let\'s start with a quick poll to assess your current understanding.',
    timestamp: '10:02 AM',
    type: 'text',
  },
];

const mockPoll: Poll = {
  id: '1',
  question: 'What is the derivative of x²?',
  options: ['2x', 'x²', '2x²', '2'],
  responses: {'2x': 15, 'x²': 3, '2x²': 4, '2': 2},
  totalResponses: 24,
  isActive: true,
  timeRemaining: 45,
};

const mockParticipants: Participant[] = [
  {
    id: '1',
    name: 'Prof. Sarah Johnson',
    role: 'teacher',
    isOnline: true,
    isMuted: false,
    hasVideo: true,
    handRaised: false,
  },
  {
    id: '2',
    name: 'Alex Parker',
    role: 'student',
    isOnline: true,
    isMuted: true,
    hasVideo: false,
    handRaised: false,
  },
  {
    id: '3',
    name: 'Sarah Chen',
    role: 'student',
    isOnline: true,
    isMuted: true,
    hasVideo: true,
    handRaised: true,
  },
  {
    id: '4',
    name: 'Mike Johnson',
    role: 'student',
    isOnline: false,
    isMuted: true,
    hasVideo: false,
    handRaised: false,
  },
];

const mockHandRaises: HandRaise[] = [
  {
    id: '1',
    studentName: 'Sarah Chen',
    timestamp: '10:05 AM',
    question: 'Can you explain the chain rule again?',
    status: 'raised',
  },
];

// ==================== SERVICE FUNCTIONS ====================

/**
 * Get live class information
 */
export const getClassInfo = async (
  classId: string
): Promise<ServiceResponse<ClassInfo>> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 300));

    const classInfo: ClassInfo = {
      id: classId,
      title: 'Advanced Mathematics',
      teacher: 'Prof. Sarah Johnson',
      subject: 'Calculus - Derivatives',
      duration: '1:30:00',
      participantCount: 24,
      startTime: '10:00 AM',
      endTime: '11:30 AM',
      status: 'live',
    };

    return { data: classInfo, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Get chat messages for a live class
 */
export const getChatMessages = async (
  classId: string,
  limit: number = 50
): Promise<ServiceResponse<ChatMessage[]>> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 200));

    return { data: [...mockChatMessages], error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Send a chat message
 */
export const sendChatMessage = async (
  classId: string,
  message: string,
  senderName: string
): Promise<ServiceResponse<ChatMessage>> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 200));

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: senderName,
      senderRole: 'student',
      message: message,
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}),
      type: 'text',
    };

    return { data: newMessage, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Get current active poll
 */
export const getCurrentPoll = async (
  classId: string
): Promise<ServiceResponse<Poll | null>> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 200));

    return { data: mockPoll, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Respond to a poll
 */
export const respondToPoll = async (
  pollId: string,
  option: string,
  studentId: string
): Promise<ServiceResponse<boolean>> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 200));

    return { data: true, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Get class participants
 */
export const getParticipants = async (
  classId: string
): Promise<ServiceResponse<Participant[]>> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 200));

    return { data: [...mockParticipants], error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Get hand raises
 */
export const getHandRaises = async (
  classId: string
): Promise<ServiceResponse<HandRaise[]>> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 200));

    return { data: [...mockHandRaises], error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Raise hand with optional question
 */
export const raiseHand = async (
  classId: string,
  studentName: string,
  question: string = ''
): Promise<ServiceResponse<HandRaise>> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 200));

    const handRaise: HandRaise = {
      id: Date.now().toString(),
      studentName: studentName,
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}),
      question: question,
      status: 'raised',
    };

    return { data: handRaise, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Lower hand
 */
export const lowerHand = async (
  classId: string,
  studentId: string
): Promise<ServiceResponse<boolean>> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 200));

    return { data: true, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Get comprehensive live class data
 */
export const getLiveClassData = async (
  classId: string,
  studentId: string
): Promise<ServiceResponse<{
  classInfo: ClassInfo;
  chatMessages: ChatMessage[];
  currentPoll: Poll | null;
  participants: Participant[];
  handRaises: HandRaise[];
}>> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 400));

    const [classInfoResult, chatResult, pollResult, participantsResult, handRaisesResult] = await Promise.all([
      getClassInfo(classId),
      getChatMessages(classId),
      getCurrentPoll(classId),
      getParticipants(classId),
      getHandRaises(classId),
    ]);

    if (!classInfoResult.success || !chatResult.success || !pollResult.success ||
        !participantsResult.success || !handRaisesResult.success) {
      return {
        data: null,
        error: 'Failed to load some live class data',
        success: false,
      };
    }

    return {
      data: {
        classInfo: classInfoResult.data!,
        chatMessages: chatResult.data!,
        currentPoll: pollResult.data,
        participants: participantsResult.data!,
        handRaises: handRaisesResult.data!,
      },
      error: null,
      success: true,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};
