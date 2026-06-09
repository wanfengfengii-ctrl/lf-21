import type { LevelConfig, LevelType } from '../types/abacus'

const levelConfigs: Omit<LevelConfig, 'unlocked' | 'completed' | 'bestScore' | 'bestTime' | 'stars'>[] = [
  {
    id: 1,
    name: '加法入门',
    type: 'addition',
    difficulty: 'easy',
    description: '学习一位数加法的基本拨珠方法',
    goals: ['掌握一位数加法', '熟悉下珠拨珠动作', '了解进位概念'],
    tips: [
      '下珠一颗代表1，向上拨表示加',
      '当某一档满十时，要向前一位进一',
      '先拨大的数，再加小的数'
    ],
    questionCount: 5,
    passingScore: 60
  },
  {
    id: 2,
    name: '加法进阶',
    type: 'addition',
    difficulty: 'easy',
    description: '练习两位数加法，掌握进位技巧',
    goals: ['掌握两位数加法', '熟练进位操作', '提高拨珠速度'],
    tips: [
      '从个位开始计算，逐位向左推进',
      '进位时要先清本档，再进前档',
      '注意上珠的使用，一颗代表5'
    ],
    questionCount: 8,
    passingScore: 70
  },
  {
    id: 3,
    name: '加法挑战',
    type: 'addition',
    difficulty: 'medium',
    description: '挑战三位数加法，提升心算与拨珠能力',
    goals: ['掌握三位数加法', '连续进位操作', '准确率达到80%以上'],
    tips: [
      '三位数加法要注意数位对齐',
      '连续进位时要保持节奏稳定',
      '完成后检查一下结果是否合理'
    ],
    questionCount: 10,
    passingScore: 75
  },
  {
    id: 4,
    name: '减法入门',
    type: 'subtraction',
    difficulty: 'easy',
    description: '学习一位数减法的基本拨珠方法',
    goals: ['掌握一位数减法', '熟悉下珠回拨动作', '了解借位概念'],
    tips: [
      '减法是加法的逆运算，下珠向下拨表示减',
      '不够减时要向前一位借一',
      '借一当十，记得减去借走的数'
    ],
    questionCount: 5,
    passingScore: 60
  },
  {
    id: 5,
    name: '减法进阶',
    type: 'subtraction',
    difficulty: 'easy',
    description: '练习两位数减法，掌握借位技巧',
    goals: ['掌握两位数减法', '熟练借位操作', '提高拨珠速度'],
    tips: [
      '从个位开始减，逐位向左推进',
      '借位时要先从前档退一，再在本档加十',
      '注意上珠的退回操作'
    ],
    questionCount: 8,
    passingScore: 70
  },
  {
    id: 6,
    name: '减法挑战',
    type: 'subtraction',
    difficulty: 'medium',
    description: '挑战三位数减法，提升心算与拨珠能力',
    goals: ['掌握三位数减法', '连续借位操作', '准确率达到80%以上'],
    tips: [
      '三位数减法要注意数位对齐',
      '连续借位时要仔细，不要漏减借位',
      '可以用加法来验算结果是否正确'
    ],
    questionCount: 10,
    passingScore: 75
  },
  {
    id: 7,
    name: '乘法入门',
    type: 'multiplication',
    difficulty: 'easy',
    description: '学习九九乘法表的拨珠表示',
    goals: ['掌握乘法口诀', '一位数乘一位数', '理解乘法的本质'],
    tips: [
      '乘法是相同加数的简便运算',
      '熟记九九乘法表是基础',
      '注意积的位置要放对档位'
    ],
    questionCount: 6,
    passingScore: 60
  },
  {
    id: 8,
    name: '乘法进阶',
    type: 'multiplication',
    difficulty: 'medium',
    description: '练习两位数乘一位数，掌握错位相加',
    goals: ['两位数乘一位数', '错位相加技巧', '提高计算速度'],
    tips: [
      '用乘数的每一位去乘被乘数',
      '注意积的数位要对齐',
      '错位相加时要仔细进位'
    ],
    questionCount: 8,
    passingScore: 70
  },
  {
    id: 9,
    name: '乘法挑战',
    type: 'multiplication',
    difficulty: 'hard',
    description: '挑战两位数乘两位数，综合运用拨珠技巧',
    goals: ['两位数乘两位数', '多次错位相加', '准确率达到75%以上'],
    tips: [
      '两位数乘法要分步骤计算',
      '每次部分积都要对准数位',
      '最后相加时要注意进位'
    ],
    questionCount: 10,
    passingScore: 75
  },
  {
    id: 10,
    name: '除法入门',
    type: 'division',
    difficulty: 'easy',
    description: '学习简单除法的拨珠方法',
    goals: ['掌握除法基本概念', '一位数除一位数', '了解余数概念'],
    tips: [
      '除法是乘法的逆运算',
      '想乘法口诀来求商',
      '余数要比除数小'
    ],
    questionCount: 6,
    passingScore: 60
  },
  {
    id: 11,
    name: '除法进阶',
    type: 'division',
    difficulty: 'medium',
    description: '练习两位数除以一位数，掌握试商技巧',
    goals: ['两位数除以一位数', '试商的方法', '提高计算速度'],
    tips: [
      '先看被除数的第一位，够除就商',
      '不够除就看前两位',
      '每次除得的余数要比除数小'
    ],
    questionCount: 8,
    passingScore: 70
  },
  {
    id: 12,
    name: '除法挑战',
    type: 'division',
    difficulty: 'hard',
    description: '挑战三位数除以两位数，提升综合运算能力',
    goals: ['三位数除以两位数', '调商技巧', '准确率达到75%以上'],
    tips: [
      '除数是两位数，先看被除数前两位',
      '可以用四舍五入法试商',
      '试商后要验证，不合适再调整'
    ],
    questionCount: 10,
    passingScore: 75
  },
  {
    id: 13,
    name: '四则混合（初级）',
    type: 'mixed',
    difficulty: 'easy',
    description: '综合练习加减乘除四种运算',
    goals: ['辨别运算类型', '灵活切换拨珠方法', '综合运算能力'],
    tips: [
      '先看清运算符号再开始',
      '不同运算有不同的拨珠顺序',
      '做完后检查运算符号是否正确'
    ],
    questionCount: 10,
    passingScore: 70
  },
  {
    id: 14,
    name: '四则混合（中级）',
    type: 'mixed',
    difficulty: 'medium',
    description: '中等难度的四则混合运算',
    goals: ['中等难度混合运算', '提高运算速度', '准确率稳定在80%以上'],
    tips: [
      '保持冷静，看清每一道题',
      '合理安排时间，不要急躁',
      '遇到难题可以先跳过，最后再做'
    ],
    questionCount: 12,
    passingScore: 75
  },
  {
    id: 15,
    name: '算盘大师',
    type: 'mixed',
    difficulty: 'hard',
    description: '终极挑战，成为真正的算盘大师！',
    goals: ['高难度混合运算', '准确率85%以上', '成为算盘大师'],
    tips: [
      '深呼吸，保持放松',
      '相信自己的能力',
      '每完成一题都是进步！'
    ],
    questionCount: 15,
    passingScore: 80
  }
]

function getInitialLevels(): LevelConfig[] {
  return levelConfigs.map((config, index) => ({
    ...config,
    unlocked: index === 0,
    completed: false,
    bestScore: 0,
    bestTime: 0,
    stars: 0
  }))
}

function getOperatorsForType(type: LevelType): OperatorType[] {
  switch (type) {
    case 'addition': return ['+']
    case 'subtraction': return ['-']
    case 'multiplication': return ['×']
    case 'division': return ['÷']
    case 'mixed': return ['+', '-', '×', '÷']
    default: return ['+']
  }
}

type OperatorType = '+' | '-' | '×' | '÷'

export { levelConfigs, getInitialLevels, getOperatorsForType }
