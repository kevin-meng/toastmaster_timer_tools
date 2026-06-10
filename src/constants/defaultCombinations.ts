import type { TimingCombination } from '../types';

// 规则：按上限拆 3 段：绿=上限-90s-黄, 红=30s, 黄=min(60, 上限-绿-红)
// 如果上限-红-绿 <= 0：不设黄段
// 如果上限 * 60 - 30 - green <= 0：无绿段（极短）
const makeSegments = (green: number, yellow: number): any[] => {
  const segs: any[] = [];
  if (green > 0) segs.push({ id: `${Math.random().toString(36).substring(2,8)}`, name: '正常时间', duration: green, color: '#4ade80', showTime: true, playSound: false, soundType: 'default' });
  if (yellow > 0) segs.push({ id: `${Math.random().toString(36).substring(2,8)}`, name: '橙色时间', duration: yellow, color: '#facc15', showTime: true, playSound: false, soundType: 'default' });
  segs.push({ id: `${Math.random().toString(36).substring(2,8)}`, name: '警告时间', duration: 30, color: '#f87171', showTime: true, playSound: true, soundType: 'bell' });
  return segs;
};

// upperMin: 上限（分钟），按此拆分 3 段
const mk = (id: string, name: string, upperMin: number): TimingCombination => {
  const totalSec = upperMin * 60;
  const red = 30;
  const yellow = upperMin >= 3 ? 60 : (totalSec - red > 30 ? 30 : 0); // >=3min 黄60s, 其余看空间
  const green = totalSec - yellow - red;
  return {
    id,
    name: `${name} (上限${upperMin}min)`,
    segments: green > 0
      ? [
          { id: `${id}_g`, name: '正常时间', duration: green, color: '#4ade80', showTime: true, playSound: false, soundType: 'default' },
          { id: `${id}_y`, name: '橙色时间', duration: yellow, color: '#facc15', showTime: true, playSound: false, soundType: 'default' },
          { id: `${id}_r`, name: '警告时间', duration: red, color: '#f87171', showTime: true, playSound: true, soundType: 'bell' },
        ]
      : [
          { id: `${id}_g`, name: '正常时间', duration: totalSec - red, color: '#4ade80', showTime: true, playSound: false, soundType: 'default' },
          { id: `${id}_r`, name: '警告时间', duration: red, color: '#f87171', showTime: true, playSound: true, soundType: 'bell' },
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
