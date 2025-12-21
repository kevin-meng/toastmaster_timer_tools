import React from 'react';
import { useTimerContext } from '../context/TimerContext';

const Timeline: React.FC = () => {
  const { state } = useTimerContext();

  // 格式化时间为 HH:mm:ss 格式
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // 格式化日期为 YYYY-MM-DD 格式
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // 计算会话持续时间（秒）
  const calculateDuration = (startTime: Date, endTime: Date | null | undefined) => {
    if (!endTime) return 0;
    return Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
  };

  // 格式化持续时间为 mm:ss 格式
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 获取计时组合名称
  const getCombinationName = (combinationId: string) => {
    const combination = state.combinations.find((c) => c.id === combinationId);
    return combination ? combination.name : '未知组合';
  };

  // 按日期分组会话
  const groupSessionsByDate = () => {
    const grouped: Record<string, typeof state.sessions> = {};

    state.sessions.forEach((session) => {
      const date = formatDate(session.startTime);
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(session);
    });

    return grouped;
  };

  const groupedSessions = groupSessionsByDate();
  const dates = Object.keys(groupedSessions).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800">计时记录</h3>

      {dates.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500">暂无计时记录</p>
          <p className="text-gray-400 text-sm mt-1">
            开始使用计时器后，记录将显示在这里
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {dates.map((date) => (
            <div key={date}>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-gray-800">{date}</h4>
                <span className="text-sm text-gray-500">
                  {groupedSessions[date].length} 条记录
                </span>
              </div>

              <div className="space-y-3">
                {groupedSessions[date].map((session) => {
                  const duration = calculateDuration(
                    session.startTime,
                    session.endTime
                  );
                  return (
                    <div
                      key={session.id}
                      className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <h5 className="text-base font-semibold text-gray-800">
                              {session.name}
                            </h5>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {getCombinationName(session.combinationId)}
                            </span>
                          </div>

                          {session.notes && (
                            <p className="text-sm text-gray-600 ml-6">
                              {session.notes}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center space-x-4 mt-2 md:mt-0">
                          <div className="text-sm text-gray-500">
                            {formatTime(session.startTime)} -{' '}
                            {session.endTime
                              ? formatTime(session.endTime)
                              : '未结束'}
                          </div>
                          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {formatDuration(duration)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Timeline;
