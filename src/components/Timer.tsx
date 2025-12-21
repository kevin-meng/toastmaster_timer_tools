import React, { useEffect, useState, useRef } from 'react';
import { useTimerContext } from '../context/TimerContext';
import type { Session } from '../types';

// 生成唯一ID的辅助函数
const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

const Timer: React.FC = () => {
  const { state, dispatch } = useTimerContext();
  const [showMenu, setShowMenu] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastMouseMoveRef = useRef<number>(Date.now());
  const mouseMoveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 获取当前时间段
  const currentSegment =
    state.currentCombination?.segments[state.currentSegmentIndex] || null;
  // 获取当前时间段的剩余时间
  const getCurrentSegmentRemainingTime = () => {
    if (!state.currentCombination) return 0;

    let elapsedTime = state.elapsedTime;
    for (let i = 0; i < state.currentSegmentIndex; i++) {
      elapsedTime -= state.currentCombination.segments[i].duration;
    }

    return Math.max(
      0,
      state.currentCombination.segments[state.currentSegmentIndex].duration -
        elapsedTime
    );
  };

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 处理开始计时
  const handleStart = () => {
    if (!state.currentCombination) return;

    // 进入全屏模式
    if (document.documentElement.requestFullscreen) {
      document.documentElement
        .requestFullscreen()
        .then(() => setIsFullscreen(true));
    }

    // 创建新会话
    const session: Session = {
      id: generateId(),
      name: sessionName || '未命名会话',
      notes: sessionNotes,
      combinationId: state.currentCombination.id,
      startTime: new Date(),
      createdAt: new Date(),
    };

    dispatch({ type: 'START_SESSION', payload: session });
    dispatch({ type: 'SET_RUNNING', payload: true });
    dispatch({ type: 'SET_PAUSED', payload: false });
  };

  // 处理暂停计时
  const handlePause = () => {
    dispatch({ type: 'SET_PAUSED', payload: true });
    dispatch({ type: 'SET_RUNNING', payload: false });
  };

  // 处理继续计时
  const handleResume = () => {
    dispatch({ type: 'SET_RUNNING', payload: true });
    dispatch({ type: 'SET_PAUSED', payload: false });
  };

  // 处理停止计时
  const handleStop = () => {
    if (state.currentSession) {
      dispatch({
        type: 'END_SESSION',
        payload: { sessionId: state.currentSession.id, endTime: new Date() },
      });
    }
    dispatch({ type: 'SET_RUNNING', payload: false });
    dispatch({ type: 'SET_PAUSED', payload: false });

    // 退出全屏模式
    if (document.fullscreenElement) {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  // 处理重置计时
  const handleReset = () => {
    dispatch({ type: 'RESET_TIMER' });

    // 退出全屏模式
    if (document.fullscreenElement) {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  // 计时器逻辑
  useEffect(() => {
    if (state.isRunning) {
      timerRef.current = window.setInterval(() => {
        dispatch({
          type: 'UPDATE_ELAPSED_TIME',
          payload: state.elapsedTime + 1,
        });

        // 检查是否需要切换到下一个时间段
        if (state.currentCombination) {
          let totalDuration = 0;
          for (let i = 0; i < state.currentSegmentIndex + 1; i++) {
            totalDuration += state.currentCombination.segments[i].duration;
          }

          if (
            state.elapsedTime + 1 >= totalDuration &&
            state.currentSegmentIndex <
              state.currentCombination.segments.length - 1
          ) {
            dispatch({
              type: 'SET_CURRENT_SEGMENT_INDEX',
              payload: state.currentSegmentIndex + 1,
            });
          }
        }
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [
    state.isRunning,
    state.elapsedTime,
    state.currentCombination,
    state.currentSegmentIndex,
    dispatch,
  ]);

  // 处理鼠标移动，显示菜单
  useEffect(() => {
    const handleMouseMove = () => {
      setShowMenu(true);
      lastMouseMoveRef.current = Date.now();

      // 如果有之前的超时，清除它
      if (mouseMoveTimeoutRef.current) {
        clearTimeout(mouseMoveTimeoutRef.current);
      }

      // 设置新的超时，3秒后隐藏菜单
      mouseMoveTimeoutRef.current = setTimeout(() => {
        if (Date.now() - lastMouseMoveRef.current > 3000) {
          setShowMenu(false);
        }
      }, 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (mouseMoveTimeoutRef.current) {
        clearTimeout(mouseMoveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className={`w-full h-screen flex flex-col items-center justify-center transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
      style={{
        backgroundColor: currentSegment?.color || '#ffffff',
        color: '#ffffff',
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* 菜单 */}
      {showMenu && (
        <div className="absolute top-4 left-0 right-0 flex justify-center z-10">
          <div className="bg-black bg-opacity-50 backdrop-blur-sm p-4 rounded-lg shadow-lg">
            {!state.currentCombination && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  选择计时组合
                </label>
                <select
                  className="w-full p-2 rounded border border-gray-300 bg-white text-gray-800"
                  onChange={(e) => {
                    const combination = state.combinations.find(
                      (c) => c.id === e.target.value
                    );
                    if (combination) {
                      dispatch({
                        type: 'SET_CURRENT_COMBINATION',
                        payload: combination,
                      });
                    }
                  }}
                >
                  <option value="">-- 选择组合 --</option>
                  {state.combinations.map((combination) => (
                    <option key={combination.id} value={combination.id}>
                      {combination.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {state.currentCombination &&
              !state.isRunning &&
              !state.isPaused && (
                <div className="mb-4">
                  <div className="mb-2">
                    <label className="block text-sm font-medium mb-1">
                      会话名称
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 rounded border border-gray-300 bg-white text-gray-800"
                      placeholder="输入会话名称"
                      value={sessionName}
                      onChange={(e) => setSessionName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      备注
                    </label>
                    <textarea
                      className="w-full p-2 rounded border border-gray-300 bg-white text-gray-800"
                      placeholder="输入备注"
                      value={sessionNotes}
                      onChange={(e) => setSessionNotes(e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              )}

            <div className="flex space-x-2">
              {!state.isRunning && !state.isPaused && (
                <button
                  onClick={handleStart}
                  disabled={!state.currentCombination}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  开始
                </button>
              )}

              {state.isRunning && (
                <button
                  onClick={handlePause}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded"
                >
                  暂停
                </button>
              )}

              {state.isPaused && (
                <button
                  onClick={handleResume}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                >
                  继续
                </button>
              )}

              {(state.isRunning || state.isPaused) && (
                <button
                  onClick={handleStop}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
                >
                  停止
                </button>
              )}

              {(state.isRunning || state.isPaused || state.elapsedTime > 0) && (
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
                >
                  重置
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 计时器显示 */}
      <div className="text-center">
        <h1 className="text-4xl md:text-8xl font-bold mb-4">
          {currentSegment?.showTime
            ? formatTime(getCurrentSegmentRemainingTime())
            : ''}
        </h1>
        <p className="text-xl md:text-3xl opacity-80">{currentSegment?.name}</p>

        {state.isPaused && (
          <div className="mt-8 text-2xl md:text-4xl font-bold opacity-70 animate-pulse">
            已暂停
          </div>
        )}
      </div>

      {/* 时间线标记 */}
      {state.currentCombination && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
          <div className="flex space-x-2 bg-black bg-opacity-50 backdrop-blur-sm p-3 rounded-lg shadow-lg">
            {state.currentCombination.segments.map((segment, index) => (
              <div
                key={segment.id}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${index < state.currentSegmentIndex ? 'opacity-50 scale-75' : index === state.currentSegmentIndex ? 'scale-125 ring-2 ring-white' : ''}`}
                style={{ backgroundColor: segment.color }}
                title={segment.name}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Timer;
