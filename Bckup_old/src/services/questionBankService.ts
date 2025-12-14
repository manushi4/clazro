/**
 * Question Bank Service
 * Handles question bank and question management operations
 *
 * NOTE: Currently using mock data. Will integrate with Supabase
 * once questions table is created in the database.
 */

export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface Question {
  id: string;
  question: string;
  type: 'multiple_choice' | 'short_answer' | 'essay' | 'true_false' | 'fill_blank';
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  options?: string[];
  correctAnswer?: string | number;
  explanation?: string;
  tags: string[];
  createdBy: string;
  createdAt: string;
  usageCount: number;
  rating: number;
  points: number;
  timeLimit?: number;
}

export interface QuestionBank {
  id: string;
  name: string;
  description: string;
  subject: string;
  questionCount: number;
  createdBy: string;
  isPublic: boolean;
  tags: string[];
}

export interface QuestionFilters {
  subject?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  type?: 'multiple_choice' | 'short_answer' | 'essay' | 'true_false' | 'fill_blank';
  topic?: string;
  tags?: string[];
  search?: string;
}

// Mock data storage (in-memory)
let mockQuestions: Question[] = [
  {
    id: '1',
    question: 'What is the derivative of x²?',
    type: 'multiple_choice',
    subject: 'Mathematics',
    difficulty: 'medium',
    topic: 'Calculus',
    options: ['2x', 'x²', '2x²', 'x'],
    correctAnswer: 0,
    explanation: 'Using the power rule: d/dx(x²) = 2x¹ = 2x',
    tags: ['derivatives', 'calculus', 'power-rule'],
    createdBy: 'Dr. Smith',
    createdAt: '2024-12-15',
    usageCount: 45,
    rating: 4.8,
    points: 5,
    timeLimit: 120,
  },
  {
    id: '2',
    question: 'Explain the concept of photosynthesis and its significance in the ecosystem.',
    type: 'essay',
    subject: 'Biology',
    difficulty: 'hard',
    topic: 'Plant Biology',
    explanation: 'Should cover light-dependent and light-independent reactions, importance to food chain, oxygen production.',
    tags: ['photosynthesis', 'plants', 'ecosystem'],
    createdBy: 'Prof. Johnson',
    createdAt: '2024-12-14',
    usageCount: 23,
    rating: 4.6,
    points: 15,
    timeLimit: 1800,
  },
  {
    id: '3',
    question: 'The mitochondria is known as the _____ of the cell.',
    type: 'fill_blank',
    subject: 'Biology',
    difficulty: 'easy',
    topic: 'Cell Biology',
    correctAnswer: 'powerhouse',
    tags: ['cell-biology', 'organelles'],
    createdBy: 'Ms. Davis',
    createdAt: '2024-12-13',
    usageCount: 67,
    rating: 4.9,
    points: 3,
    timeLimit: 60,
  },
  {
    id: '4',
    question: 'Which of the following is NOT a Newton\'s law of motion?',
    type: 'multiple_choice',
    subject: 'Physics',
    difficulty: 'medium',
    topic: 'Mechanics',
    options: [
      'Law of Inertia',
      'F = ma',
      'Action-Reaction',
      'Law of Conservation of Energy'
    ],
    correctAnswer: 3,
    explanation: 'Law of Conservation of Energy is a separate principle, not one of Newton\'s three laws of motion.',
    tags: ['newton', 'mechanics', 'physics'],
    createdBy: 'Dr. Patel',
    createdAt: '2024-12-12',
    usageCount: 34,
    rating: 4.7,
    points: 5,
    timeLimit: 90,
  },
  {
    id: '5',
    question: 'What is the chemical formula for water?',
    type: 'short_answer',
    subject: 'Chemistry',
    difficulty: 'easy',
    topic: 'Basic Chemistry',
    correctAnswer: 'H2O',
    tags: ['chemistry', 'molecules', 'basic'],
    createdBy: 'Ms. Kumar',
    createdAt: '2024-12-11',
    usageCount: 89,
    rating: 4.9,
    points: 2,
    timeLimit: 30,
  },
];

let mockQuestionBanks: QuestionBank[] = [
  {
    id: '1',
    name: 'JEE Mathematics Question Bank',
    description: 'Comprehensive collection of JEE-level mathematics questions',
    subject: 'Mathematics',
    questionCount: 1250,
    createdBy: 'Dr. Sharma',
    isPublic: true,
    tags: ['jee', 'mathematics', 'competitive'],
  },
  {
    id: '2',
    name: 'NEET Biology Essentials',
    description: 'Essential biology questions for NEET preparation',
    subject: 'Biology',
    questionCount: 890,
    createdBy: 'Prof. Kumar',
    isPublic: true,
    tags: ['neet', 'biology', 'medical'],
  },
  {
    id: '3',
    name: 'CBSE Class 11 Physics',
    description: 'Complete question bank for CBSE Class 11 Physics curriculum',
    subject: 'Physics',
    questionCount: 456,
    createdBy: 'Dr. Verma',
    isPublic: true,
    tags: ['cbse', 'class-11', 'physics'],
  },
];

