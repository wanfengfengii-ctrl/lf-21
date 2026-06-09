import type { Achievement } from '../types/abacus'

const achievementConfigs: Omit<Achievement, 'unlocked' | 'progress' | 'unlockedAt'>[] = [
  {
    id: 'first_question',
    name: '初次尝试',
    description: '完成第一道题目',
    icon: '🎯',
    target: 1
  },
  {
    id: 'ten_questions',
    name: '小有成就',
    description: '累计完成10道题目',
    icon: '📚',
    target: 10
  },
  {
    id: 'fifty_questions',
    name: '勤奋学子',
    description: '累计完成50道题目',
    icon: '💪',
    target: 50
  },
  {
    id: 'hundred_questions',
    name: '百题斩',
    description: '累计完成100道题目',
    icon: '🏆',
    target: 100
  },
  {
    id: 'first_correct',
    name: '初战告捷',
    description: '答对第一道题',
    icon: '✨',
    target: 1
  },
  {
    id: 'five_streak',
    name: '五连胜',
    description: '连续答对5道题',
    icon: '🔥',
    target: 5
  },
  {
    id: 'ten_streak',
    name: '十连胜',
    description: '连续答对10道题',
    icon: '⚡',
    target: 10
  },
  {
    id: 'twenty_streak',
    name: '二十连胜',
    description: '连续答对20道题',
    icon: '🌟',
    target: 20
  },
  {
    id: 'first_level',
    name: '开启征程',
    description: '完成第一个关卡',
    icon: '🚀',
    target: 1
  },
  {
    id: 'five_levels',
    name: '渐入佳境',
    description: '完成5个关卡',
    icon: '🎖️',
    target: 5
  },
  {
    id: 'ten_levels',
    name: '勇往直前',
    description: '完成10个关卡',
    icon: '🏅',
    target: 10
  },
  {
    id: 'all_levels',
    name: '算盘大师',
    description: '完成全部15个关卡',
    icon: '👑',
    target: 15
  },
  {
    id: 'three_stars_one',
    name: '完美通关',
    description: '在一个关卡获得三星评价',
    icon: '⭐',
    target: 1
  },
  {
    id: 'three_stars_five',
    name: '五星学员',
    description: '在5个关卡获得三星评价',
    icon: '🌟',
    target: 5
  },
  {
    id: 'addition_master',
    name: '加法高手',
    description: '完成所有加法关卡',
    icon: '➕',
    target: 3
  },
  {
    id: 'subtraction_master',
    name: '减法高手',
    description: '完成所有减法关卡',
    icon: '➖',
    target: 3
  },
  {
    id: 'multiplication_master',
    name: '乘法高手',
    description: '完成所有乘法关卡',
    icon: '✖️',
    target: 3
  },
  {
    id: 'division_master',
    name: '除法高手',
    description: '完成所有除法关卡',
    icon: '➗',
    target: 3
  },
  {
    id: 'speed_demon',
    name: '速度之王',
    description: '在任意关卡平均每题用时少于10秒',
    icon: '🏃',
    target: 1
  },
  {
    id: 'perfect_accuracy',
    name: '百发百中',
    description: '在任意关卡获得100%正确率',
    icon: '💯',
    target: 1
  }
]

function getInitialAchievements(): Achievement[] {
  return achievementConfigs.map(config => ({
    ...config,
    unlocked: false,
    progress: 0
  }))
}

export { achievementConfigs, getInitialAchievements }
