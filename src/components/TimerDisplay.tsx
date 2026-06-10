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

  // 播放声音函数 — 使用预加载的 Audio 实例，0 延迟
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  // 初始化预加载
  useEffect(() => {
    const soundMap: Record<string, string> = {
      bell: '/sounds/bell.m4a',
      chime: '/sounds/chime.m4a',
      beep: '/sounds/bell_service.m4a',
      alarm: '/sounds/bell_service.m4a',
      default: '/sounds/bell.m4a',
      custom: '/sounds/bell.m4a',
    };
    Object.entries(soundMap).forEach(([key, src]) => {
      const a = new Audio();
      a.src = src;
      a.preload = 'auto';
      audioRefs.current[key] = a;
    });
  }, []);

  const playSound = (soundType: string) => {
    try {
      const audio = audioRefs.current[soundType] || audioRefs.current['bell'];
      if (!audio) {
        // 回退：创建新实例
        const fallback = new Audio('/sounds/bell.m4a');
        fallback.play().catch(() => {});
        return;
      }
      audio.currentTime = 0;
      audio.play().catch(err => {
        console.error('Failed to play sound:', err);
      });
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  // 计时器逻辑 — 用 ref 跟踪 elapsedTime 避免闭包过期
  const elapsedRef = useRef(state.elapsedTime);
  useEffect(() => { elapsedRef.current = state.elapsedTime; }, [state.elapsedTime]);
  const segIdxRef = useRef(state.currentSegmentIndex);
  useEffect(() => { segIdxRef.current = state.currentSegmentIndex; }, [state.currentSegmentIndex]);

  useEffect(() => {
    if (state.isRunning && !state.isPaused) {
      timerRef.current = setInterval(() => {
        const nextElapsed = elapsedRef.current + 1;
        dispatch({ type: 'UPDATE_ELAPSED_TIME', payload: nextElapsed });
        elapsedRef.current = nextElapsed;

        if (state.currentCombination) {
          let totalTime = 0;
          for (let i = 0; i < segIdxRef.current + 1; i++) {
            totalTime += state.currentCombination.segments[i].duration;
          }

          if (nextElapsed >= totalTime) {
            const currentSegment = state.currentCombination.segments[segIdxRef.current];
            const isLastSegment = segIdxRef.current === state.currentCombination.segments.length - 1;

            if (!isLastSegment) {
              const nextSegment = state.currentCombination.segments[segIdxRef.current + 1];
              if (nextSegment.playSound) {
                playSound(nextSegment.soundType);
              }
              dispatch({ type: 'SET_CURRENT_SEGMENT_INDEX', payload: segIdxRef.current + 1 });
              segIdxRef.current = segIdxRef.current + 1;
            } else if (isLastSegment && nextElapsed === totalTime) {
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
  }, [state.isRunning, state.isPaused, state.currentCombination, dispatch]);

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

        {/* 累计用时 — showCountdown 控制显示/隐藏 */}
        {state.isRunning && state.showCountdown && currentSegment?.showTime !== false && (
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