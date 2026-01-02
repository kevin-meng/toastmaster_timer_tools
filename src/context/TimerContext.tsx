import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { TimingCombination, Session, TimelineItem } from '../types';
import { storage } from '../utils/storage';

// 定义动作类型
type TimerAction =
  | { type: 'SET_COMBINATIONS'; payload: TimingCombination[] }
  | { type: 'ADD_COMBINATION'; payload: TimingCombination }
  | { type: 'UPDATE_COMBINATION'; payload: TimingCombination }
  | { type: 'DELETE_COMBINATION'; payload: string }
  | { type: 'SET_CURRENT_COMBINATION'; payload: TimingCombination | null }
  | { type: 'START_SESSION'; payload: Session }
  | { type: 'END_SESSION'; payload: { sessionId: string; endTime: Date } }
  | {
      type: 'UPDATE_SESSION_NOTES';
      payload: { sessionId: string; notes: string };
    }
  | { type: 'ADD_TIMELINE_ITEM'; payload: TimelineItem }
  | { type: 'UPDATE_TIMELINE_ITEM'; payload: TimelineItem }
  | { type: 'SET_SESSIONS'; payload: Session[] }
  | { type: 'SET_RUNNING'; payload: boolean }
  | { type: 'SET_PAUSED'; payload: boolean }
  | { type: 'UPDATE_ELAPSED_TIME'; payload: number }
  | { type: 'SET_CURRENT_SEGMENT_INDEX'; payload: number }
  | { type: 'RESET_TIMER' }
  | { type: 'TOGGLE_COUNTDOWN_DISPLAY' };

// 定义上下文状态
interface TimerContextState {
  combinations: TimingCombination[];
  sessions: Session[];
  currentCombination: TimingCombination | null;
  currentSession: Session | null;
  timeline: TimelineItem[];
  isRunning: boolean;
  isPaused: boolean;
  elapsedTime: number;
  currentSegmentIndex: number;
  showCountdown: boolean;
}



// 创建上下文
const TimerContext = createContext<{
  state: TimerContextState;
  dispatch: React.Dispatch<TimerAction>;
} | null>(null);

// 状态 reducer
const timerReducer = (
  state: TimerContextState,
  action: TimerAction
): TimerContextState => {
  switch (action.type) {
    case 'SET_COMBINATIONS':
      return { ...state, combinations: action.payload };
    case 'ADD_COMBINATION':
      return {
        ...state,
        combinations: [...state.combinations, action.payload],
      };
    case 'UPDATE_COMBINATION':
      return {
        ...state,
        combinations: state.combinations.map((c) =>
          c.id === action.payload.id ? action.payload : c
        ),
        currentCombination:
          state.currentCombination?.id === action.payload.id
            ? action.payload
            : state.currentCombination,
      };
    case 'DELETE_COMBINATION':
      return {
        ...state,
        combinations: state.combinations.filter((c) => c.id !== action.payload),
        currentCombination:
          state.currentCombination?.id === action.payload
            ? null
            : state.currentCombination,
      };
    case 'SET_CURRENT_COMBINATION':
      return { ...state, currentCombination: action.payload };
    case 'START_SESSION':
      return {
        ...state,
        sessions: [...state.sessions, action.payload],
        currentSession: action.payload,
        isRunning: true,
        isPaused: false,
        elapsedTime: 0,
        currentSegmentIndex: 0,
        showCountdown: true,
      };
    case 'END_SESSION':
      return {
        ...state,
        sessions: state.sessions.map((session) =>
          session.id === action.payload.sessionId
            ? {
                ...session,
                endTime: action.payload.endTime,
                duration: state.elapsedTime, // 直接使用计时器的累计时间
              }
            : session
        ),
        currentSession:
          state.currentSession?.id === action.payload.sessionId
            ? {
                ...state.currentSession,
                endTime: action.payload.endTime,
                duration: state.elapsedTime, // 直接使用计时器的累计时间
              }
            : state.currentSession,
        isRunning: false,
        isPaused: false,
      };
    case 'UPDATE_SESSION_NOTES':
      return {
        ...state,
        sessions: state.sessions.map((session) =>
          session.id === action.payload.sessionId
            ? { ...session, notes: action.payload.notes }
            : session
        ),
        currentSession:
          state.currentSession?.id === action.payload.sessionId
            ? { ...state.currentSession, notes: action.payload.notes }
            : state.currentSession,
      };
    case 'ADD_TIMELINE_ITEM':
      return { ...state, timeline: [...state.timeline, action.payload] };
    case 'UPDATE_TIMELINE_ITEM':
      return {
        ...state,
        timeline: state.timeline.map((item) =>
          item.id === action.payload.id ? action.payload : item
        ),
      };
    case 'SET_RUNNING':
      return { ...state, isRunning: action.payload };
    case 'SET_PAUSED':
      return { ...state, isPaused: action.payload };
    case 'UPDATE_ELAPSED_TIME':
      return { ...state, elapsedTime: action.payload };
    case 'SET_CURRENT_SEGMENT_INDEX':
      return { ...state, currentSegmentIndex: action.payload };
    case 'TOGGLE_COUNTDOWN_DISPLAY':
      return { ...state, showCountdown: !state.showCountdown };
    case 'SET_SESSIONS':
      return {
        ...state,
        sessions: action.payload,
        currentSession: state.currentSession && action.payload.some(s => s.id === state.currentSession!.id) ? state.currentSession : null,
      };
    case 'RESET_TIMER':
      return {
        ...state,
        isRunning: false,
        isPaused: false,
        elapsedTime: 0,
        currentSegmentIndex: 0,
        currentSession: null,
        showCountdown: true,
      };
    default:
      return state;
  };
};

import { DEFAULT_COMBINATIONS } from '../constants/defaultCombinations';

// 上下文提供者组件
export const TimerProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // 从localStorage加载初始数据
  const initialData = {
    combinations: storage.getCombinations().length > 0 ? storage.getCombinations() : DEFAULT_COMBINATIONS,
    sessions: storage.getSessions(),
    currentCombination: null,
    currentSession: null,
    timeline: [],
    isRunning: false,
    isPaused: false,
    elapsedTime: 0,
    currentSegmentIndex: 0,
    showCountdown: true,
  };

  const [state, dispatch] = useReducer(timerReducer, initialData);

  // 监听combinations变化，保存到localStorage
  useEffect(() => {
    storage.saveCombinations(state.combinations);
  }, [state.combinations]);

  // 监听sessions变化，保存到localStorage
  useEffect(() => {
    storage.saveSessions(state.sessions);
  }, [state.sessions]);

  return (
    <TimerContext.Provider value={{ state, dispatch }}>
      {children}
    </TimerContext.Provider>
  );
};

// 自定义钩子，用于访问上下文
export function useTimerContext() {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimerContext must be used within a TimerProvider');
  }
  return context;
}
