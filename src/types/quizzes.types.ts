export interface QuizQuestionOption {
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  questionText: string;
  options: QuizQuestionOption[];
  points?: number;
}

export interface QuizListItem {
  _id: string;
  title: string;
  description?: string;
  durationMinutes?: number;
  totalPoints?: number;
  maxAttempts?: number;
  course?: { _id: string; moodleId?: number };
  submittedBy?: Array<{ id?: string; _id?: string }>;
  [key: string]: unknown;
}

export interface QuizListResponse {
  success?: boolean;
  data?: QuizListItem[];
  quizzes?: QuizListItem[];
}

export interface QuizDetailResponse {
  _id: string;
  title: string;
  description?: string;
  durationMinutes?: number;
  totalPoints?: number;
  defaultPointsPerQuestion?: number;
  maxAttempts?: number;
  availableFrom?: string;
  availableUntil?: string;
  questionCount?: number;
  questions: QuizQuestion[];
  submittedBy?: Array<{ id?: string; _id?: string }>;
  [key: string]: unknown;
}

export interface CreateQuizPayload {
  title: string;
  description?: string;
  course?: string;
  durationMinutes?: number;
  totalPoints?: number;
  pointsPerQuestion?: number;
  questions?: QuizQuestion[];
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  showCorrectAnswers?: boolean;
  allowReview?: boolean;
  status?: string;
  totalQuestions?: number;
  [key: string]: unknown;
}

export interface StartAttemptPayload {
  studentId: string;
}

export interface SubmitQuizPayload {
  studentId: string;
  answers: Array<{questionId: string; selectedOptions: number[]}>;
}
