import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Student,
  StudentGroup,
  Task,
  TaskSubmission,
  StudentProgress,
  LearningReportFilter,
  ClassComparisonData,
  LeaderboardEntry,
  LearningAdvice,
  TeacherComment,
  ExportOptions,
  Teacher
} from '../types/teacher'
import type { DifficultyLevel, OperatorType, WrongQuestion } from '../types/abacus'
import { levelConfigs } from '../data/levels'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function getMockStudents(): Student[] {
  return [
    {
      id: 'stu1',
      username: 'student1',
      password: '123456',
      realName: '小明',
      grade: '三年级',
      groupIds: ['grp1'],
      createdAt: Date.now() - 86400000 * 30,
      lastLoginAt: Date.now() - 3600000,
      totalPracticeTime: 7200000,
      totalQuestions: 150,
      correctQuestions: 120,
      currentStreak: 5,
      bestStreak: 12,
      stars: 18
    },
    {
      id: 'stu2',
      username: 'student2',
      password: '123456',
      realName: '小红',
      grade: '三年级',
      groupIds: ['grp1'],
      createdAt: Date.now() - 86400000 * 25,
      lastLoginAt: Date.now() - 7200000,
      totalPracticeTime: 5400000,
      totalQuestions: 120,
      correctQuestions: 105,
      currentStreak: 3,
      bestStreak: 8,
      stars: 15
    },
    {
      id: 'stu3',
      username: 'student3',
      password: '123456',
      realName: '小刚',
      grade: '四年级',
      groupIds: ['grp2'],
      createdAt: Date.now() - 86400000 * 20,
      lastLoginAt: Date.now() - 86400000,
      totalPracticeTime: 3600000,
      totalQuestions: 80,
      correctQuestions: 60,
      currentStreak: 0,
      bestStreak: 5,
      stars: 10
    },
    {
      id: 'stu4',
      username: 'student4',
      password: '123456',
      realName: '小丽',
      grade: '四年级',
      groupIds: ['grp2'],
      createdAt: Date.now() - 86400000 * 15,
      lastLoginAt: Date.now() - 1800000,
      totalPracticeTime: 9000000,
      totalQuestions: 200,
      correctQuestions: 180,
      currentStreak: 8,
      bestStreak: 15,
      stars: 25
    },
    {
      id: 'stu5',
      username: 'student5',
      password: '123456',
      realName: '小华',
      grade: '三年级',
      groupIds: ['grp1', 'grp3'],
      createdAt: Date.now() - 86400000 * 10,
      lastLoginAt: Date.now() - 3600000 * 5,
      totalPracticeTime: 2400000,
      totalQuestions: 60,
      correctQuestions: 42,
      currentStreak: 2,
      bestStreak: 4,
      stars: 8
    }
  ]
}

function getMockGroups(): StudentGroup[] {
  return [
    {
      id: 'grp1',
      name: '三年级一班',
      description: '珠算兴趣班初级组',
      teacherId: 't1',
      studentIds: ['stu1', 'stu2', 'stu5'],
      createdAt: Date.now() - 86400000 * 30,
      color: '#1890ff'
    },
    {
      id: 'grp2',
      name: '四年级二班',
      description: '珠算提高班',
      teacherId: 't1',
      studentIds: ['stu3', 'stu4'],
      createdAt: Date.now() - 86400000 * 25,
      color: '#52c41a'
    },
    {
      id: 'grp3',
      name: '尖子生组',
      description: '选拔组，针对高难度内容',
      teacherId: 't1',
      studentIds: ['stu4', 'stu5'],
      createdAt: Date.now() - 86400000 * 10,
      color: '#fa8c16'
    }
  ]
}

function getMockTasks(): Task[] {
  return [
    {
      id: 'task1',
      title: '加法基础练习',
      description: '本周加法练习任务，请同学们认真完成',
      config: {
        type: 'practice',
        difficulty: 'easy',
        operators: ['+'],
        questionCount: 10
      },
      createdAt: Date.now() - 86400000 * 3,
      deadline: Date.now() + 86400000 * 4,
      teacherId: 't1',
      assignedGroupIds: ['grp1'],
      assignedStudentIds: []
    },
    {
      id: 'task2',
      title: '第一关闯关作业',
      description: '请完成加法入门关卡',
      config: {
        type: 'level',
        levelId: 1,
        questionCount: 5
      },
      createdAt: Date.now() - 86400000 * 5,
      deadline: Date.now() + 86400000 * 2,
      teacherId: 't1',
      assignedGroupIds: ['grp1', 'grp2'],
      assignedStudentIds: []
    },
    {
      id: 'task3',
      title: '乘法专项训练',
      description: '九九乘法表练习',
      config: {
        type: 'practice',
        difficulty: 'easy',
        operators: ['×'],
        questionCount: 15
      },
      createdAt: Date.now() - 86400000 * 1,
      deadline: Date.now() + 86400000 * 6,
      teacherId: 't1',
      assignedGroupIds: ['grp3'],
      assignedStudentIds: ['stu3']
    }
  ]
}