/**
 * Get all questions with optional filtering
 */
export const getQuestions = async (
  filters?: QuestionFilters
): Promise<ServiceResponse<Question[]>> => {
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    let filteredQuestions = [...mockQuestions];

    if (filters) {
      if (filters.subject && filters.subject !== 'all') {
        filteredQuestions = filteredQuestions.filter(q => q.subject === filters.subject);
      }
      if (filters.difficulty && filters.difficulty !== 'all') {
        filteredQuestions = filteredQuestions.filter(q => q.difficulty === filters.difficulty);
      }
      if (filters.type && filters.type !== 'all') {
        filteredQuestions = filteredQuestions.filter(q => q.type === filters.type);
      }
      if (filters.topic && filters.topic !== 'all') {
        filteredQuestions = filteredQuestions.filter(q => q.topic === filters.topic);
      }
      if (filters.tags && filters.tags.length > 0) {
        filteredQuestions = filteredQuestions.filter(q =>
          filters.tags!.some(tag => q.tags.includes(tag))
        );
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredQuestions = filteredQuestions.filter(q =>
          q.question.toLowerCase().includes(searchLower) ||
          q.topic.toLowerCase().includes(searchLower) ||
          q.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }
    }

    return { data: filteredQuestions, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Get a single question by ID
 */
export const getQuestionById = async (
  questionId: string
): Promise<ServiceResponse<Question>> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 200));

    const question = mockQuestions.find(q => q.id === questionId);

    if (!question) {
      return { data: null, error: 'Question not found', success: false };
    }

    // Increment usage count (simulated)
    question.usageCount += 1;

    return { data: question, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Create a new question
 */
export const createQuestion = async (
  questionData: Omit<Question, 'id' | 'usageCount' | 'rating' | 'createdAt'>
): Promise<ServiceResponse<Question>> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 300));

    const newQuestion: Question = {
      ...questionData,
      id: Date.now().toString(),
      usageCount: 0,
      rating: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };

    mockQuestions.unshift(newQuestion);

    return { data: newQuestion, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Update an existing question
 */
export const updateQuestion = async (
  questionId: string,
  updates: Partial<Question>
): Promise<ServiceResponse<Question>> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 300));

    const questionIndex = mockQuestions.findIndex(q => q.id === questionId);

    if (questionIndex === -1) {
      return { data: null, error: 'Question not found', success: false };
    }

    mockQuestions[questionIndex] = {
      ...mockQuestions[questionIndex],
      ...updates,
      id: questionId, // Prevent ID from being changed
    };

    return { data: mockQuestions[questionIndex], error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Delete a question
 */
export const deleteQuestion = async (
  questionId: string
): Promise<ServiceResponse<boolean>> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 300));

    const questionIndex = mockQuestions.findIndex(q => q.id === questionId);

    if (questionIndex === -1) {
      return { data: null, error: 'Question not found', success: false };
    }

    mockQuestions.splice(questionIndex, 1);

    return { data: true, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Get questions by subject
 */
export const getQuestionsBySubject = async (
  subject: string
): Promise<ServiceResponse<Question[]>> => {
  return getQuestions({ subject });
};

/**
 * Get questions by difficulty
 */
export const getQuestionsByDifficulty = async (
  difficulty: 'easy' | 'medium' | 'hard'
): Promise<ServiceResponse<Question[]>> => {
  return getQuestions({ difficulty });
};

/**
 * Search questions by query string
 */
export const searchQuestions = async (
  query: string
): Promise<ServiceResponse<Question[]>> => {
  return getQuestions({ search: query });
};

/**
 * Get all question banks
 */
export const getQuestionBanks = async (): Promise<ServiceResponse<QuestionBank[]>> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 300));

    return { data: mockQuestionBanks, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Get a single question bank by ID
 */
export const getQuestionBankById = async (
  bankId: string
): Promise<ServiceResponse<QuestionBank>> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 200));

    const bank = mockQuestionBanks.find(b => b.id === bankId);

    if (!bank) {
      return { data: null, error: 'Question bank not found', success: false };
    }

    return { data: bank, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Get questions from a specific question bank
 */
export const getQuestionsFromBank = async (
  bankId: string
): Promise<ServiceResponse<Question[]>> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 300));

    const bank = mockQuestionBanks.find(b => b.id === bankId);

    if (!bank) {
      return { data: null, error: 'Question bank not found', success: false };
    }

    // Filter questions by the bank's subject
    const questions = mockQuestions.filter(q => q.subject === bank.subject);

    return { data: questions, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Get user's created questions
 */
export const getUserQuestions = async (
  userId: string
): Promise<ServiceResponse<Question[]>> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 300));

    const userQuestions = mockQuestions.filter(q => q.createdBy === userId);

    return { data: userQuestions, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};
