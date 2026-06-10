import React, { useState } from 'react';
import type { TimingCombination, TimingSegment, SoundType } from '../types';
import { useTimerContext } from '../context/TimerContext';

// 生成唯一ID的辅助函数
const generateId = () =>
  Math.random().toString(36).substring(2, 15) +
  Math.random().toString(36).substring(2, 15);

const TimingConfig: React.FC = () => {
  const { state, dispatch } = useTimerContext();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCombination, setNewCombination] = useState<
    Omit<TimingCombination, 'id' | 'createdAt' | 'updatedAt'>
  >({
    name: '',
    segments: [
      {
        id: generateId(),
        name: '准备时间',
        duration: 60,
        color: '#4ade80',
        showTime: false,
        playSound: true,
        soundType: 'bell',
      },
      {
        id: generateId(),
        name: '正式时间',
        duration: 120,
        color: '#facc15',
        showTime: false,
        playSound: true,
        soundType: 'chime',
      },
      {
        id: generateId(),
        name: '警告时间',
        duration: 30,
        color: '#ef4444',
        showTime: false,
        playSound: true,
        soundType: 'beep',
      },
    ],
  });

  // 监听currentCombination变化，自动填充表单用于编辑
  React.useEffect(() => {
    if (state.currentCombination) {
      setEditingId(state.currentCombination.id);
      setNewCombination({
        name: state.currentCombination.name,
        segments: state.currentCombination.segments.map(segment => ({
          ...segment,
          id: segment.id,
        })),
      });
    }
  }, [state.currentCombination]);

  // 处理添加新组合
  const handleAddCombination = () => {
    if (!newCombination.name.trim()) return;

    const combination: TimingCombination = {
      ...newCombination,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    dispatch({ type: 'ADD_COMBINATION', payload: combination });
    setNewCombination({
      name: '',
      segments: [
        {
          id: generateId(),
          name: '准备时间',
          duration: 60,
          color: '#4ade80',
          showTime: false,
          playSound: true,
          soundType: 'bell',
        },
      ],
    });
  };

  // 处理更新组合
  const handleUpdateCombination = () => {
    if (!newCombination.name.trim() || !editingId) return;

    const combination: TimingCombination = {
      ...newCombination,
      id: editingId,
      createdAt:
        state.combinations.find((c) => c.id === editingId)?.createdAt ||
        new Date(),
      updatedAt: new Date(),
    };

    dispatch({ type: 'UPDATE_COMBINATION', payload: combination });
    setEditingId(null);
    setNewCombination({
      name: '',
      segments: [
        {
          id: generateId(),
          name: '准备时间',
          duration: 60,
          color: '#4ade80',
          showTime: false,
          playSound: true,
          soundType: 'bell',
        },
      ],
    });
  };

  // 处理添加时间段
  const handleAddSegment = () => {
    setNewCombination({
      ...newCombination,
      segments: [
        ...newCombination.segments,
        {
          id: generateId(),
          name: `阶段 ${newCombination.segments.length + 1}`,
          duration: 60,
          color: '#60a5fa',
          showTime: false,
          playSound: true,
          soundType: 'bell',
        },
      ],
    });
  };

  // 处理更新时间段
  const handleUpdateSegment = (
    index: number,
    updates: Partial<TimingSegment>
  ) => {
    const updatedSegments = [...newCombination.segments];
    updatedSegments[index] = { ...updatedSegments[index], ...updates };
    setNewCombination({ ...newCombination, segments: updatedSegments });
  };

  // 处理删除时间段
  const handleDeleteSegment = (index: number) => {
    const updatedSegments = newCombination.segments.filter(
      (_, i) => i !== index
    );
    setNewCombination({ ...newCombination, segments: updatedSegments });
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* 添加/编辑组合表单 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {editingId ? '编辑计时组合' : '添加新计时组合'}
        </h3>

        <div className="space-y-4">
          {/* 组合名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              组合名称
            </label>
            <input
              type="text"
              value={newCombination.name}
              onChange={(e) =>
                setNewCombination({ ...newCombination, name: e.target.value })
              }
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all"
              placeholder="输入组合名称"
            />
          </div>

          {/* 时间段列表 */}
          <div className="space-y-2">
            {newCombination.segments.map((segment, index) => (
              <div
                key={segment.id}
                className="p-3 bg-white rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                      阶段 {index + 1}
                    </span>
                  </h4>
                  <button
                    onClick={() => handleDeleteSegment(index)}
                    className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 transition-colors"
                    disabled={false}
                  >
                    <span className="text-red-400">🗑️</span>
                    删除
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {/* 时间段名称 */}
                  <div>
                    <input
                      type="text"
                      value={segment.name}
                      onChange={(e) =>
                        handleUpdateSegment(index, { name: e.target.value })
                      }
                      className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="名称"
                    />
                  </div>

                  {/* 时间段时长 — 分钟 + 秒 */}
                  <div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={Math.floor(segment.duration / 60)}
                        onChange={(e) => {
                          const mins = parseInt(e.target.value) || 0;
                          const secs = segment.duration % 60;
                          handleUpdateSegment(index, { duration: mins * 60 + secs });
                        }}
                        className="w-16 px-2 py-1.5 text-sm border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-center"
                        min="0"
                      />
                      <span className="text-xs text-gray-500">分</span>
                      <input
                        type="number"
                        value={segment.duration % 60}
                        onChange={(e) => {
                          const secs = Math.min(59, Math.max(0, parseInt(e.target.value) || 0));
                          const mins = Math.floor(segment.duration / 60);
                          handleUpdateSegment(index, { duration: mins * 60 + secs });
                        }}
                        className="w-16 px-2 py-1.5 text-sm border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-center"
                        min="0" max="59"
                      />
                      <span className="text-xs text-gray-500">秒</span>
                    </div>
                  </div>

                  {/* 时间段颜色 - 精简设计，仅保留颜色选择器 */}
                  <div className="flex items-center">
                    <input
                      type="color"
                      value={segment.color}
                      onChange={(e) =>
                        handleUpdateSegment(index, { color: e.target.value })
                      }
                      className="w-8 h-8 rounded-lg cursor-pointer shadow-sm transition-all border border-gray-200"
                      title="选择颜色"
                    />
                  </div>
                </div>

                {/* 显示选项和声音设置 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2 border-t border-gray-100">
                  {/* 显示时间 - 默认不勾选 */}
                  <div className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      checked={segment.showTime}
                      onChange={(e) =>
                        handleUpdateSegment(index, {
                          showTime: e.target.checked,
                        })
                      }
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span className="text-xs text-gray-600">显示时间</span>
                  </div>

                  {/* 提示音 */}
                  <div className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      checked={segment.playSound}
                      onChange={(e) =>
                        handleUpdateSegment(index, {
                          playSound: e.target.checked,
                        })
                      }
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span className="text-xs text-gray-600">提示音</span>
                  </div>
                </div>

                {/* 声音类型选择和试听按钮 - 仅在勾选提示音时显示 */}
                {segment.playSound && (
                  <div className="flex items-center gap-1 pt-2">
                    <select
                      value={segment.soundType}
                      onChange={(e) =>
                        handleUpdateSegment(index, {
                          soundType: e.target.value as SoundType,
                        })
                      }
                      className="w-32 px-2 py-1.5 text-sm border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      <option value="bell">铃铛声</option>
                      <option value="chime">钟声</option>
                      <option value="beep">提示音</option>
                    </select>
                    <button
                      onClick={() => {
                        try {
                          // 声音类型到文件路径的映射
                          const soundMap: Record<string, string> = {
                            bell: '/sounds/bell.m4a',
                            chime: '/sounds/chime.m4a',
                            beep: '/sounds/bell_service.m4a',
                            alarm: '/sounds/bell_service.m4a',
                            default: '/sounds/bell.m4a',
                            custom: '/sounds/bell.m4a'
                          };
                          
                          // 创建音频对象并播放
                          const audio = new Audio(soundMap[segment.soundType] || soundMap.default);
                          audio.play().catch(err => {
                            console.error('Failed to play sound:', err);
                          });
                        } catch (error) {
                          console.error('Error playing sound:', error);
                        }
                      }}
                      className="px-2 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg shadow-sm transition-all text-blue-700 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-1 text-xs"
                      title="试听声音"
                    >
                      🔊 试听
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* 添加时间段按钮 */}
            <button
              onClick={handleAddSegment}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              + 添加阶段
            </button>
          </div>

          {/* 提交按钮 */}
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setEditingId(null);
              }}
              className="px-4 py-2.5 text-sm border border-gray-200 rounded-xl shadow-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              取消
            </button>

            <button
              onClick={
                editingId ? handleUpdateCombination : handleAddCombination
              }
              className="px-4 py-2.5 text-sm rounded-xl shadow-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              disabled={!newCombination.name.trim()}
            >
              {editingId ? '更新' : '添加'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimingConfig;
