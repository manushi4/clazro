import { supabase } from '../database/supabase';
import { realtimeConnection } from './RealtimeConnectionManager';
import { logger } from '../utils/logger';

export interface Poll {
  id: string;
  session_id?: string;
  room_id?: string;
  creator_id: string;
  title: string;
  description?: string;
  poll_type: 'multiple_choice' | 'single_choice' | 'open_text' | 'rating' | 'yes_no';
  is_anonymous: boolean;
  allow_multiple_responses: boolean;
  show_results_immediately: boolean;
  starts_at: string;
  ends_at?: string;
  duration_seconds?: number;
  status: 'draft' | 'active' | 'paused' | 'ended' | 'cancelled';
  options: PollOption[];
  correct_answers?: string[];
  created_at: string;
  updated_at: string;
  creator?: {
    id: string;
    full_name?: string;
    avatar_url?: string;
  };
  responses?: PollResponse[];
  response_count?: number;
  my_response?: PollResponse;
  results?: PollResults;
}

export interface PollOption {
  id: string;
  text: string;
  image_url?: string;
  is_correct?: boolean;
}

export interface PollResponse {
  id: string;
  poll_id: string;
  user_id?: string; // null for anonymous
  selected_options: string[];
  text_response?: string;
  rating_value?: number;
  is_anonymous: boolean;
  response_time_ms?: number;
  submitted_at: string;
  user?: {
    id: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export interface PollResults {
  total_responses: number;
  option_results: OptionResult[];
  rating_average?: number;
  text_responses?: string[];
  completion_rate: number;
}

export interface OptionResult {
  option_id: string;
  option_text: string;
  response_count: number;
  percentage: number;
  is_correct?: boolean;
}

export interface CreatePollOptions {
  title: string;
  description?: string;
  poll_type: 'multiple_choice' | 'single_choice' | 'open_text' | 'rating' | 'yes_no';
  options: Omit<PollOption, 'id'>[];
  session_id?: string;
  room_id?: string;
  is_anonymous?: boolean;
  allow_multiple_responses?: boolean;
  show_results_immediately?: boolean;
  duration_seconds?: number;
  correct_answers?: string[];
}

export interface SubmitResponseOptions {
  selected_options?: string[];
  text_response?: string;
  rating_value?: number;
  is_anonymous?: boolean;
}

export interface PollFilters {
  status?: string;
  poll_type?: string;
  session_id?: string;
  room_id?: string;
  creator_id?: string;
  limit?: number;
  offset?: number;
}

class PollService {
  private pollSubscriptions: Map<string, string> = new Map();
  private responseSubscriptions: Map<string, string> = new Map();
  private activePollTimers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Get polls
   */
  public async getPolls(filters: PollFilters = {}): Promise<Poll[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('polls')
        .select(`
          *,
          creator:auth.users!polls_creator_id_fkey(
            id,
            raw_user_meta_data
          )
        `);

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.poll_type) {
        query = query.eq('poll_type', filters.poll_type);
      }

      if (filters.session_id) {
        query = query.eq('session_id', filters.session_id);
      }

      if (filters.room_id) {
        query = query.eq('room_id', filters.room_id);
      }

      if (filters.creator_id) {
        query = query.eq('creator_id', filters.creator_id);
      }

      query = query
        .limit(filters.limit || 50)
        .offset(filters.offset || 0)
        .order('created_at', { ascending: false });

      const { data: polls, error } = await query;

      if (error) throw error;

      // Get response counts and user responses for each poll
      const pollsWithData = await Promise.all(
        polls.map(async (poll) => {
          const [responseCount, myResponse, results] = await Promise.all([
            this.getResponseCount(poll.id),
            this.getUserResponse(poll.id, user.id),
            poll.show_results_immediately ? this.getPollResults(poll.id) : null,
          ]);

          return {
            ...poll,
            creator: poll.creator ? {
              id: poll.creator.id,
              full_name: poll.creator.raw_user_meta_data?.full_name,
              avatar_url: poll.creator.raw_user_meta_data?.avatar_url,
            } : undefined,
            response_count: responseCount,
            my_response: myResponse,
            results: results,
          };
        })
      );

      return pollsWithData;
    } catch (error) {
      logger.error('Failed to get polls:', error);
      throw error;
    }
  }

