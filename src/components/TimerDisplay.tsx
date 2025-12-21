import React, { useState, useEffect, useRef } from 'react';
import { useTimerContext } from '../context/TimerContext';

const TimerDisplay: React.FC = () => {
  const { state, dispatch } = useTimerContext();
  const [showMenu, setShowMenu] = useState(false);
  const [mouseMoveTimeout, setMouseMoveTimeout] = 
    useState<ReturnType<typeof setTimeout> | null>(null);
  const [sessionName, setSessionName] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 处理鼠标移动事件，显示菜单
  const handleMouseMove = () => {
    setShowMenu(true);
    
    if (mouseMoveTimeout) {
      clearTimeout(mouseMoveTimeout);
    }
    
    const timeout = setTimeout(() => {
      setShowMenu(false);
    }, 2000);
    
    setMouseMoveTimeout(timeout);
  };

  // 格式化时间为 mm:ss 格式
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 获取当前时间段
  const getCurrentSegment = () => {
    if (
      !state.currentCombination ||
      state.currentSegmentIndex >= state.currentCombination.segments.length
    ) {
      return null;
    }
    return state.currentCombination.segments[state.currentSegmentIndex];
  };

  // 计算当前时间段剩余时间
  const getRemainingTime = () => {
    const currentSegment = getCurrentSegment();
    if (!currentSegment) return 0;

    let totalTime = 0;
    for (let i = 0; i < state.currentSegmentIndex; i++) {
      totalTime += state.currentCombination!.segments[i].duration;
    }

    const timeInCurrentSegment = state.elapsedTime - totalTime;
    return Math.max(0, currentSegment.duration - timeInCurrentSegment);
  };

  // 计时器逻辑
  useEffect(() => {
    if (state.isRunning && !state.isPaused) {
      timerRef.current = setInterval(() => {
        dispatch({
          type: 'UPDATE_ELAPSED_TIME',
          payload: state.elapsedTime + 1,
        });

        // 检查是否需要切换到下一个时间段
        if (state.currentCombination) {
          let totalTime = 0;
          for (let i = 0; i < state.currentSegmentIndex + 1; i++) {
            totalTime += state.currentCombination.segments[i].duration;
          }

          if (
            state.elapsedTime + 1 >= totalTime &&
            state.currentSegmentIndex <
              state.currentCombination.segments.length - 1
          ) {
            dispatch({
              type: 'SET_CURRENT_SEGMENT_INDEX',
              payload: state.currentSegmentIndex + 1,
            });

            // 播放提示音（如果启用）
            const currentSegment =
              state.currentCombination.segments[state.currentSegmentIndex];
            if (currentSegment.playSound) {
              // 这里可以添加播放提示音的逻辑
              console.log('Playing sound for segment:', currentSegment.name);
            }
          }
        }
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [
    state.isRunning,
    state.isPaused,
    state.elapsedTime,
    state.currentSegmentIndex,
    state.currentCombination,
    dispatch,
  ]);

  // 开始计时
  const handleStart = () => {
    if (!state.currentCombination) return;

    // 创建新的会话
    const newSession = {
      id:
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15),
      name: sessionName || '未命名会话',
      notes: sessionNotes,
      combinationId: state.currentCombination.id,
      startTime: new Date(),
      createdAt: new Date(),
    };

    dispatch({ type: 'START_SESSION', payload: newSession });

    // 进入全屏模式
    if (!isFullscreen) {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
        setIsFullscreen(true);
      }
    }
  };

  // 暂停计时
  const handlePause = () => {
    dispatch({ type: 'SET_PAUSED', payload: !state.isPaused });
  };

  // 重置计时
  const handleReset = () => {
    dispatch({ type: 'RESET_TIMER' });

    // 退出全屏模式
    if (isFullscreen && document.exitFullscreen) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // 结束计时
  const handleEnd = () => {
    if (state.currentSession) {
      dispatch({
        type: 'END_SESSION',
        payload: { sessionId: state.currentSession.id, endTime: new Date() },
      });

      // 退出全屏模式
      if (isFullscreen && document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // 选择计时组合
  const handleSelectCombination = (combinationId: string) => {
    const combination = state.combinations.find((c) => c.id === combinationId);
    if (combination) {
      dispatch({ type: 'SET_CURRENT_COMBINATION', payload: combination });
    }
  };

  const currentSegment = getCurrentSegment();
  const remainingTime = getRemainingTime();
  const totalElapsedTime = state.elapsedTime;

  return (
    <div className="space-y-6">
      {/* 选择计时组合和会话信息 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            选择计时组合
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            onChange={(e) => handleSelectCombination(e.target.value)}
            value={state.currentCombination?.id || ''}
          >
            <option value="">请选择计时组合</option>
            {state.combinations.map((combination) => (
              <option key={combination.id} value={combination.id}>
                {combination.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            会话名称
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="输入会话名称"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            会话备注
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="输入会话备注（可选）"
            rows={3}
            value={sessionNotes}
            onChange={(e) => setSessionNotes(e.target.value)}
          />
        </div>
      </div>

      {/* 计时器显示区域 */}
      <div
        className="relative w-full h-96 rounded-lg shadow-lg overflow-hidden cursor-pointer"
        style={{ backgroundColor: currentSegment?.color || '#4ade80' }}
        onMouseMove={handleMouseMove}
      >
        {/* 计时器内容 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {currentSegment && (
            <>
              <h3 className="text-white text-2xl font-semibold mb-4">
                {currentSegment.name}
              </h3>
              {currentSegment.showTime && (
                <div className="text-white text-9xl font-bold">
                  {formatTime(remainingTime)}
                </div>
              )}
              <div className="text-white text-4xl font-medium mt-4">
                总时长: {formatTime(totalElapsedTime)}
              </div>
            </>
          )}
        </div>

        {/* 计时菜单（鼠标移动时显示） */}
        {showMenu && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 space-y-4">
              <div className="text-center">
                <h4 className="text-xl font-semibold text-gray-800">
                  计时控制
                </h4>
              </div>

              <div className="flex justify-center space-x-4">
                {!state.isRunning ? (
                  <button
                    onClick={handleStart}
                    className="px-6 py-3 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    disabled={!state.currentCombination}
                  >
                    开始
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handlePause}
                      className="px-6 py-3 bg-yellow-600 text-white rounded-md shadow-sm hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                    >
                      {state.isPaused ? '继续' : '暂停'}
                    </button>
                    <button
                      onClick={handleReset}
                      className="px-6 py-3 bg-gray-600 text-white rounded-md shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      重置
                    </button>
                    <button
                      onClick={handleEnd}
                      className="px-6 py-3 bg-red-600 text-white rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      结束
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 时间段进度条 */}
      {state.currentCombination && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">时间段进度</h4>
          <div className="space-y-2">
            {state.currentCombination.segments.map((segment, index) => (
              <div key={segment.id} className="space-y-1">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>{segment.name}</span>
                  <span>{formatTime(segment.duration)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="h-2.5 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: segment.color,
                      width:
                        index < state.currentSegmentIndex
                          ? '100%'
                          : index === state.currentSegmentIndex
                            ? `${((state.elapsedTime - state.currentCombination!.segments.slice(0, index).reduce((sum, s) => sum + s.duration, 0)) / segment.duration) * 100}%`
                            : '0%',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimerDisplay;
