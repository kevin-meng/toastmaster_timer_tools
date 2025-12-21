import React from 'react';
import type { TimingCombination } from '../types';

interface CombinationListProps {
  combinations: TimingCombination[];
  onEdit: (combination: TimingCombination) => void;
  onDelete: (id: string) => void;
  onSelect: (combination: TimingCombination) => void;
}

const CombinationList: React.FC<CombinationListProps> = ({
  combinations,
  onEdit,
  onDelete,
  onSelect,
}) => {
  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">计时组合列表</h3>
      {combinations.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <p>暂无计时组合，请点击"添加组合"创建</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {combinations.map((combination) => (
            <div
              key={combination.id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-gray-800">
                    {combination.name}
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">
                    {combination.segments.length} 个时间段
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onEdit(combination)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => onDelete(combination.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    删除
                  </button>
                </div>
              </div>
              <div className="mt-3">
                {combination.segments.map((segment) => (
                  <div
                    key={segment.id}
                    className="flex items-center text-sm mt-1"
                  >
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: segment.color }}
                    ></div>
                    <span className="text-gray-700">{segment.name}</span>
                    <span className="text-gray-500 ml-auto">
                      {segment.duration}s
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => onSelect(combination)}
                className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                选择此组合
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CombinationList;
