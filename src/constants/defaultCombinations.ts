import type { TimingCombination } from '../types';

export const DEFAULT_COMBINATIONS: TimingCombination[] = [
  {
    id: 'table_topics',
    name: '即兴演讲',
    segments: [
      {
        id: 'tt_green',
        name: '正常时间',
        duration: 60, // 1分钟
        color: '#4ade80', // green-400
        showTime: true,
        playSound: false,
        soundType: 'default',
      },
      {
        id: 'tt_yellow',
        name: '橙色时间',
        duration: 60, // 1分钟到2分钟
        color: '#facc15', // yellow-400
        showTime: true,
        playSound: true,
        soundType: 'default',
      },
      {
        id: 'tt_red',
        name: '警告时间',
        duration: 30, // 2分钟到2分30秒
        color: '#f87171', // red-400
        showTime: true,
        playSound: true,
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
        duration: 300, // 5分钟
        color: '#4ade80',
        showTime: true,
        playSound: false,
        soundType: 'default',
      },
      {
        id: 'ps_yellow',
        name: '橙色时间',
        duration: 120, // 5分钟到7分钟 (2分钟)
        color: '#facc15',
        showTime: true,
        playSound: true,
        soundType: 'default',
      },
      {
        id: 'ps_red',
        name: '警告时间',
        duration: 30, // 7分钟到7分30秒 (30秒)
        color: '#f87171',
        showTime: true,
        playSound: true,
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
        duration: 120, // 2分钟
        color: '#4ade80',
        showTime: true,
        playSound: false,
        soundType: 'default',
      },
      {
        id: 'eval_yellow',
        name: '橙色时间',
        duration: 60, // 2分钟到3分钟
        color: '#facc15',
        showTime: true,
        playSound: true,
        soundType: 'default',
      },
      {
        id: 'eval_red',
        name: '警告时间',
        duration: 30, // 3分钟到3分30秒
        color: '#f87171',
        showTime: true,
        playSound: true,
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
        playSound: true,
        soundType: 'default',
      },
      {
        id: 'intro_red',
        name: '警告时间',
        duration: 30, // 30秒到60秒
        color: '#f87171',
        showTime: true,
        playSound: true,
        soundType: 'default',
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];
