import type { TimingCombination } from '../types';

// 红段 30s 不算在时间范围内（演讲者允许在红段结束前完成）
// 按上限拆分：绿 + 黄 = 上限 * 60，红额外 +30s
// 黄段：上限 >= 3min → 60s，否则有空间 → 30s，无空间 → 0
const mk = (id: string, name: string, upperMin: number): TimingCombination => {
  const totalSec = upperMin * 60;  // 上限秒数（不含红段）
  const yellow = upperMin >= 3 ? 60 : (totalSec >= 90 ? 30 : 0); // >=3min黄60s, else if >=90s黄30s
  const green = totalSec - yellow;

  return {
    id,
    name: `${name} (上限${upperMin}min)`,
    segments: [
      { id: `${id}_g`, name: '正常时间', duration: green, color: '#4ade80', showTime: true, playSound: false, soundType: 'default' },
      ...(yellow > 0 ? [{ id: `${id}_y`, name: '橙色时间', duration: yellow, color: '#facc15', showTime: true, playSound: false, soundType: 'default' }] : []),
      { id: `${id}_r`, name: '警告时间(不计入)', duration: 30, color: '#f87171', showTime: true, playSound: true, soundType: 'bell' },
    ],
    createdAt: new Date(), updatedAt: new Date(),
  };
};

export const DEFAULT_COMBINATIONS: TimingCombination[] = [
  mk('table_topics', '即兴演讲', 2),
  mk('prepared_speech', '备稿演讲', 7),
  mk('evaluation', '评估', 3),
  mk('self_intro', '自我介绍', 1),
  mk('role_intro', '角色介绍', 2),
  mk('president_opening', '主席开场', 4),
  mk('toastmaster_host', '总主持人', 2),
  mk('guest_sharing', '嘉宾分享', 59),
  mk('table_topics_host', '即兴主持人(每人)', 2),
  mk('workshop', '工作坊', 30),
];
