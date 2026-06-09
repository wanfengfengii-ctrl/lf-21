import type { DifficultyLevel, OperatorType, WrongQuestion } from './abacus'

export interface Student {
  id: string
  username: string
  password: string
  realName: string
  avatar?: string
  grade?: string
  groupIds: string[]
  createdAt: number
  lastLoginAt?: number
  totalPracticeTime: number
  totalQuestions: number
  correctQuestions: number
  currentStreak: number
  bestStreak: number
  stars: number
}

export interface StudentGroup {
  id: string
  name: string
  description?: string
  teacherId: string
  studentIds: string[]
  createdAt: number
  color?: string
}

export type TaskType = 'practice' | 'level'

export interface TaskConfig {
  type: TaskType
  levelId?: number
  difficulty?: DifficultyLevel
  operators?: OperatorType[]
  questionCount: number
  timeLimit?: number
}

export interface Task {
  id: string
  title: string
  description?: string
  config: TaskConfig
  createdAt: number
  deadline?: number
  teacherId: string
  assignedGroupIds: string[]
  assignedStudentIds: string[]
}

export interface TaskSubmission {
  taskId: string
  studentId: string
  submittedAt: number
  score: number
  correctCount: number
  totalQuestions: number
  totalTime: number
  averageTime: number
  isCompleted: boolean
  wrongQuestions: WrongQuestion[]
}

export interface StudentProgress {
  studentId: string
  totalLevels: number
  completedLevels: number
  totalQuestions: number
  correctCount: number
  accuracy: number
  totalTime: number
  averageTime: number
  weakOperations: { operator: OperatorType; accuracy: number; count: number }[]
  weakRods: { rodIndex: number; errorCount: number }[]
  difficultyStats: { difficulty: DifficultyLevel; accuracy: number; count: number }[]
  lastActiveAt: number
}

export interface LearningReportFilter {
  studentIds?: string[]
  groupIds?: string[]
  startTime?: number
  endTime?: number
  levelIds?: number[]
}

export interface ClassComparisonData {
  groupId: string
  groupName: string
  studentCount: number
  avgAccuracy: number
  avgTotalQuestions: number
  avgCompletedLevels: number
  avgStars: number
  avgTotalTime: number
}

export interface LeaderboardEntry {
  studentId: string
  studentName: string
  groupName?: string
  score: number
  accuracy: number
  totalQuestions: number
  totalTime: number
  stars: number
  rank: number
}

export interface LearningAdvice {
  studentId: string
  studentName: string
  weakPoints: string[]
  suggestions: string[]
  recommendedLevels: number[]
  recommendedPractice: {
    operators: OperatorType[]
    difficulty: DifficultyLevel
    questionCount: number
  }
}

export interface TeacherComment {
  id: string
  taskId?: string
  studentId: string
  teacherId: string
  content: string
  createdAt: number
  type: 'encouragement' | 'suggestion' | 'correction' | 'general'
}

export interface ExportOptions {
  format: 'csv' | 'json'
  includeScores: boolean
  includeWrongQuestions: boolean
  includeProgress: boolean
  dateRange?: { start: number; end: number }
  groupIds?: string[]
  studentIds?: string[]
}

export interface Teacher {
  id: string
  username: string
  password: string
  realName: string
  avatar?: string
  role: 'teacher' | 'parent'
  createdAt: number
}
