import type { TimingCombination, Session, TimelineItem } from '../types';

// 定义存储键
const STORAGE_KEYS = {
  COMBINATIONS: 'toastmaster_timer_combinations',
  TIMELINE: 'toastmaster_timer_timeline',
  SESSION: 'toastmaster_timer_current_session',
  SESSIONS: 'toastmaster_timer_sessions',
};

// 存储工具类
export const storage = {
  // 计时组合相关方法
  getCombinations(): TimingCombination[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.COMBINATIONS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get combinations from localStorage:', error);
      return [];
    }
  },

  saveCombinations(combinations: TimingCombination[]): void {
    try {
      localStorage.setItem(
        STORAGE_KEYS.COMBINATIONS,
        JSON.stringify(combinations)
      );
    } catch (error) {
      console.error('Failed to save combinations to localStorage:', error);
    }
  },

  // 时间线相关方法
  getTimeline(): TimelineItem[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TIMELINE);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get timeline from localStorage:', error);
      return [];
    }
  },

  saveTimeline(timeline: TimelineItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TIMELINE, JSON.stringify(timeline));
    } catch (error) {
      console.error('Failed to save timeline to localStorage:', error);
    }
  },

  // 当前会话相关方法
  getCurrentSession(): Session | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SESSION);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to get current session from localStorage:', error);
      return null;
    }
  },

  saveCurrentSession(session: Session | null): void {
    try {
      if (session) {
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
      } else {
        localStorage.removeItem(STORAGE_KEYS.SESSION);
      }
    } catch (error) {
      console.error('Failed to save current session to localStorage:', error);
    }
  },

  // 会话列表相关方法
  getSessions(): Session[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (!stored) return [];
      
      const sessions = JSON.parse(stored);
      // 转换日期字符串为Date对象
      return sessions.map((session: any) => ({
        ...session,
        startTime: new Date(session.startTime),
        endTime: session.endTime ? new Date(session.endTime) : undefined,
        createdAt: new Date(session.createdAt),
      }));
    } catch (error) {
      console.error('Failed to get sessions from localStorage:', error);
      return [];
    }
  },

  saveSessions(sessions: Session[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to save sessions to localStorage:', error);
    }
  },

  // 清除所有数据
  clearAll(): void {
    try {
      Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  },
};

// 数据迁移函数（未来扩展用）
export const migrateStorage = () => {
  // 可以在这里添加数据迁移逻辑
  // 例如：从旧版本的存储格式迁移到新版本
};
