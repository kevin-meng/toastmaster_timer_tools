import React, { useState, useMemo } from 'react';
import { useTimerContext } from '../context/TimerContext';

const Timeline: React.FC = () => {
  const { state, dispatch } = useTimerContext();
  const [showDeleted, setShowDeleted] = useState(false);
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

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

  // 格式化时间为 HH:mm 格式（用于时间线刻度）
  const formatHour = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 格式化时长为 mm:ss 格式
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 获取离当前最近的整点时间戳
  const getNearestHourTimestamp = (date: Date) => {
    const nearestHour = new Date(date);
    nearestHour.setMinutes(0, 0, 0);
    if (date.getMinutes() >= 30) {
      nearestHour.setHours(nearestHour.getHours() + 1);
    }
    return nearestHour;
  };

  // 计算超时时间
  const calculateOverTime = (session: any) => {
    const combination = state.combinations.find(c => c.id === session.combinationId);
    if (!combination) return null;
    
    const totalExpected = combination.segments.reduce((sum: number, seg: any) => sum + seg.duration, 0);
    const actual = session.duration || 0;
    const overTime = actual - totalExpected;
    
    return overTime > 0 ? overTime : null;
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

  // 处理删除会话（软删除）
  const handleDeleteSession = (sessionId: string) => {
    setDeleteConfirm(sessionId);
  };

  // 确认删除会话
  const confirmDeleteSession = (sessionId: string) => {
    // 这里可以添加软删除逻辑
    console.log('Confirm delete session:', sessionId);
    setDeleteConfirm(null);
  };

  // 取消删除会话
  const cancelDeleteSession = () => {
    setDeleteConfirm(null);
  };

  // 处理恢复会话
  const handleRestoreSession = (sessionId: string) => {
    // 这里可以添加恢复逻辑
    console.log('Restore session:', sessionId);
  };

  // 处理编辑会话
  const handleEditSession = (session: any) => {
    setEditingNode(session.id);
    setEditTitle(session.name);
    setEditNotes(session.notes || '');
  };

  // 处理保存编辑
  const handleSaveEdit = (sessionId: string) => {
    // 这里可以添加保存编辑逻辑
    console.log('Save edit:', sessionId, editTitle, editNotes);
    setEditingNode(null);
  };

  // 处理取消编辑
  const handleCancelEdit = () => {
    setEditingNode(null);
  };

  const groupedSessions = groupSessionsByDate();
  const dates = Object.keys(groupedSessions).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center bg-white rounded-lg shadow-md p-4">
        <h3 className="text-xl font-semibold text-gray-800">时间线记录</h3>
        <div className="flex items-center space-x-3">
          {state.sessions.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('确定要删除所有时间轴记录吗？此操作不可恢复。')) {
                  dispatch({ type: 'SET_SESSIONS', payload: [] });
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-md shadow-sm hover:bg-red-700 transition-all text-sm"
            >
              删除所有记录
            </button>
          )}
          <span className="text-sm text-gray-600">是否显示已删除</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {dates.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500">暂无计时记录</p>
          <p className="text-gray-400 text-sm mt-1">
            开始使用计时器后，记录将显示在这里
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {dates.map((date) => {
            const sessions = groupedSessions[date];
            // 过滤会话，只显示未删除的或显示所有（如果showDeleted为true）
            const filteredSessions = sessions.filter((session: any) => !session.deleted || showDeleted);
            
            if (filteredSessions.length === 0) return null;
            
            // 按时间排序
            const sortedSessions = filteredSessions.sort((a: any, b: any) => 
              a.startTime.getTime() - b.startTime.getTime()
            );
            
            // 生成时间刻度（每小时）
            const firstSession = sortedSessions[0];
            const lastSession = sortedSessions[sortedSessions.length - 1];
            const startTime = getNearestHourTimestamp(firstSession.startTime);
            const endTime = new Date(lastSession.endTime || lastSession.startTime);
            endTime.setHours(endTime.getHours() + 1, 0, 0, 0);
            
            const timeMarkers = useMemo(() => {
              const markers: Date[] = [];
              const current = new Date(startTime);
              while (current <= endTime) {
                markers.push(new Date(current));
                current.setHours(current.getHours() + 1);
              }
              return markers;
            }, [startTime, endTime]);
            
            return (
              <div key={date} className="bg-white rounded-xl shadow-lg p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-6">{date}</h4>
                
                {/* 时间线容器 */}
                <div className="relative pl-16 space-y-8">
                  {/* 垂直主线条 */}
                  <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300 z-0"></div>
                  
                  {/* 时间刻度 */}
                  {timeMarkers.map((marker) => (
                    <div key={marker.getTime()} className="absolute left-8 -ml-1.5 top-0 h-1.5 w-1.5 bg-blue-600 rounded-full z-10">
                      <div className="absolute left-3 top-0 text-xs text-gray-500 -translate-y-1/2 whitespace-nowrap">
                        {formatHour(marker)}
                      </div>
                    </div>
                  ))}
                  
                  {/* 会话项目 */}
                  {sortedSessions.map((session: any) => {
                    const isDeleted = !!session.deleted;
                    const isEditing = editingNode === session.id;
                    const isDeleting = deleteConfirm === session.id;
                    const overTime = calculateOverTime(session);
                    
                    return (
                      <div 
                        key={session.id} 
                        className={`relative group ${isDeleted ? 'opacity-60' : ''}`}
                      >
                        {/* 时间点标记 */}
                        <div className="absolute left-8 -ml-1.5 top-0 h-3 w-3 bg-blue-500 rounded-full z-10 border-2 border-white shadow-md"></div>
                        
                        {/* 会话卡片 */}
                        <div className={`ml-4 p-5 bg-white rounded-xl border ${isDeleted ? 'border-gray-300' : 'border-blue-200 shadow-md hover:shadow-lg'} transition-all duration-300 relative`}>
                          {/* 时间标签 */}
                          <div className="absolute -top-3 left-4 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                            {formatTime(session.startTime)}
                          </div>
                          
                          {isEditing ? (
                            <div className="space-y-3">
                              <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                placeholder="输入标题"
                              />
                              <textarea
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={editNotes}
                                onChange={(e) => setEditNotes(e.target.value)}
                                rows={2}
                                placeholder="输入备注"
                              />
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={handleCancelEdit}
                                  className="px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                                >
                                  取消
                                </button>
                                <button
                                  onClick={() => handleSaveEdit(session.id)}
                                  className="px-3 py-1 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
                                >
                                  保存
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="space-y-2">
                                {/* 标题和备注 */}
                                <h5 className={`font-semibold ${isDeleted ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                                  {session.name}
                                </h5>
                                {session.notes && (
                                  <p className="text-sm text-gray-600">
                                    {session.notes}
                                  </p>
                                )}
                                
                                {/* 时间信息 */}
                                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100 text-sm">
                                  <div className="space-y-1">
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">开始时间:</span>
                                      <span className="font-medium text-gray-800">{formatTime(session.startTime)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">结束时间:</span>
                                      <span className="font-medium text-gray-800">
                                        {session.endTime ? formatTime(session.endTime) : '未结束'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">用时:</span>
                                      <span className="font-medium text-gray-800">
                                        {session.duration ? formatDuration(session.duration) : '00:00'}
                                      </span>
                                    </div>
                                    {overTime && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">超时:</span>
                                        <span className="font-medium text-red-600">
                                          +{formatDuration(overTime)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {/* 操作按钮 */}
                              <div className="flex justify-end space-x-2 mt-4 pt-3 border-t border-gray-100">
                                {!isDeleted && (
                                  <button
                                    onClick={() => handleEditSession(session)}
                                    className="px-3 py-1 text-sm text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                                  >
                                    编辑
                                  </button>
                                )}
                                
                                {isDeleting ? (
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={cancelDeleteSession}
                                      className="px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                                    >
                                      取消
                                    </button>
                                    <button
                                      onClick={() => confirmDeleteSession(session.id)}
                                      className="px-3 py-1 text-sm text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                                    >
                                      确认删除
                                    </button>
                                  </div>
                                ) : !isDeleted ? (
                                  <button
                                    onClick={() => handleDeleteSession(session.id)}
                                    className="px-3 py-1 text-sm text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                                  >
                                    删除
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleRestoreSession(session.id)}
                                    className="px-3 py-1 text-sm text-green-600 bg-green-50 rounded-md hover:bg-green-100 transition-colors"
                                  >
                                    恢复
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Timeline;