import React, { useState, useEffect, useRef } from 'react';
import { useTimerContext } from '../context/TimerContext';

const TimerDisplay: React.FC = () => {
  const { state, dispatch } = useTimerContext();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 监听容器尺寸变化
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          w: containerRef.current.clientWidth,
          h: containerRef.current.clientHeight,
        });
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    if (containerRef.current) observer.observe(containerRef.current);
    window.addEventListener('resize', updateSize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // 动态字体：同时考虑宽度和高度
  const fontSize = Math.min(containerSize.w / 4, containerSize.h / 1.5, 480);

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
      // ⚡ 使用压缩后轻量的 M4A 格式，加载更快
      const soundMap: Record<string, string> = {
        bell: '/sounds/bell.m4a',
        chime: '/sounds/chime.m4a',
        beep: '/sounds/bell_service.m4a',
        alarm: '/sounds/bell_service.m4a',
        default: '/sounds/bell.m4a',
        custom: '/sounds/bell.m4a'
      };

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

          // 检查是否需要切换到下一个时间段或结束
        if (state.currentCombination) {
          let totalTime = 0;
          for (let i = 0; i < state.currentSegmentIndex + 1; i++) {
            totalTime += state.currentCombination.segments[i].duration;
          }

          // 如果当前段结束
          if (state.elapsedTime + 1 >= totalTime) {
            const currentSegment = state.currentCombination.segments[state.currentSegmentIndex];
            const isLastSegment = state.currentSegmentIndex === state.currentCombination.segments.length - 1;

            // 1. 如果还有下一段，播放下一段的提示音（如果配置了）
            if (!isLastSegment) {
              const nextSegment = state.currentCombination.segments[state.currentSegmentIndex + 1];
              if (nextSegment.playSound) {
                playSound(nextSegment.soundType);
              }
              
              // 切换到下一个时间段
              dispatch({
                type: 'SET_CURRENT_SEGMENT_INDEX',
                payload: state.currentSegmentIndex + 1,
              });
            } 
            // 2. 如果是最后一段（红色警告时间）结束，再次响铃提醒
            else if (isLastSegment && state.elapsedTime + 1 === totalTime) {
              // 最后一段结束时响铃（通常是红色结束）
              if (currentSegment.playSound) {
                playSound(currentSegment.soundType);
              }
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
      {/* 计时器显示区域 — 占满第 3 栏 */}
      <div
        ref={containerRef}
        className="w-full flex-1 min-h-[calc(100vh-2rem)] rounded-2xl shadow-lg cursor-pointer flex flex-col items-center justify-center relative overflow-hidden"
        style={{
          backgroundColor: state.isRunning && currentSegment ? currentSegment.color : '#f9fafb',
          transition: 'background-color 0.5s ease'
        }}
        onClick={toggleFullscreen}
      >
        {/* 未开始时显示提示 */}
        {!state.isRunning && (
          <div className="text-gray-400 text-center">
            <div className="text-6xl mb-4">⏱️</div>
            <p className="text-lg">选择计时组合并点击开始</p>
          </div>
        )}

        {/* 累计用时 — 根据当前段 showTime 决定是否显示 */}
        {state.isRunning && currentSegment?.showTime !== false && (
          <div className="text-gray-900 font-extrabold font-mono transition-all duration-300"
            style={{ fontSize: `${fontSize}px`, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {formatTime(state.elapsedTime)}
          </div>
        )}

        {/* 当前段名称 */}
        {state.isRunning && currentSegment && (
          <div className="absolute bottom-8 left-0 right-0 text-center">
            <span className="text-white/80 text-lg font-medium bg-black/20 px-4 py-1.5 rounded-full">
              {currentSegment.name}
            </span>
          </div>
        )}

        {/* 全屏提示 */}
        {!isFullscreen && (
          <div className="absolute bottom-4 right-4 text-white/60 text-xs bg-black/30 px-3 py-1.5 rounded-lg">
            点击进入全屏
          </div>
        )}
      </div>
    </div>
  );
};

export default TimerDisplay;