  /**
   * Get a specific poll
   */
  public async getPoll(pollId: string): Promise<Poll> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: poll, error } = await supabase
        .from('polls')
        .select(`
          *,
          creator:auth.users!polls_creator_id_fkey(
            id,
            raw_user_meta_data
          )
        `)
        .eq('id', pollId)
        .single();

      if (error) throw error;

      const [responseCount, myResponse, results] = await Promise.all([
        this.getResponseCount(pollId),
        this.getUserResponse(pollId, user.id),
        poll.show_results_immediately || poll.status === 'ended' 
          ? this.getPollResults(pollId) 
          : null,
      ]);

      return {
        ...poll,
        creator: poll.creator ? {
          id: poll.creator.id,
          full_name: poll.creator.raw_user_meta_data?.full_name,
          avatar_url: poll.creator.raw_user_meta_data?.avatar_url,
        } : undefined,
        response_count: responseCount,
        my_response: myResponse,
        results: results,
      };
    } catch (error) {
      logger.error('Failed to get poll:', error);
      throw error;
    }
  }

  /**
   * Create a new poll
   */
  public async createPoll(options: CreatePollOptions): Promise<Poll> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if user can create polls
      const userRole = user.user_metadata?.role;
      if (!['teacher', 'admin'].includes(userRole)) {
        throw new Error('Only teachers and admins can create polls');
      }

      // Generate option IDs and prepare poll data
      const pollOptions: PollOption[] = options.options.map((option, index) => ({
        ...option,
        id: `option_${index + 1}`,
      }));

      const pollData = {
        title: options.title,
        description: options.description,
        poll_type: options.poll_type,
        session_id: options.session_id,
        room_id: options.room_id,
        creator_id: user.id,
        is_anonymous: options.is_anonymous || false,
        allow_multiple_responses: options.allow_multiple_responses || false,
        show_results_immediately: options.show_results_immediately || true,
        duration_seconds: options.duration_seconds,
        options: pollOptions,
        correct_answers: options.correct_answers || [],
        status: 'active',
      };

      const { data: poll, error } = await supabase
        .from('polls')
        .insert(pollData)
        .select(`
          *,
          creator:auth.users!polls_creator_id_fkey(
            id,
            raw_user_meta_data
          )
        `)
        .single();

      if (error) throw error;

      // Set up auto-end timer if duration is specified
      if (poll.duration_seconds) {
        this.scheduleAutoEnd(poll.id, poll.duration_seconds);
      }

      return {
        ...poll,
        creator: poll.creator ? {
          id: poll.creator.id,
          full_name: poll.creator.raw_user_meta_data?.full_name,
          avatar_url: poll.creator.raw_user_meta_data?.avatar_url,
        } : undefined,
        response_count: 0,
      };
    } catch (error) {
      logger.error('Failed to create poll:', error);
      throw error;
    }
  }

  /**
   * Update a poll
   */
  public async updatePoll(
    pollId: string,
    updates: Partial<Pick<Poll, 'title' | 'description' | 'status' | 'show_results_immediately'>>
  ): Promise<Poll> {
    try {
      const { data: poll, error } = await supabase
        .from('polls')
        .update(updates)
        .eq('id', pollId)
        .select(`
          *,
          creator:auth.users!polls_creator_id_fkey(
            id,
            raw_user_meta_data
          )
        `)
        .single();

      if (error) throw error;

      // Clear timer if poll is ended or cancelled
      if (updates.status && ['ended', 'cancelled'].includes(updates.status)) {
        this.clearAutoEndTimer(pollId);
      }

      return {
        ...poll,
        creator: poll.creator ? {
          id: poll.creator.id,
          full_name: poll.creator.raw_user_meta_data?.full_name,
          avatar_url: poll.creator.raw_user_meta_data?.avatar_url,
        } : undefined,
      };
    } catch (error) {
      logger.error('Failed to update poll:', error);
      throw error;
    }
  }

  /**
   * End a poll
   */
  public async endPoll(pollId: string): Promise<void> {
    try {
      await this.updatePoll(pollId, { status: 'ended' });
      this.clearAutoEndTimer(pollId);
      logger.info(`Poll ${pollId} ended`);
    } catch (error) {
      logger.error('Failed to end poll:', error);
      throw error;
    }
  }

  /**
   * Submit a response to a poll
   */
  public async submitResponse(
    pollId: string,
    options: SubmitResponseOptions
  ): Promise<PollResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user && !options.is_anonymous) {
        throw new Error('User not authenticated');
      }

      // Get poll to validate response
      const poll = await this.getPoll(pollId);
      if (poll.status !== 'active') {
        throw new Error('Poll is not active');
      }

      // Check if user already responded (if not allowing multiple responses)
      if (!poll.allow_multiple_responses && !options.is_anonymous) {
        const existingResponse = await this.getUserResponse(pollId, user!.id);
        if (existingResponse) {
          throw new Error('You have already responded to this poll');
        }
      }

      // Validate response based on poll type
      this.validateResponse(poll, options);

      const responseData = {
        poll_id: pollId,
        user_id: options.is_anonymous ? null : user?.id,
        selected_options: options.selected_options || [],
        text_response: options.text_response,
        rating_value: options.rating_value,
        is_anonymous: options.is_anonymous || false,
        response_time_ms: Date.now() - new Date(poll.starts_at).getTime(),
      };

      const { data: response, error } = await supabase
        .from('poll_responses')
        .insert(responseData)
        .select(`
          *,
          user:auth.users!poll_responses_user_id_fkey(
            id,
            raw_user_meta_data
          )
        `)
        .single();

      if (error) throw error;

      return {
        ...response,
        user: response.user && !response.is_anonymous ? {
          id: response.user.id,
          full_name: response.user.raw_user_meta_data?.full_name,
          avatar_url: response.user.raw_user_meta_data?.avatar_url,
        } : undefined,
      };
    } catch (error) {
      logger.error('Failed to submit response:', error);
      throw error;
    }
  }

  /**
   * Get poll results
   */
  public async getPollResults(pollId: string): Promise<PollResults> {
    try {
      // Get all responses for the poll
      const { data: responses, error } = await supabase
        .from('poll_responses')
        .select('selected_options, text_response, rating_value')
        .eq('poll_id', pollId);

      if (error) throw error;

      const poll = await this.getPoll(pollId);
      const totalResponses = responses.length;

      // Calculate option results
      const optionCounts = new Map<string, number>();
      const textResponses: string[] = [];
      let ratingSum = 0;
      let ratingCount = 0;

      responses.forEach((response) => {
        // Count option selections
        response.selected_options?.forEach((optionId: string) => {
          optionCounts.set(optionId, (optionCounts.get(optionId) || 0) + 1);
        });

        // Collect text responses
        if (response.text_response) {
          textResponses.push(response.text_response);
        }

        // Sum ratings
        if (response.rating_value) {
          ratingSum += response.rating_value;
          ratingCount++;
        }
      });

      // Build option results
      const optionResults: OptionResult[] = poll.options.map((option) => {
        const responseCount = optionCounts.get(option.id) || 0;
        return {
          option_id: option.id,
          option_text: option.text,
          response_count: responseCount,
          percentage: totalResponses > 0 ? (responseCount / totalResponses) * 100 : 0,
          is_correct: option.is_correct,
        };
      });

      return {
        total_responses: totalResponses,
        option_results: optionResults,
        rating_average: ratingCount > 0 ? ratingSum / ratingCount : undefined,
        text_responses: textResponses,
        completion_rate: 100, // For now, assume 100% completion rate
      };
    } catch (error) {
      logger.error('Failed to get poll results:', error);
      throw error;
    }
  }

  /**
   * Get poll responses (for poll creators)
   */
  public async getPollResponses(
    pollId: string,
    includeAnonymous: boolean = false
  ): Promise<PollResponse[]> {
    try {
      let query = supabase
        .from('poll_responses')
        .select(`
          *,
          user:auth.users!poll_responses_user_id_fkey(
            id,
            raw_user_meta_data
          )
        `)
        .eq('poll_id', pollId);

      if (!includeAnonymous) {
        query = query.eq('is_anonymous', false);
      }

      const { data: responses, error } = await query;

      if (error) throw error;

      return responses.map((response) => ({
        ...response,
        user: response.user && !response.is_anonymous ? {
          id: response.user.id,
          full_name: response.user.raw_user_meta_data?.full_name,
          avatar_url: response.user.raw_user_meta_data?.avatar_url,
        } : undefined,
      }));
    } catch (error) {
      logger.error('Failed to get poll responses:', error);
      throw error;
    }
  }

  /**
   * Subscribe to poll updates
   */
  public subscribeToPoll(
    pollId: string,
    onPollUpdate: (poll: Poll) => void,
    onNewResponse: (response: PollResponse) => void
  ): string {
    // Subscribe to poll updates
    const pollSubscriptionId = realtimeConnection.subscribe(
      'polls',
      `id=eq.${pollId}`,
      (payload) => {
        const { eventType } = payload;
        if (eventType === 'UPDATE') {
          this.getPoll(pollId).then(onPollUpdate);
        }
      }
    );

    // Subscribe to new responses
    const responseSubscriptionId = realtimeConnection.subscribe(
      'poll_responses',
      `poll_id=eq.${pollId}`,
      (payload) => {
        const { eventType, new: newRecord } = payload;
        if (eventType === 'INSERT' && newRecord) {
          onNewResponse(newRecord);
          // Refresh poll data to update counts
          this.getPoll(pollId).then(onPollUpdate);
        }
      }
    );

    this.pollSubscriptions.set(pollId, pollSubscriptionId);
    this.responseSubscriptions.set(pollId, responseSubscriptionId);

    return pollSubscriptionId;
  }

  /**
   * Unsubscribe from poll updates
   */
  public unsubscribeFromPoll(pollId: string): void {
    const pollSubscriptionId = this.pollSubscriptions.get(pollId);
    const responseSubscriptionId = this.responseSubscriptions.get(pollId);

    if (pollSubscriptionId) {
      realtimeConnection.unsubscribe(pollSubscriptionId);
      this.pollSubscriptions.delete(pollId);
    }

    if (responseSubscriptionId) {
      realtimeConnection.unsubscribe(responseSubscriptionId);
      this.responseSubscriptions.delete(pollId);
    }
  }

  // Private helper methods

  private async getResponseCount(pollId: string): Promise<number> {
    try {
      const { count } = await supabase
        .from('poll_responses')
        .select('id', { count: 'exact' })
        .eq('poll_id', pollId);

      return count || 0;
    } catch (error) {
      return 0;
    }
  }

  private async getUserResponse(pollId: string, userId: string): Promise<PollResponse | null> {
    try {
      const { data: response } = await supabase
        .from('poll_responses')
        .select(`
          *,
          user:auth.users!poll_responses_user_id_fkey(
            id,
            raw_user_meta_data
          )
        `)
        .eq('poll_id', pollId)
        .eq('user_id', userId)
        .single();

      if (!response) return null;

      return {
        ...response,
        user: response.user ? {
          id: response.user.id,
          full_name: response.user.raw_user_meta_data?.full_name,
          avatar_url: response.user.raw_user_meta_data?.avatar_url,
        } : undefined,
      };
    } catch (error) {
      return null;
    }
  }

  private validateResponse(poll: Poll, response: SubmitResponseOptions): void {
    switch (poll.poll_type) {
      case 'single_choice':
        if (!response.selected_options || response.selected_options.length !== 1) {
          throw new Error('Single choice polls require exactly one option selection');
        }
        break;

      case 'multiple_choice':
        if (!response.selected_options || response.selected_options.length === 0) {
          throw new Error('Multiple choice polls require at least one option selection');
        }
        break;

      case 'open_text':
        if (!response.text_response || response.text_response.trim().length === 0) {
          throw new Error('Open text polls require a text response');
        }
        break;

      case 'rating':
        if (!response.rating_value || response.rating_value < 1 || response.rating_value > 5) {
          throw new Error('Rating polls require a rating value between 1 and 5');
        }
        break;

      case 'yes_no':
        if (!response.selected_options || response.selected_options.length !== 1) {
          throw new Error('Yes/No polls require exactly one option selection');
        }
        const validOptions = poll.options.map(o => o.id);
        if (!validOptions.includes(response.selected_options[0])) {
          throw new Error('Invalid option selection for Yes/No poll');
        }
        break;
    }
  }

  private scheduleAutoEnd(pollId: string, durationSeconds: number): void {
    const timer = setTimeout(async () => {
      try {
        await this.endPoll(pollId);
      } catch (error) {
        logger.error(`Failed to auto-end poll ${pollId}:`, error);
      }
    }, durationSeconds * 1000);

    this.activePollTimers.set(pollId, timer);
  }

  private clearAutoEndTimer(pollId: string): void {
    const timer = this.activePollTimers.get(pollId);
    if (timer) {
      clearTimeout(timer);
      this.activePollTimers.delete(pollId);
    }
  }
}

// Export singleton instance
export const pollService = new PollService();
export default PollService;