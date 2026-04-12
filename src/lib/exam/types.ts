export type ExamQuestionView = {
  examQuestionId: string;
  questionId: string;
  position: number;
  category: string | null;
  questionText: string;
  explanation: string | null;
  options: Array<{
    id: string;
    label: string;
    text: string;
    isCorrect: boolean;
  }>;
};

export type AttemptQuestionState = {
  examQuestionId: string;
  selectedOptionId: string | null;
  isCorrect: boolean | null;
  answeredAt: string | null;
};

export type AttemptExamSnapshot = {
  attemptId: string;
  examTitle: string;
  passPercentage: number;
  timeLimitMinutes: number;
  status: "IN_PROGRESS" | "SUBMITTED" | "AUTO_SUBMITTED" | "EXPIRED";
  startedAt: string;
  expiresAt: string;
  submittedAt: string | null;
  currentQuestionIndex: number;
  correctAnswerCount: number | null;
  totalQuestionCount: number;
  scorePercentage: number | null;
  participantName: string | null;
  questions: ExamQuestionView[];
  answers: AttemptQuestionState[];
};
