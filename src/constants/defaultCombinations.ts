import type { TimingCombination } from '../types';

const genSeg = (id: string, name: string, duration: number, color: string, playSound: boolean, showTime = true): any => ({
  id, name, duration, color, showTime, playSound, soundType: playSound ? 'bell' : ('default' as any),
});

export const DEFAULT_COMBINATIONS: TimingCombination[] = [
  // ===== 1. 即兴演讲 1-2min (2:30) =====
  {
    id: 'table_topics',
    name: '即兴演讲 (1-2min)',
    segments: [
      genSeg('tt_green', '正常时间', 60, '#4ade80', false),
      genSeg('tt_yellow', '橙色时间', 60, '#facc15', false),
      genSeg('tt_red', '警告时间', 30, '#f87171', true),
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // ===== 2. 备稿演讲 5-7min (7:30) =====
  {
    id: 'prepared_speech',
    name: '备稿演讲 (5-7min)',
    segments: [
      genSeg('ps_green', '正常时间', 300, '#4ade80', false),
      genSeg('ps_yellow', '橙色时间', 120, '#facc15', false),
      genSeg('ps_red', '警告时间', 30, '#f87171', true),
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // ===== 3. 点评/评估 2-3min (3:30) =====
  {
    id: 'evaluation',
    name: '评估 (2-3min)',
    segments: [
      genSeg('eval_green', '正常时间', 120, '#4ade80', false),
      genSeg('eval_yellow', '橙色时间', 60, '#facc15', false),
      genSeg('eval_red', '警告时间', 30, '#f87171', true),
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // ===== 4. 自我介绍 30s-1min =====
  {
    id: 'self_intro',
    name: '自我介绍 (30s-1min)',
    segments: [
      genSeg('intro_green', '正常时间', 30, '#4ade80', false),
      genSeg('intro_red', '警告时间', 30, '#f87171', true),
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // ===== 5. 角色介绍 1-2min =====
  {
    id: 'role_intro',
    name: '角色介绍 (1-2min)',
    segments: [
      genSeg('ri_green', '正常时间', 60, '#4ade80', false),
      genSeg('ri_yellow', '橙色时间', 30, '#facc15', false),
      genSeg('ri_red', '警告时间', 30, '#f87171', true),
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // ===== 6. 主席开场 2-4min =====
  {
    id: 'president_opening',
    name: '主席开场 (2-4min)',
    segments: [
      genSeg('po_green', '正常时间', 120, '#4ade80', false),
      genSeg('po_yellow', '橙色时间', 60, '#facc15', false),
      genSeg('po_red', '警告时间', 60, '#f87171', true),
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // ===== 7. 总主持人 1-2min =====
  {
    id: 'toastmaster_host',
    name: '总主持人 (1-2min)',
    segments: [
      genSeg('tm_green', '正常时间', 60, '#4ade80', false),
      genSeg('tm_yellow', '橙色时间', 30, '#facc15', false),
      genSeg('tm_red', '警告时间', 30, '#f87171', true),
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // ===== 8. 嘉宾分享 55-59min =====
  {
    id: 'guest_sharing',
    name: '嘉宾分享 (55-59min)',
    segments: [
      genSeg('gs_green', '正常时间', 3300, '#4ade80', false),  // 55 min
      genSeg('gs_yellow', '橙色时间', 240, '#facc15', false),   // 4 min
      genSeg('gs_red', '警告时间', 60, '#f87171', true),         // 1 min
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // ===== 9. 即兴主持人 1min 规则 + 每人 2min =====
  {
    id: 'table_topics_host',
    name: '即兴主持人 (每人2min)',
    segments: [
      genSeg('tth_green', '准备时间', 120, '#4ade80', false),
      genSeg('tth_yellow', '橙色时间', 30, '#facc15', false),
      genSeg('tth_red', '警告时间', 30, '#f87171', true),
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // ===== 10. 工作坊/培训 25-30min =====
  {
    id: 'workshop',
    name: '工作坊 (25-30min)',
    segments: [
      genSeg('ws_green', '正常时间', 1500, '#4ade80', false),   // 25 min
      genSeg('ws_yellow', '橙色时间', 300, '#facc15', false),    // 5 min
      genSeg('ws_red', '警告时间', 60, '#f87171', true),          // 1 min
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];
