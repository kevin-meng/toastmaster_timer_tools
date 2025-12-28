import type { TimingCombination } from '../types';

export const DEFAULT_COMBINATIONS: TimingCombination[] = [
  {
    id: 'table_topics',
    name: '即兴演讲',
    segments: [
      {
        id: 'tt_green',
        name: '正常时间',
        duration: 60, // 1分钟 (0-1:00)
        color: '#4ade80', // green-400
        showTime: true,
        playSound: false, // 绿牌不响铃
        soundType: 'default',
      },
      {
        id: 'tt_yellow',
        name: '橙色时间',
        duration: 60, // 1分钟到2分钟 (1:00-2:00)
        color: '#facc15', // yellow-400
        showTime: true,
        playSound: false, // 黄牌不响铃
        soundType: 'default',
      },
      {
        id: 'tt_red',
        name: '警告时间',
        duration: 30, // 2分钟到2分30秒 (2:00-2:30)
        color: '#f87171', // red-400
        showTime: true,
        playSound: true, // 红牌开始前响铃 (提示进入红牌)
        soundType: 'default',
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'prepared_speech',
    name: '备稿演讲',
    segments: [
      {
        id: 'ps_green',
        name: '正常时间',
        duration: 300, // 5分钟 (0-5:00)
        color: '#4ade80',
        showTime: true,
        playSound: false,
        soundType: 'default',
      },
      {
        id: 'ps_yellow',
        name: '橙色时间',
        duration: 120, // 5分钟到7分钟 (5:00-7:00)
        color: '#facc15',
        showTime: true,
        playSound: false,
        soundType: 'default',
      },
      {
        id: 'ps_red',
        name: '警告时间',
        duration: 30, // 7分钟到7分30秒 (7:00-7:30)
        color: '#f87171',
        showTime: true,
        playSound: true, // 红牌开始前响铃
        soundType: 'default',
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'evaluation',
    name: '点评/评估',
    segments: [
      {
        id: 'eval_green',
        name: '正常时间',
        duration: 120, // 2分钟 (0-2:00)
        color: '#4ade80',
        showTime: true,
        playSound: false,
        soundType: 'default',
      },
      {
        id: 'eval_yellow',
        name: '橙色时间',
        duration: 60, // 2分钟到3分钟 (2:00-3:00)
        color: '#facc15',
        showTime: true,
        playSound: false,
        soundType: 'default',
      },
      {
        id: 'eval_red',
        name: '警告时间',
        duration: 30, // 3分钟到3分30秒 (3:00-3:30)
        color: '#f87171',
        showTime: true,
        playSound: true, // 红牌开始前响铃
        soundType: 'default',
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'self_intro',
    name: '自我介绍',
    segments: [
      {
        id: 'intro_green',
        name: '正常时间',
        duration: 30, // 30秒
        color: '#4ade80',
        showTime: true,
        playSound: false,
        soundType: 'default',
      },
      {
        id: 'intro_red',
        name: '警告时间',
        duration: 30, // 30秒到60秒
        color: '#f87171',
        showTime: true,
        playSound: true, // 红牌开始前响铃
        soundType: 'default',
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];
