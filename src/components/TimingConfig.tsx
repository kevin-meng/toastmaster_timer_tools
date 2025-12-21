import React, { useState } from 'react';
import type { TimingCombination, TimingSegment } from '../types';
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
        showTime: true,
        playSound: true,
      },
      {
        id: generateId(),
        name: '正式时间',
        duration: 120,
        color: '#facc15',
        showTime: true,
        playSound: true,
      },
      {
        id: generateId(),
        name: '警告时间',
        duration: 30,
        color: '#ef4444',
        showTime: true,
        playSound: true,
      },
    ],
  });

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
          showTime: true,
          playSound: true,
        },
      ],
    });
  };

  // 处理编辑组合
  const handleEditCombination = (id: string) => {
    const combination = state.combinations.find((c) => c.id === id);
    if (combination) {
      setEditingId(id);
      setNewCombination({
        name: combination.name,
        segments: [...combination.segments],
      });
    }
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
          showTime: true,
          playSound: true,
        },
      ],
    });
  };

  // 处理删除组合
  const handleDeleteCombination = (id: string) => {
    dispatch({ type: 'DELETE_COMBINATION', payload: id });
  };

  // 处理添加时间段
  const handleAddSegment = () => {
    setNewCombination({
      ...newCombination,
      segments: [
        ...newCombination.segments,
        {
          id: generateId(),
          name: `时间段 ${newCombination.segments.length + 1}`,
          duration: 60,
          color: '#60a5fa',
          showTime: true,
          playSound: true,
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
    <div className="space-y-6">
      {/* 组合列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.combinations.map((combination) => (
          <div
            key={combination.id}
            className="bg-white rounded-lg shadow-md p-4 border border-gray-200"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {combination.name || '未命名组合'}
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditCombination(combination.id)}
                  className="text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                >
                  编辑
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('确定要删除这个计时组合吗？')) {
                      handleDeleteCombination(combination.id);
                    }
                  }}
                  className="text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                >
                  删除
                </button>
              </div>
            </div>

            {/* 时间段列表 */}
            <div className="space-y-2">
              {combination.segments.map((segment) => (
                <div
                  key={segment.id}
                  className="flex items-center space-x-2 p-2 rounded"
                  style={{ backgroundColor: `${segment.color}20` }}
                >
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: segment.color }}
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{segment.name}</div>
                    <div className="text-xs text-gray-600">
                      {segment.duration} 秒
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {segment.showTime && (
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        显示时间
                      </span>
                    )}
                    {segment.playSound && (
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        提示音
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 添加/编辑组合表单 */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="输入组合名称"
            />
          </div>

          {/* 时间段列表 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              时间段
            </label>
            {newCombination.segments.map((segment, index) => (
              <div
                key={segment.id}
                className="space-y-2 p-3 bg-gray-50 rounded-md mb-3"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="text-sm font-medium text-gray-700">
                    时间段 {index + 1}
                  </h4>
                  {newCombination.segments.length > 1 && (
                    <button
                      onClick={() => handleDeleteSegment(index)}
                      className="ml-auto text-red-600 hover:text-red-800 text-sm"
                    >
                      删除
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* 时间段名称 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      名称
                    </label>
                    <input
                      type="text"
                      value={segment.name}
                      onChange={(e) =>
                        handleUpdateSegment(index, { name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>

                  {/* 时间段时长 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      时长 (秒)
                    </label>
                    <input
                      type="number"
                      value={segment.duration}
                      onChange={(e) =>
                        handleUpdateSegment(index, {
                          duration: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      min="0"
                    />
                  </div>

                  {/* 时间段颜色 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      颜色
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={segment.color}
                        onChange={(e) =>
                          handleUpdateSegment(index, { color: e.target.value })
                        }
                        className="w-10 h-10 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={segment.color}
                        onChange={(e) =>
                          handleUpdateSegment(index, { color: e.target.value })
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="#4ade80"
                      />
                    </div>
                  </div>

                  {/* 显示时间和提示音 */}
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={segment.showTime}
                        onChange={(e) =>
                          handleUpdateSegment(index, {
                            showTime: e.target.checked,
                          })
                        }
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">显示时间</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={segment.playSound}
                        onChange={(e) =>
                          handleUpdateSegment(index, {
                            playSound: e.target.checked,
                          })
                        }
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">提示音</span>
                    </label>
                  </div>
                </div>
              </div>
            ))}

            {/* 添加时间段按钮 */}
            <button
              onClick={handleAddSegment}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              + 添加时间段
            </button>
          </div>

          {/* 提交按钮 */}
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setEditingId(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              取消
            </button>

            <button
              onClick={
                editingId ? handleUpdateCombination : handleAddCombination
              }
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