function getMockSubmissions(): TaskSubmission[] {
  return [
    {
      taskId: 'task1',
      studentId: 'stu1',
      submittedAt: Date.now() - 86400000,
      score: 80,
      correctCount: 8,
      totalQuestions: 10,
      totalTime: 300000,
      averageTime: 30000,
      isCompleted: true,
      wrongQuestions: [
        {
          num1: 45,
          num2: 38,
          operator: '+',
          answer: 83,
          userAnswer: 73,
          difficulty: 'easy',
          timestamp: Date.now() - 86400000 + 60000,
          errorRods: [5, 6],
          errorDescription: '个位进位错误，十位少加了1'
        },
        {
          num1: 67,
          num2: 29,
          operator: '+',
          answer: 96,
          userAnswer: 86,
          difficulty: 'easy',
          timestamp: Date.now() - 86400000 + 120000,
          errorRods: [5],
          errorDescription: '个位进位忘记加了'
        }
      ]
    },
    {
      taskId: 'task1',
      studentId: 'stu2',
      submittedAt: Date.now() - 172800000,
      score: 90,
      correctCount: 9,
      totalQuestions: 10,
      totalTime: 240000,
      averageTime: 24000,
      isCompleted: true,
      wrongQuestions: [
        {
          num1: 73,
          num2: 45,
          operator: '-',
          answer: 28,
          userAnswer: 38,
          difficulty: 'easy',
          timestamp: Date.now() - 172800000 + 90000,
          errorRods: [5],
          errorDescription: '个位借位没有减1'
        }
      ]
    },
    {
      taskId: 'task2',
      studentId: 'stu1',
      submittedAt: Date.now() - 259200000,
      score: 100,
      correctCount: 5,
      totalQuestions: 5,
      totalTime: 180000,
      averageTime: 36000,
      isCompleted: true,
      wrongQuestions: []
    },
    {
      taskId: 'task2',
      studentId: 'stu4',
      submittedAt: Date.now() - 432000000,
      score: 100,
      correctCount: 5,
      totalQuestions: 5,
      totalTime: 120000,
      averageTime: 24000,
      isCompleted: true,
      wrongQuestions: []
    },
    {
      taskId: 'task3',
      studentId: 'stu3',
      submittedAt: Date.now() - 43200000,
      score: 60,
      correctCount: 9,
      totalQuestions: 15,
      totalTime: 600000,
      averageTime: 40000,
      isCompleted: true,
      wrongQuestions: [
        {
          num1: 7,
          num2: 8,
          operator: '×',
          answer: 56,
          userAnswer: 54,
          difficulty: 'easy',
          timestamp: Date.now() - 43200000 + 30000,
          errorRods: [5],
          errorDescription: '乘法口诀记错了，七八五十六'
        },
        {
          num1: 6,
          num2: 9,
          operator: '×',
          answer: 54,
          userAnswer: 48,
          difficulty: 'easy',
          timestamp: Date.now() - 43200000 + 80000,
          errorRods: [5],
          errorDescription: '六九五十四，记错成六八四十八了'
        },
        {
          num1: 9,
          num2: 7,
          operator: '×',
          answer: 63,
          userAnswer: 62,
          difficulty: 'easy',
          timestamp: Date.now() - 43200000 + 150000,
          errorRods: [4, 5],
          errorDescription: '拨珠错误，个位少拨了1'
        },
        {
          num1: 8,
          num2: 6,
          operator: '×',
          answer: 48,
          userAnswer: 42,
          difficulty: 'easy',
          timestamp: Date.now() - 43200000 + 220000,
          errorRods: [5],
          errorDescription: '六八四十八，记错成六七四十二了'
        },
        {
          num1: 5,
          num2: 9,
          operator: '×',
          answer: 45,
          userAnswer: 40,
          difficulty: 'easy',
          timestamp: Date.now() - 43200000 + 300000,
          errorRods: [5],
          errorDescription: '五九四十五，记错成五八四十了'
        },
        {
          num1: 4,
          num2: 7,
          operator: '×',
          answer: 28,
          userAnswer: 24,
          difficulty: 'easy',
          timestamp: Date.now() - 43200000 + 400000,
          errorRods: [6],
          errorDescription: '四七二十八，记错成四六二十四了'
        }
      ]
    }
  ]
}

