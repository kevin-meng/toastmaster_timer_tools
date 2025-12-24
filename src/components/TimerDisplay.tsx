import React, { useState, useEffect, useRef } from 'react';
import { useTimerContext } from '../context/TimerContext';

const TimerDisplay: React.FC = () => {
  const { state, dispatch } = useTimerContext();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 格式化时间为 mm:ss 格式
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 获取当前时间段
  const getCurrentSegment = () => {
    if (!state.currentCombination) {
      return null;
    }
    // 确保当前段索引在有效范围内
    const validIndex = Math.min(
      Math.max(0, state.currentSegmentIndex),
      state.currentCombination.segments.length - 1
    );
    return state.currentCombination.segments[validIndex];
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

  // 播放声音函数 - 3个素材对应3个选项
  const playSound = (soundType: string) => {
    try {
      // 声音类型到文件路径的映射 - 3个素材对应3个选项
      const soundMap: Record<string, string> = {
        bell: '/sounds/bell.wav',
        chime: '/sounds/chime.wav',
        beep: '/sounds/bell_service.wav',
        alarm: '/sounds/bell_service.wav',
        default: '/sounds/bell.wav',
        custom: '/sounds/bell.wav'
      };
      
      // 创建音频对象并播放
      const audio = new Audio(soundMap[soundType] || soundMap.default);
      audio.play().catch(err => {
        console.error('Failed to play sound:', err);
      });
    } catch (error) {
      console.error('Error playing sound:', error);
    }
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
            // 播放当前段结束的提示音
            const currentSegment = state.currentCombination.segments[state.currentSegmentIndex];
            if (currentSegment.playSound) {
              playSound(currentSegment.soundType);
            }
            
            // 切换到下一个时间段
            dispatch({
              type: 'SET_CURRENT_SEGMENT_INDEX',
              payload: state.currentSegmentIndex + 1,
            });
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

  // 进入/退出全屏模式
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const currentSegment = getCurrentSegment();
  const remainingTime = getRemainingTime();

  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* 计时器显示区域 */}
      <div
        className="w-full h-full relative overflow-hidden min-h-[calc(100vh-2rem)] rounded-lg shadow-sm cursor-pointer"
        style={{
          backgroundColor: state.isRunning && currentSegment ? currentSegment.color : 'transparent',
          transition: 'background-color 0.5s ease'
        }}
        onClick={toggleFullscreen}
      >
        {/* 计时器内容 */}
        <div className="absolute inset-0 flex items-center justify-center p-4">
          {currentSegment && state.showCountdown && (
            <div className="text-center">
              <div className="text-white text-9xl font-bold">
                {formatTime(remainingTime)}
              </div>
            </div>
          )}
        </div>
        
        {/* 全屏提示 */}
        {!isFullscreen && (
          <div className="absolute bottom-4 right-4 text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded-md">
            点击进入全屏
          </div>
        )}
      </div>
    </div>
  );
};

export default TimerDisplay;