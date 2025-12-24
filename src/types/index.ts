// 闹铃声类型
export type SoundType = 'default' | 'bell' | 'chime' | 'beep' | 'alarm' | 'custom';

// 时间段模型
export interface TimingSegment {
  id: string;
  name: string;
  duration: number; // 秒
  color: string;
  showTime: boolean;
  playSound: boolean;
  soundType: SoundType;
  soundUrl?: string;
}

// 计时组合模型
export interface TimingCombination {
  id: string;
  name: string;
  segments: TimingSegment[];
  createdAt: Date;
  updatedAt: Date;
}

// 计时记录模型
export interface Session {
  id: string;
  name: string;
  notes?: string;
  combinationId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // 总时长（秒）
  createdAt: Date;
  updatedAt?: Date;
  deleted?: boolean;
}

// 时间线项目模型
export interface TimelineItem {
  id: string;
  sessionId: string;
  segmentId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // 秒
  status: 'active' | 'completed' | 'paused';
}

// 应用状态模型
export interface AppState {
  combinations: TimingCombination[];
  currentCombination: TimingCombination | null;
  currentSession: Session | null;
  timeline: TimelineItem[];
  isRunning: boolean;
  isPaused: boolean;
  elapsedTime: number; // 已用时间（秒）
  currentSegmentIndex: number;
}