function getMockComments(): TeacherComment[] {
  return [
    {
      id: 'c1',
      taskId: 'task1',
      studentId: 'stu1',
      teacherId: 't1',
      content: '表现不错！继续保持，注意提高速度',
      createdAt: Date.now() - 86400000,
      type: 'encouragement'
    },
    {
      id: 'c2',
      taskId: 'task2',
      studentId: 'stu1',
      teacherId: 't1',
      content: '全对很棒！可以尝试更难的内容了',
      createdAt: Date.now() - 259200000,
      type: 'encouragement'
    },
    {
      id: 'c3',
      studentId: 'stu3',
      teacherId: 't1',
      content: '最近练习不够，要加油哦！',
      createdAt: Date.now() - 86400000 * 3,
      type: 'suggestion'
    }
  ]
}

export const useTeacherStore = defineStore('teacher', () => {
  const currentTeacher = ref<Teacher | null>({
    id: 't1',
    username: 'teacher',
    password: '123456',
    realName: '李老师',
    role: 'teacher',
    createdAt: Date.now() - 86400000 * 60
  })

  const currentStudent = ref<Student | null>(null)
  const activeTask = ref<Task | null>(null)
  const students = ref<Student[]>(getMockStudents())
  const groups = ref<StudentGroup[]>(getMockGroups())
  const tasks = ref<Task[]>(getMockTasks())
  const submissions = ref<TaskSubmission[]>(getMockSubmissions())
  const comments = ref<TeacherComment[]>(getMockComments())

  const allStudents = computed(() => students.value)
  const allGroups = computed(() => groups.value)
  const allTasks = computed(() => tasks.value)

  const studentsByGroup = computed(() => {
    const map: Record<string, Student[]> = {}
    for (const group of groups.value) {
      map[group.id] = students.value.filter(s => s.groupIds.includes(group.id))
    }
    return map
  })

  const tasksByStudent = computed(() => {
    const map: Record<string, Task[]> = {}
    for (const student of students.value) {
      const assignedTasks = tasks.value.filter(task => {
        if (task.assignedStudentIds.includes(student.id)) return true
        return task.assignedGroupIds.some(gid => student.groupIds.includes(gid))
      })
      map[student.id] = assignedTasks
    }
    return map
  })

  function getStudentById(id: string): Student | undefined {
    return students.value.find(s => s.id === id)
  }

  function getGroupById(id: string): StudentGroup | undefined {
    return groups.value.find(g => g.id === id)
  }

  function getTaskById(id: string): Task | undefined {
    return tasks.value.find(t => t.id === id)
  }

  function addStudent(data: Omit<Student, 'id' | 'createdAt' | 'totalPracticeTime' | 'totalQuestions' | 'correctQuestions' | 'currentStreak' | 'bestStreak' | 'stars'>): Student {
    const newStudent: Student = {
      ...data,
      id: generateId(),
      createdAt: Date.now(),
      totalPracticeTime: 0,
      totalQuestions: 0,
      correctQuestions: 0,
      currentStreak: 0,
      bestStreak: 0,
      stars: 0
    }
    students.value.push(newStudent)
    return newStudent
  }

  function updateStudent(id: string, data: Partial<Student>): boolean {
    const index = students.value.findIndex(s => s.id === id)
    if (index >= 0) {
      students.value[index] = { ...students.value[index], ...data }
      return true
    }
    return false
  }

  function deleteStudent(id: string): boolean {
    const index = students.value.findIndex(s => s.id === id)
    if (index >= 0) {
      students.value.splice(index, 1)
      groups.value.forEach(g => {
        const idx = g.studentIds.indexOf(id)
        if (idx >= 0) g.studentIds.splice(idx, 1)
      })
      return true
    }
    return false
  }

  function addGroup(data: Omit<StudentGroup, 'id' | 'createdAt' | 'studentIds' | 'teacherId'>): StudentGroup {
    const newGroup: StudentGroup = {
      ...data,
      id: generateId(),
      createdAt: Date.now(),
      studentIds: [],
      teacherId: currentTeacher.value?.id || ''
    }
    groups.value.push(newGroup)
    return newGroup
  }

  function updateGroup(id: string, data: Partial<StudentGroup>): boolean {
    const index = groups.value.findIndex(g => g.id === id)
    if (index >= 0) {
      groups.value[index] = { ...groups.value[index], ...data }
      return true
    }
    return false
  }

  function deleteGroup(id: string): boolean {
    const index = groups.value.findIndex(g => g.id === id)
    if (index >= 0) {
      students.value.forEach(s => {
        const idx = s.groupIds.indexOf(id)
        if (idx >= 0) s.groupIds.splice(idx, 1)
      })
      groups.value.splice(index, 1)
      return true
    }
    return false
  }

  function addStudentToGroup(studentId: string, groupId: string): boolean {
    const student = students.value.find(s => s.id === studentId)
    const group = groups.value.find(g => g.id === groupId)
    if (student && group) {
      if (!student.groupIds.includes(groupId)) {
        student.groupIds.push(groupId)
      }
      if (!group.studentIds.includes(studentId)) {
        group.studentIds.push(studentId)
      }
      return true
    }
    return false
  }

  function removeStudentFromGroup(studentId: string, groupId: string): boolean {
    const student = students.value.find(s => s.id === studentId)
    const group = groups.value.find(g => g.id === groupId)
    if (student && group) {
      const sIdx = student.groupIds.indexOf(groupId)
      if (sIdx >= 0) student.groupIds.splice(sIdx, 1)
      const gIdx = group.studentIds.indexOf(studentId)
      if (gIdx >= 0) group.studentIds.splice(gIdx, 1)
      return true
    }
    return false
  }

  function addTask(data: Omit<Task, 'id' | 'createdAt' | 'teacherId'>): Task {
    const newTask: Task = {
      ...data,
      id: generateId(),
      createdAt: Date.now(),
      teacherId: currentTeacher.value?.id || ''
    }
    tasks.value.push(newTask)
    return newTask
  }

  function updateTask(id: string, data: Partial<Task>): boolean {
    const index = tasks.value.findIndex(t => t.id === id)
    if (index >= 0) {
      tasks.value[index] = { ...tasks.value[index], ...data }
      return true
    }
    return false
  }

  function deleteTask(id: string): boolean {
    const index = tasks.value.findIndex(t => t.id === id)
    if (index >= 0) {
      tasks.value.splice(index, 1)
      return true
    }
    return false
  }

  function assignTaskToGroup(taskId: string, groupId: string): boolean {
    const task = tasks.value.find(t => t.id === taskId)
    if (task && !task.assignedGroupIds.includes(groupId)) {
      task.assignedGroupIds.push(groupId)
      return true
    }
    return false
  }

  function assignTaskToStudent(taskId: string, studentId: string): boolean {
    const task = tasks.value.find(t => t.id === taskId)
    if (task && !task.assignedStudentIds.includes(studentId)) {
      task.assignedStudentIds.push(studentId)
      return true
    }
    return false
  }

  function getStudentProgress(studentId: string, startTime?: number, endTime?: number): StudentProgress {
    const student = students.value.find(s => s.id === studentId)
    if (!student) {
      return {
        studentId,
        totalLevels: levelConfigs.length,
        completedLevels: 0,
        totalQuestions: 0,
        correctCount: 0,
        accuracy: 0,
        totalTime: 0,
        averageTime: 0,
        weakOperations: [],
        weakRods: [],
        difficultyStats: [],
        lastActiveAt: 0
      }
    }

    if (startTime !== undefined || endTime !== undefined) {
      const studentSubmissions = submissions.value.filter(s => {
        if (s.studentId !== studentId) return false
        if (startTime !== undefined && s.submittedAt < startTime) return false
        if (endTime !== undefined && s.submittedAt > endTime) return false
        return true
      })

      const totalQuestions = studentSubmissions.reduce((sum, s) => sum + s.totalQuestions, 0)
      const correctCount = studentSubmissions.reduce((sum, s) => sum + s.correctCount, 0)
      const totalTime = studentSubmissions.reduce((sum, s) => sum + s.totalTime, 0)
      const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0
      const avgTime = totalQuestions > 0 ? totalTime / totalQuestions : 0

      const opStats: Record<OperatorType, { correct: number; total: number }> = {
        '+': { correct: 0, total: 0 },
        '-': { correct: 0, total: 0 },
        '×': { correct: 0, total: 0 },
        '÷': { correct: 0, total: 0 }
      }

      const rodStats: Record<number, number> = {}

      const diffStats: Record<DifficultyLevel, { correct: number; total: number }> = {
        easy: { correct: 0, total: 0 },
        medium: { correct: 0, total: 0 },
        hard: { correct: 0, total: 0 }
      }

      for (const sub of studentSubmissions) {
        const task = tasks.value.find(t => t.id === sub.taskId)
        const op = task?.config.operators?.[0] || '+'
        const diff = task?.config.difficulty || 'easy'

        opStats[op].total += sub.totalQuestions
        opStats[op].correct += sub.correctCount

        diffStats[diff].total += sub.totalQuestions
        diffStats[diff].correct += sub.correctCount

        for (const wq of sub.wrongQuestions) {
          for (const rodIdx of wq.errorRods) {
            rodStats[rodIdx] = (rodStats[rodIdx] || 0) + 1
          }
        }
      }

      const weakOperations: { operator: OperatorType; accuracy: number; count: number }[] = (
        Object.entries(opStats) as [OperatorType, { correct: number; total: number }][]
      )
        .map(([op, stats]) => ({
          operator: op,
          accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 100,
          count: stats.total
        }))
        .filter(op => op.count > 0)
        .sort((a, b) => a.accuracy - b.accuracy)

      const weakRods: { rodIndex: number; errorCount: number }[] = Object.entries(rodStats)
        .map(([rodIndex, errorCount]) => ({
          rodIndex: parseInt(rodIndex),
          errorCount
        }))
        .sort((a, b) => b.errorCount - a.errorCount)
        .slice(0, 5)

      const difficultyStats: { difficulty: DifficultyLevel; accuracy: number; count: number }[] = (
        Object.entries(diffStats) as [DifficultyLevel, { correct: number; total: number }][]
      ).map(([diff, stats]) => ({
        difficulty: diff,
        accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 100,
        count: stats.total
      }))

      const lastActiveAt = studentSubmissions.length > 0
        ? Math.max(...studentSubmissions.map(s => s.submittedAt))
        : student.lastLoginAt || 0

      const completedLevels = Math.floor(student.stars / 3)

      return {
        studentId,
        totalLevels: levelConfigs.length,
        completedLevels,
        totalQuestions,
        correctCount,
        accuracy,
        totalTime,
        averageTime: avgTime,
        weakOperations,
        weakRods,
        difficultyStats,
        lastActiveAt
      }
    }

    const accuracy = student.totalQuestions > 0
      ? Math.round((student.correctQuestions / student.totalQuestions) * 100)
      : 0

    const completedLevels = Math.floor(student.stars / 3)
    const avgTime = student.totalQuestions > 0 ? student.totalPracticeTime / student.totalQuestions : 0

    const weakOperations: { operator: OperatorType; accuracy: number; count: number }[] = ([
      { operator: '+', accuracy: getRandomInt(70, 95), count: getRandomInt(10, 50) },
      { operator: '-', accuracy: getRandomInt(60, 90), count: getRandomInt(10, 40) },
      { operator: '×', accuracy: getRandomInt(50, 85), count: getRandomInt(5, 30) },
      { operator: '÷', accuracy: getRandomInt(45, 80), count: getRandomInt(5, 25) }
    ] as { operator: OperatorType; accuracy: number; count: number }[])
      .sort((a, b) => a.accuracy - b.accuracy)

    const weakRods: { rodIndex: number; errorCount: number }[] = [
      { rodIndex: 5, errorCount: getRandomInt(3, 10) },
      { rodIndex: 4, errorCount: getRandomInt(2, 8) },
      { rodIndex: 6, errorCount: getRandomInt(1, 6) }
    ]

    const difficultyStats: { difficulty: DifficultyLevel; accuracy: number; count: number }[] = [
      { difficulty: 'easy', accuracy: getRandomInt(85, 100), count: getRandomInt(30, 80) },
      { difficulty: 'medium', accuracy: getRandomInt(65, 85), count: getRandomInt(20, 50) },
      { difficulty: 'hard', accuracy: getRandomInt(45, 70), count: getRandomInt(5, 20) }
    ]

    return {
      studentId,
      totalLevels: levelConfigs.length,
      completedLevels,
      totalQuestions: student.totalQuestions,
      correctCount: student.correctQuestions,
      accuracy,
      totalTime: student.totalPracticeTime,
      averageTime: avgTime,
      weakOperations,
      weakRods,
      difficultyStats,
      lastActiveAt: student.lastLoginAt || 0
    }
  }

  function getStudentProgressList(studentIds: string[], startTime?: number, endTime?: number): StudentProgress[] {
    return studentIds.map(id => getStudentProgress(id, startTime, endTime))
  }

  function getFilteredReport(filter: LearningReportFilter): StudentProgress[] {
    let targetStudentIds: string[] = []

    if (filter.studentIds && filter.studentIds.length > 0) {
      targetStudentIds = filter.studentIds
    } else if (filter.groupIds && filter.groupIds.length > 0) {
      for (const gid of filter.groupIds) {
        const group = groups.value.find(g => g.id === gid)
        if (group) {
          for (const sid of group.studentIds) {
            if (!targetStudentIds.includes(sid)) {
              targetStudentIds.push(sid)
            }
          }
        }
      }
    } else {
      targetStudentIds = students.value.map(s => s.id)
    }

    return getStudentProgressList(targetStudentIds, filter.startTime, filter.endTime)
  }

  function getClassComparison(): ClassComparisonData[] {
    return groups.value.map(group => {
      const groupStudents = students.value.filter(s => s.groupIds.includes(group.id))
      if (groupStudents.length === 0) {
        return {
          groupId: group.id,
          groupName: group.name,
          studentCount: 0,
          avgAccuracy: 0,
          avgTotalQuestions: 0,
          avgCompletedLevels: 0,
          avgStars: 0,
          avgTotalTime: 0
        }
      }

      const progresses = groupStudents.map(s => getStudentProgress(s.id))
      const avgAccuracy = Math.round(
        progresses.reduce((sum, p) => sum + p.accuracy, 0) / progresses.length
      )
      const avgTotalQuestions = Math.round(
        progresses.reduce((sum, p) => sum + p.totalQuestions, 0) / progresses.length
      )
      const avgCompletedLevels = Math.round(
        progresses.reduce((sum, p) => sum + p.completedLevels, 0) / progresses.length
      )
      const avgStars = Math.round(
        groupStudents.reduce((sum, s) => sum + s.stars, 0) / groupStudents.length
      )
      const avgTotalTime = Math.round(
        progresses.reduce((sum, p) => sum + p.totalTime, 0) / progresses.length
      )

      return {
        groupId: group.id,
        groupName: group.name,
        studentCount: groupStudents.length,
        avgAccuracy,
        avgTotalQuestions,
        avgCompletedLevels,
        avgStars,
        avgTotalTime
      }
    })
  }

  function getLeaderboard(groupId?: string, limit: number = 10): LeaderboardEntry[] {
    let targetStudents = students.value
    if (groupId) {
      targetStudents = students.value.filter(s => s.groupIds.includes(groupId))
    }

    const entries: LeaderboardEntry[] = targetStudents.map(student => {
      const progress = getStudentProgress(student.id)
      const score = Math.round(
        student.stars * 100 + progress.accuracy * 2 + progress.totalQuestions * 0.5
      )

      const group = groups.value.find(g => student.groupIds.includes(g.id))

      return {
        studentId: student.id,
        studentName: student.realName,
        groupName: group?.name,
        score,
        accuracy: progress.accuracy,
        totalQuestions: progress.totalQuestions,
        totalTime: progress.totalTime,
        stars: student.stars,
        rank: 0
      }
    })

    entries.sort((a, b) => b.score - a.score)
    entries.forEach((entry, index) => {
      entry.rank = index + 1
    })

    return entries.slice(0, limit)
  }

  function getLearningAdvice(studentId: string): LearningAdvice {
    const progress = getStudentProgress(studentId)
    const student = students.value.find(s => s.id === studentId)
    const weakPoints: string[] = []
    const suggestions: string[] = []
    const recommendedLevels: number[] = []

    const weakestOp = progress.weakOperations[0]
    if (weakestOp) {
      const opNames: Record<OperatorType, string> = {
        '+': '加法',
        '-': '减法',
        '×': '乘法',
        '÷': '除法'
      }
      weakPoints.push(`${opNames[weakestOp.operator]}准确率较低（${weakestOp.accuracy}%）`)
      suggestions.push(`建议加强${opNames[weakestOp.operator]}练习，每天练习10道题`)
    }

    if (progress.weakRods.length > 0) {
      weakPoints.push(`部分档位错误较多，需加强拨珠准确性`)
      suggestions.push('注意手指拨珠姿势，慢速练习保证正确率')
    }

    if (progress.averageTime > 60000) {
      weakPoints.push('答题速度偏慢')
      suggestions.push('在保证正确率的前提下，适当提高拨珠速度')
    }

    const nextLevel = progress.completedLevels + 1
    if (nextLevel <= levelConfigs.length) {
      recommendedLevels.push(nextLevel)
      if (nextLevel + 1 <= levelConfigs.length) {
        recommendedLevels.push(nextLevel + 1)
      }
    }

    const weakestOp2 = progress.weakOperations[0]?.operator || '+'
    const diffLevel: DifficultyLevel = progress.accuracy > 70 ? 'medium' : 'easy'

    return {
      studentId,
      studentName: student?.realName || '',
      weakPoints,
      suggestions,
      recommendedLevels,
      recommendedPractice: {
        operators: [weakestOp2],
        difficulty: diffLevel,
        questionCount: 10
      }
    }
  }

  function addComment(data: Omit<TeacherComment, 'id' | 'createdAt' | 'teacherId'>): TeacherComment {
    const newComment: TeacherComment = {
      ...data,
      id: generateId(),
      createdAt: Date.now(),
      teacherId: currentTeacher.value?.id || ''
    }
    comments.value.push(newComment)
    return newComment
  }

  function getCommentsByStudent(studentId: string): TeacherComment[] {
    return comments.value
      .filter(c => c.studentId === studentId)
      .sort((a, b) => b.createdAt - a.createdAt)
  }

  function getCommentsByTask(taskId: string): TeacherComment[] {
    return comments.value
      .filter(c => c.taskId === taskId)
      .sort((a, b) => b.createdAt - a.createdAt)
  }

  function getSubmissionsByTask(taskId: string): TaskSubmission[] {
    return submissions.value.filter(s => s.taskId === taskId)
  }

  function getSubmissionsByStudent(studentId: string): TaskSubmission[] {
    return submissions.value.filter(s => s.studentId === studentId)
  }

  function getWrongQuestionsByStudent(studentId: string): WrongQuestion[] {
    const studentSubmissions = submissions.value.filter(s => s.studentId === studentId)
    const wrongQs: WrongQuestion[] = []
    for (const sub of studentSubmissions) {
      wrongQs.push(...sub.wrongQuestions)
    }
    return wrongQs
  }

  function getWrongQuestionsByGroup(groupId: string): WrongQuestion[] {
    const group = groups.value.find(g => g.id === groupId)
    if (!group) return []
    const wrongQs: WrongQuestion[] = []
    for (const sid of group.studentIds) {
      wrongQs.push(...getWrongQuestionsByStudent(sid))
    }
    return wrongQs
  }

  function getWrongQuestionsStats(wrongQuestions: WrongQuestion[]): {
    byOperator: Record<OperatorType, number>
    byDifficulty: Record<DifficultyLevel, number>
    byRodIndex: Record<number, number>
  } {
    const byOperator: Record<OperatorType, number> = { '+': 0, '-': 0, '×': 0, '÷': 0 }
    const byDifficulty: Record<DifficultyLevel, number> = { easy: 0, medium: 0, hard: 0 }
    const byRodIndex: Record<number, number> = {}

    for (const q of wrongQuestions) {
      byOperator[q.operator]++
      byDifficulty[q.difficulty]++
      for (const rodIdx of q.errorRods) {
        byRodIndex[rodIdx] = (byRodIndex[rodIdx] || 0) + 1
      }
    }

    return { byOperator, byDifficulty, byRodIndex }
  }

  function getTaskCompletionRate(taskId: string): number {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return 0

    const assignedStudents = getStudentsForTask(taskId)
    if (assignedStudents.length === 0) return 0

    const completed = submissions.value.filter(
      s => s.taskId === taskId && s.isCompleted
    ).length

    return Math.round((completed / assignedStudents.length) * 100)
  }

  function getStudentsForTask(taskId: string): Student[] {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return []

    const studentIds = new Set<string>(task.assignedStudentIds)
    for (const gid of task.assignedGroupIds) {
      const group = groups.value.find(g => g.id === gid)
      if (group) {
        group.studentIds.forEach(sid => studentIds.add(sid))
      }
    }

    return students.value.filter(s => studentIds.has(s.id))
  }

  function getFilteredStudentIds(options: { groupIds?: string[]; studentIds?: string[] }): string[] {
    let targetIds: string[] = []

    if (options.studentIds && options.studentIds.length > 0) {
      targetIds = options.studentIds
    } else if (options.groupIds && options.groupIds.length > 0) {
      for (const gid of options.groupIds) {
        const group = groups.value.find(g => g.id === gid)
        if (group) {
          for (const sid of group.studentIds) {
            if (!targetIds.includes(sid)) {
              targetIds.push(sid)
            }
          }
        }
      }
    } else {
      targetIds = students.value.map(s => s.id)
    }

    return targetIds
  }

  function exportData(options: ExportOptions): string {
    const result: Record<string, unknown> = {}

    const targetStudentIds = getFilteredStudentIds({
      groupIds: options.groupIds,
      studentIds: options.studentIds
    })
    const targetStudents = students.value.filter(s => targetStudentIds.includes(s.id))

    const startTime = options.dateRange?.start
    const endTime = options.dateRange?.end

    if (options.includeScores) {
      result.scores = targetStudents.map(s => {
        const progress = getStudentProgress(s.id, startTime, endTime)
        return {
          name: s.realName,
          grade: s.grade || '',
          totalQuestions: progress.totalQuestions,
          correctQuestions: progress.correctCount,
          accuracy: progress.accuracy,
          stars: s.stars,
          totalTime: progress.totalTime,
          currentStreak: s.currentStreak,
          bestStreak: s.bestStreak
        }
      })
    }

    if (options.includeProgress) {
      result.progress = targetStudents.map(s => {
        const p = getStudentProgress(s.id, startTime, endTime)
        return {
          name: s.realName,
          completedLevels: p.completedLevels,
          totalLevels: p.totalLevels,
          weakOperations: p.weakOperations.map(w => w.operator + ':' + w.accuracy + '%').join('; '),
          difficultyStats: p.difficultyStats.map(d => d.difficulty + ':' + d.accuracy + '%').join('; ')
        }
      })
    }

    if (options.includeWrongQuestions) {
      const filteredSubmissions = submissions.value.filter(s => {
        if (!targetStudentIds.includes(s.studentId)) return false
        if (startTime !== undefined && s.submittedAt < startTime) return false
        if (endTime !== undefined && s.submittedAt > endTime) return false
        return true
      })

      result.wrongQuestions = filteredSubmissions
        .filter(s => s.wrongQuestions.length > 0)
        .flatMap(s => s.wrongQuestions.map(wq => ({
          studentName: students.value.find(stu => stu.id === s.studentId)?.realName || '',
          taskId: s.taskId,
          question: `${wq.num1} ${wq.operator} ${wq.num2} = ${wq.answer}`,
          userAnswer: wq.userAnswer,
          errorDescription: wq.errorDescription,
          timestamp: new Date(wq.timestamp).toLocaleString()
        })))
    }

    if (options.format === 'json') {
      return JSON.stringify(result, null, 2)
    } else {
      let csv = ''
      const sections = Object.keys(result)
      for (const section of sections) {
        csv += `${section}\n`
        const data = result[section] as Record<string, unknown>[]
        if (data.length > 0) {
          const headers = Object.keys(data[0])
          csv += headers.join(',') + '\n'
          for (const row of data) {
            csv += headers.map(h => {
              const val = row[h]
              return typeof val === 'string' && val.includes(',') ? `"${val}"` : String(val)
            }).join(',') + '\n'
          }
        }
        csv += '\n'
      }
      return csv
    }
  }

  function downloadExport(options: ExportOptions, filename: string): void {
    const content = exportData(options)
    const mimeType = options.format === 'json' ? 'application/json' : 'text/csv'
    const blob = new Blob([content], { type: mimeType + ';charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.${options.format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function loginAsStudent(studentId: string): boolean {
    const student = students.value.find(s => s.id === studentId)
    if (student) {
      currentStudent.value = student
      return true
    }
    return false
  }

  function logoutStudent(): void {
    currentStudent.value = null
    activeTask.value = null
  }

  function setActiveTask(taskId: string): void {
    const task = tasks.value.find(t => t.id === taskId)
    if (task) {
      activeTask.value = task
    }
  }

  function clearActiveTask(): void {
    activeTask.value = null
  }

  return {
    currentTeacher,
    currentStudent,
    students,
    groups,
    tasks,
    submissions,
    comments,
    allStudents,
    allGroups,
    allTasks,
    studentsByGroup,
    tasksByStudent,
    getStudentById,
    getGroupById,
    getTaskById,
    addStudent,
    updateStudent,
    deleteStudent,
    addGroup,
    updateGroup,
    deleteGroup,
    addStudentToGroup,
    removeStudentFromGroup,
    addTask,
    updateTask,
    deleteTask,
    assignTaskToGroup,
    assignTaskToStudent,
    getStudentProgress,
    getStudentProgressList,
    getFilteredReport,
    getClassComparison,
    getLeaderboard,
    getLearningAdvice,
    addComment,
    getCommentsByStudent,
    getCommentsByTask,
    getSubmissionsByTask,
    getSubmissionsByStudent,
    getWrongQuestionsByStudent,
    getWrongQuestionsByGroup,
    getWrongQuestionsStats,
    getTaskCompletionRate,
    getStudentsForTask,
    exportData,
    downloadExport,
    loginAsStudent,
    logoutStudent,
    activeTask,
    setActiveTask,
    clearActiveTask
  }
})
