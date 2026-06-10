import type { TimingCombination, SoundType } from '../types';

// 红段 30s 不计入时间范围
// 按上限拆分：绿 + 黄 = upperMin * 60，红段额外 +30s
// 黄段：upperMin >= 3 → 60s，totalSec >= 90 → 30s，否则 0
const mk = (id: string, name: string, lowerMin: number, upperMin: number): TimingCombination => {
  const totalSec = upperMin * 60;
  const yellow = upperMin >= 3 ? 60 : (totalSec >= 90 ? 30 : 0);
  const green = totalSec - yellow;

  const label = lowerMin > 0 ? `${lowerMin}-${upperMin}min` : `${upperMin}min`;

  return {
    id,
    name: `${name} (${label})`,
    segments: [
      { id: `${id}_g`, name: '正常时间', duration: green, color: '#4ade80', showTime: true, playSound: false, soundType: 'default' as SoundType },
      ...(yellow > 0 ? [{ id: `${id}_y`, name: '橙色时间', duration: yellow, color: '#facc15', showTime: true, playSound: false, soundType: 'default' as SoundType }] : []),
      { id: `${id}_r`, name: '警告时间(不计入)', duration: 30, color: '#f87171', showTime: true, playSound: true, soundType: 'bell' as SoundType },
    ],
    createdAt: new Date(), updatedAt: new Date(),
  };
};

export const DEFAULT_COMBINATIONS: TimingCombination[] = [
  mk('table_topics', '即兴演讲', 1, 2),
  mk('prepared_speech', '备稿演讲', 5, 7),
  mk('evaluation', '评估', 2, 3),
  mk('self_intro', '自我介绍', 0, 1),
  mk('role_intro', '角色介绍', 1, 2),
  mk('president_opening', '主席开场', 2, 4),
  mk('toastmaster_host', '总主持人', 1, 2),
  mk('guest_sharing', '嘉宾分享', 55, 59),
  mk('table_topics_host', '即兴主持人(每人)', 1, 2),
  mk('workshop', '工作坊', 25, 30),
];
