import React, { useState, useMemo } from 'react';
import { useTimerContext } from '../context/TimerContext';
import { DEFAULT_COMBINATIONS } from '../constants/defaultCombinations';

interface TimelineProps {
  selectedDate: string; // YYYY-MM-DD
}

const Timeline: React.FC<TimelineProps> = ({ selectedDate }) => {
  const { state, dispatch } = useTimerContext();
  const [showDeleted, setShowDeleted] = useState(false);
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // 格式化时间为 HH:mm:ss
  const formatTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // 格式化日期为 YYYY-MM-DD (本地时间)
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 格式化时长为 mm:ss
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 获取组合名称
  const getCombinationName = (combinationId: string) => {
    const combination = 
      state.combinations.find((c) => c.id === combinationId) || 
      DEFAULT_COMBINATIONS.find((c) => c.id === combinationId);
    return combination ? combination.name : '未知组合';
  };

  // 计算超时时间
  const calculateOverTime = (session: any) => {
    const combination = 
      state.combinations.find((c) => c.id === session.combinationId) || 
      DEFAULT_COMBINATIONS.find((c) => c.id === session.combinationId);
    
    if (!combination) return null;
    
    const totalExpected = combination.segments.reduce((sum: number, seg: any) => sum + seg.duration, 0);
    const actual = session.duration || (session.endTime 
      ? Math.floor((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000) 
      : 0);
    
    const overTime = actual - totalExpected;
    return overTime > 0 ? overTime : null;
  };

  // 处理编辑会话
  const handleEditSession = (session: any) => {
    setEditingNode(session.id);
    setEditTitle(session.name);
    setEditNotes(session.notes || '');
  };

  // 处理保存编辑
  const handleSaveEdit = (sessionId: string) => {
    const updatedSessions = state.sessions.map(session => {
      if (session.id === sessionId) {
        return { ...session, name: editTitle, notes: editNotes, updatedAt: new Date() };
      }
      return session;
    });
    dispatch({ type: 'SET_SESSIONS', payload: updatedSessions });
    setEditingNode(null);
  };

  // 确认删除会话
  const confirmDeleteSession = (sessionId: string) => {
    const updatedSessions = state.sessions.map(session => {
      if (session.id === sessionId) {
        return { ...session, deleted: true };
      }
      return session;
    });
    dispatch({ type: 'SET_SESSIONS', payload: updatedSessions });
    setDeleteConfirm(null);
  };

  // 确认恢复会话
  const confirmRestoreSession = (sessionId: string) => {
    const updatedSessions = state.sessions.map(session => {
      if (session.id === sessionId) {
        return { ...session, deleted: false };
      }
      return session;
    });
    dispatch({ type: 'SET_SESSIONS', payload: updatedSessions });
    setDeleteConfirm(null);
  };

  // 过滤和分组数据
  const groupedSessions = useMemo(() => {
    const filtered = state.sessions.filter(session => {
      const sessionDate = formatDate(session.startTime);
      // 筛选日期
      if (sessionDate !== selectedDate) return false;
      // 筛选删除状态
      if (!showDeleted && session.deleted) return false;
      return true;
    });

    // 按日期分组
    const grouped: Record<string, typeof state.sessions> = {};
    filtered.forEach(session => {
      const date = formatDate(session.startTime);
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(session);
    });

    return grouped;
  }, [state.sessions, selectedDate, showDeleted]);

  // 获取排序后的日期键
  const sortedDates = Object.keys(groupedSessions).sort((a, b) => b.localeCompare(a));

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">{selectedDate} 记录</h2>
        <div className="flex items-center space-x-2">
           <span className="text-xs text-gray-500">显示已删除</span>
           <label className="relative inline-flex items-center cursor-pointer">
             <input
               type="checkbox"
               checked={showDeleted}
               onChange={(e) => setShowDeleted(e.target.checked)}
               className="sr-only peer"
             />
             <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
           </label>
        </div>
      </div>

      {sortedDates.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-10 text-center shadow-sm">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-gray-500 font-medium">当日暂无计时记录</p>
          <p className="text-gray-400 text-sm mt-1">开始使用计时器后，记录将显示在这里</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedDates.map(date => {
            const sessions = groupedSessions[date].sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
            
            return (
              <div key={date} className="relative">
                <div className="relative border-l-2 border-gray-200 ml-3 space-y-6 pb-4">
                  {sessions.map((session) => {
                    const isEditing = editingNode === session.id;
                    const isDeleting = deleteConfirm === session.id;
                    const overTime = calculateOverTime(session);
                    const duration = session.duration || (session.endTime 
                      ? Math.floor((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000) 
                      : 0);
                    
                    return (
                      <div key={session.id} className={`relative pl-4 md:pl-8 ${session.deleted ? 'opacity-50' : ''}`}>
                        {/* 时间轴圆点 */}
                        <div className={`absolute left-[-5px] md:-left-[9px] top-1 w-3 h-3 md:w-4 md:h-4 rounded-full border-2 md:border-4 border-white ${overTime ? 'bg-red-500' : 'bg-blue-500'} shadow-sm box-content`}></div>
                        
                        {/* 卡片内容 */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow p-4 md:p-5 group relative">
                          {/* 头部：标题和菜单 */}
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1 mr-2 text-left">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  className="w-full text-lg font-bold text-gray-800 border-b border-gray-300 focus:border-blue-500 outline-none bg-transparent"
                                />
                              ) : (
                                <h4 className="text-base md:text-lg font-bold text-gray-800 leading-tight">{session.name}</h4>
                              )}
                              
                              {/* 时间信息 - 移到标题下方，增加层次感 */}
                              <div className="flex flex-wrap items-center text-xs text-gray-400 mt-1 gap-2">
                                <span>{formatTime(session.startTime)} - {session.endTime ? formatTime(session.endTime) : '未结束'}</span>
                                <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[10px]">
                                  {getCombinationName(session.combinationId)}
                                </span>
                              </div>
                            </div>

                            {/* 右侧数据展示 - 强调数据 */}
                            <div className="text-right flex flex-col items-end min-w-[60px] md:min-w-[80px]">
                              <div className="text-xl md:text-2xl font-mono font-medium text-gray-700 leading-none mb-1">
                                {formatDuration(duration)}
                              </div>
                              {overTime ? (
                                <span className="text-[10px] md:text-xs font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded whitespace-nowrap">
                                  超时 +{formatDuration(overTime)}
                                </span>
                              ) : (
                                <span className="text-[10px] md:text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded whitespace-nowrap">
                                  正常完成
                                </span>
                              )}
                            </div>
                          </div>

                          {/* 备注区域 */}
                          <div className="mt-3 pt-3 border-t border-gray-50 text-left">
                            {isEditing ? (
                              <textarea
                                value={editNotes}
                                onChange={(e) => setEditNotes(e.target.value)}
                                className="w-full text-sm text-gray-600 border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-100 outline-none"
                                rows={2}
                                placeholder="添加备注..."
                              />
                            ) : (
                              <p className="text-sm text-gray-600 leading-relaxed">
                                {session.notes || <span className="text-gray-300 italic">无备注</span>}
                              </p>
                            )}
                          </div>

                          {/* 操作栏 - 移动端直接显示在底部，桌面端保持悬停显示或优化 */}
                          <div className="mt-3 flex justify-end gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                             {session.deleted ? (
                               <button
                                 onClick={() => setDeleteConfirm(session.id)}
                                 className="p-1.5 md:p-2 bg-gray-50 rounded-lg text-gray-500 hover:text-green-600 hover:bg-green-50 transition-colors text-xs md:text-sm flex items-center gap-1"
                                 title="还原"
                               >
                                 <span>♻️ 还原</span>
                               </button>
                             ) : (
                               <>
                                 <button
                                   onClick={() => handleEditSession(session)}
                                   className="p-1.5 md:p-2 bg-gray-50 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors text-xs md:text-sm flex items-center gap-1"
                                   title="编辑"
                                 >
                                   <span>✏️ 编辑</span>
                                 </button>
                                 <button
                                   onClick={() => setDeleteConfirm(session.id)}
                                   className="p-1.5 md:p-2 bg-gray-50 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors text-xs md:text-sm flex items-center gap-1"
                                   title="删除"
                                 >
                                   <span>🗑️ 删除</span>
                                 </button>
                               </>
                             )}
                          </div>

                          {/* 编辑保存/取消 */}
                          {isEditing && (
                            <div className="flex justify-end space-x-2 mt-3">
                              <button
                                onClick={() => setEditingNode(null)}
                                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                取消
                              </button>
                              <button
                                onClick={() => handleSaveEdit(session.id)}
                                className="px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                              >
                                保存修改
                              </button>
                            </div>
                          )}

                          {/* 删除/还原确认 */}
                          {isDeleting && (
                            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-xl flex items-center justify-center z-20">
                              <div className="text-center">
                                <p className="text-sm font-medium text-gray-800 mb-3">
                                  {session.deleted ? '确定还原这条记录吗？' : '确定删除这条记录吗？'}
                                </p>
                                <div className="flex justify-center space-x-2">
                                  <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="px-3 py-1.5 text-xs text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                                  >
                                    取消
                                  </button>
                                  <button
                                    onClick={() => session.deleted ? confirmRestoreSession(session.id) : confirmDeleteSession(session.id)}
                                    className={`px-3 py-1.5 text-xs text-white rounded-lg shadow-sm ${session.deleted ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                                  >
                                    {session.deleted ? '确认还原' : '确认删除'}
                                  </button>
                                </div>
                              </div>
                            </div>
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
