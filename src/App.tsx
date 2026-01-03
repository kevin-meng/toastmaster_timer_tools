import { useState, useEffect } from 'react';
import './App.css';
import TimingConfig from './components/TimingConfig';
import TimerDisplay from './components/TimerDisplay';
import Timeline from './components/Timeline';
import Contact from './components/Contact';
import { useTimerContext } from './context/TimerContext';
import type { TimingCombination } from './types';
import { DEFAULT_COMBINATIONS } from './constants/defaultCombinations';

// 定义页面类型
type Page = 'config' | 'timer' | 'timeline' | 'contact';

function App() {
  // 状态管理：当前页面
  const [currentPage, setCurrentPage] = useState<Page>('timer');
  // 状态管理：侧边栏显示
  const [showSidebar, setShowSidebar] = useState(false);
  // 状态管理：侧边栏是否展开
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  // 状态管理：自定义组合是否展开
  const [customCombinationsExpanded, setCustomCombinationsExpanded] = useState(true);
  // 状态管理：默认组合是否展开
  const [defaultCombinationsExpanded, setDefaultCombinationsExpanded] = useState(true);
  // 状态管理：会话名称和备注
  const [sessionName, setSessionName] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  // 状态管理：正在编辑的组合
  const [editingCombination, setEditingCombination] = useState<TimingCombination | null>(null);
  
  // 状态管理：移动端菜单是否打开
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 状态管理：历史记录筛选范围 - 默认为当前日期 (YYYY-MM-DD)
  const getCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const [selectedDate, setSelectedDate] = useState<string>(getCurrentDate());
  
  // 获取计时器上下文
  const { state, dispatch } = useTimerContext();
  
  // 计算所有可用的日期列表
  const availableDates = (() => {
    const dates = new Set<string>();
    // 添加当前日期
    dates.add(getCurrentDate());
    
    // 从会话记录中提取日期
    state.sessions.forEach(session => {
      const date = new Date(session.startTime);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      dates.add(`${year}-${month}-${day}`);
    });
    
    // 转换为数组并排序（降序）
    return Array.from(dates).sort((a, b) => b.localeCompare(a));
  })();
  
  // 预加载音频文件
  useEffect(() => {
    const audioFiles = [
      '/sounds/bell.wav',
      '/sounds/bell_service.wav',
      '/sounds/chime.wav'
    ];
    
    audioFiles.forEach(file => {
      const audio = new Audio();
      audio.src = file;
      audio.preload = 'auto';
      // 可选：加载失败时打印警告，但不阻断
      audio.onerror = () => console.warn(`Failed to preload audio: ${file}`);
    });
  }, []);

  // 侧边栏始终显示
  useEffect(() => {
    setShowSidebar(true);
  }, []);
  
  // 当切换到配置页面时，如果有正在编辑的组合，设置编辑状态
  useEffect(() => {
    if (currentPage === 'config' && editingCombination) {
      // 使用dispatch设置当前组合，以便TimingConfig组件可以获取到
      dispatch({ type: 'SET_CURRENT_COMBINATION', payload: editingCombination });
    }
  }, [currentPage, editingCombination, dispatch]);
  
  // 处理筛选范围变化
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col md:flex-row">
      {/* 移动端顶部导航栏 */}
      <div className="md:hidden bg-white shadow-sm border-b border-gray-100 p-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="头马时间官助手" className="h-10 w-auto object-contain" />
          <h1 className="text-lg font-bold text-gray-800">Timer Tools</h1>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* 移动端侧边栏遮罩 */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* 左侧固定可折叠侧边栏 - 响应式设计 */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-screen z-50 bg-white shadow-xl flex flex-col transition-all duration-300 ease-in-out border-r border-gray-100
        ${mobileMenuOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'}
        ${sidebarExpanded ? 'md:w-72' : 'md:w-20'}
      `}>
        {/* 侧边栏顶部 (仅桌面端显示折叠按钮) */}
        <div className="p-4 flex items-center justify-between border-b border-gray-100 h-24">
          {/* 标题 - 仅在展开时显示 */}
          {(sidebarExpanded || mobileMenuOpen) && (
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="头马时间官助手" className="h-16 w-auto object-contain" />
              <button
                onClick={() => setCurrentPage('contact')}
                className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 hover:bg-orange-100 hover:text-orange-500 flex items-center justify-center transition-all"
                title="联系我们"
              >
                <span className="text-xs">💬</span>
              </button>
            </div>
          )}
          {/* 折叠/展开按钮 (仅桌面端) */}
          <button
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            className="hidden md:block p-1 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
          >
            {sidebarExpanded ? '◀' : '▶'}
          </button>
          {/* 移动端关闭按钮 */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>
        
        {/* 导航菜单 */}
        <nav className="p-2 space-y-1.5">
          {(['timer', 'config', 'timeline'] as const).map((page) => (
            <button
              key={page}
              onClick={() => {
                setCurrentPage(page);
                setMobileMenuOpen(false);
              }}
              className={`w-full ${(sidebarExpanded || mobileMenuOpen) ? 'px-4 py-2.5 text-left' : 'px-4 py-3 justify-center'} rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-3 hover:shadow-md hover:translate-x-0.5 ${currentPage === page 
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' 
                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'}`}
            >
              {page === 'timer' && (
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  ▶
                </div>
              )}
              {page === 'config' && (
                <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  ⚙
                </div>
              )}
              {page === 'timeline' && (
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  📈
                </div>
              )}
              {/* 菜单项文字 - 仅在展开时显示 */}
              {(sidebarExpanded || mobileMenuOpen) && (
                <>
                  {page === 'timer' && '正式计时'}
                  {page === 'config' && '时间组设置'}
                  {page === 'timeline' && '时间线'}
                </>
              )}
            </button>
          ))}
          
          {/* 移动端联系方式菜单项 */}
          <button
            onClick={() => {
              setCurrentPage('contact');
              setMobileMenuOpen(false);
            }}
            className={`md:hidden w-full px-4 py-2.5 text-left rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-3 hover:shadow-md hover:translate-x-0.5 ${currentPage === 'contact'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' 
              : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'}`}
          >
            <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              💬
            </div>
            <span>联系方式</span>
          </button>
        </nav>
        
        {/* 选择计时组合（仅在计时页面且展开时显示） */}
        {currentPage === 'timer' && (sidebarExpanded || mobileMenuOpen) && (
          <div className="p-3 space-y-2">
            <div className="bg-white rounded-xl p-3 space-y-2.5 shadow-md border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <div className="w-5 h-5 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                  📝
                </div>
                选择计时组合
              </h3>
              <div>
                <select
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all hover:border-gray-300"
                  onChange={(e) => {
                    if (e.target.value === 'new') {
                      setCurrentPage('config');
                      return;
                    }
                    // 先从自定义组合中找，再从默认组合中找
                    const combination = 
                      state.combinations.find((c) => c.id === e.target.value) || 
                      DEFAULT_COMBINATIONS.find((c) => c.id === e.target.value);
                      
                    if (combination) {
                      dispatch({ type: 'SET_CURRENT_COMBINATION', payload: combination });
                    }
                  }}
                  value={state.currentCombination?.id || ''}
                >
                  <option value="">请选择计时组合</option>
                  
                  {/* 默认时间组合 */}
                  <optgroup label="默认时间组合">
                    {DEFAULT_COMBINATIONS.map((combination) => (
                      <option key={combination.id} value={combination.id} className="text-sm">
                        {combination.name}
                      </option>
                    ))}
                  </optgroup>

                  {/* 自定义时间组合 */}
                  <optgroup label="自定义时间组合">
                    {state.combinations
                      .filter(c => !DEFAULT_COMBINATIONS.some(dc => dc.id === c.id))
                      .map((combination) => (
                        <option key={combination.id} value={combination.id} className="text-sm">
                          {combination.name}
                        </option>
                      ))}
                  </optgroup>

                  <option value="new" className="text-blue-600 font-medium">
                    + 创建新的时间组合
                  </option>
                </select>
              </div>
              <div>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all hover:border-gray-300"
                  placeholder="会话名称"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                />
              </div>
              <div>
                <textarea
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all resize-y min-h-[50px] max-h-[100px]"
                  placeholder="备注（可选）"
                  rows={2}
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                />
              </div>
              
              {/* 开始计时按钮 - 点击后变灰色，不可点击 */}
              <button
                onClick={() => {
                  if (state.currentCombination) {
                    // 创建新的会话，使用输入的名称和备注
                    const newSession = {
                      id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
                      name: sessionName.trim() || '未命名会话',
                      notes: sessionNotes.trim(),
                      combinationId: state.currentCombination.id,
                      startTime: new Date(),
                      createdAt: new Date(),
                    };
                    
                    dispatch({ type: 'START_SESSION', payload: newSession });
                    setShowSidebar(true);
                    
                    // 清空输入框
                    setSessionName('');
                    setSessionNotes('');
                  }
                }}
                className="w-full py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium transform hover:translate-y-[-1px] disabled:translate-y-0"
                disabled={!state.currentCombination || state.isRunning}
              >
                🟢 开始计时
              </button>
            </div>
          </div>
        )}
        
        {/* 时间组合列表（仅在时间设置页面、展开时显示） */}
        {currentPage === 'config' && (sidebarExpanded || mobileMenuOpen) && (
          <div className="p-3 overflow-y-auto flex-1 text-sm">
            <div className="bg-gray-50 rounded-lg p-3 space-y-2.5 shadow-sm">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-800">计时组合列表</h3>
                <button
                  onClick={() => {
                    // 只删除自定义组合
                    const defaultIds = DEFAULT_COMBINATIONS.map(dc => dc.id);
                    state.combinations.forEach(c => {
                      if (!defaultIds.includes(c.id)) {
                        dispatch({ type: 'DELETE_COMBINATION', payload: c.id });
                      }
                    });
                  }}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  删除自定义组合
                </button>
              </div>
              
              {/* 组合列表 - 分为默认和自定义 */}
              <div className="space-y-4">
                {/* 默认组合 */}
                <div>
                  <button 
                    onClick={() => setDefaultCombinationsExpanded(!defaultCombinationsExpanded)}
                    className="w-full flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 hover:bg-gray-100 p-1 rounded transition-colors"
                  >
                    <span>默认组合</span>
                    <span>{defaultCombinationsExpanded ? '▼' : '▶'}</span>
                  </button>
                  
                  {defaultCombinationsExpanded && (
                    <div className="space-y-2">
                      {DEFAULT_COMBINATIONS.map((combination) => (
                          <div key={combination.id} className="bg-white rounded-md p-2 shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="text-sm font-medium text-gray-800">{combination.name}</h4>
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => {
                                    // 复制组合逻辑
                                    const copyCombination = {
                                      ...combination,
                                      id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
                                      name: `${combination.name} (复制)`,
                                      segments: combination.segments.map(segment => ({
                                        ...segment,
                                        id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
                                      })),
                                      createdAt: new Date(),
                                      updatedAt: new Date()
                                    };
                                    dispatch({ type: 'ADD_COMBINATION', payload: copyCombination });
                                  }}
                                  className="text-xs text-green-600 hover:text-green-800"
                                >
                                  复制
                                </button>
                              </div>
                            </div>
                            
                            {/* 时间段列表 */}
                            <div className="space-y-1">
                              {combination.segments.map((segment) => (
                                <div key={segment.id} className="flex items-center space-x-2 p-1 rounded" style={{ backgroundColor: `${segment.color}20` }}>
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }} />
                                  <div className="flex-1 text-xs">
                                    <div className="font-medium text-left">{segment.name}</div>
                                    <div className="text-gray-500 text-left">{segment.duration}秒</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* 自定义组合 - 可折叠 */}
                <div>
                  <button 
                    onClick={() => setCustomCombinationsExpanded(!customCombinationsExpanded)}
                    className="w-full flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 hover:bg-gray-100 p-1 rounded transition-colors"
                  >
                    <span>自定义组合</span>
                    <span>{customCombinationsExpanded ? '▼' : '▶'}</span>
                  </button>
                  
                  {customCombinationsExpanded && (
                    <div className="space-y-2">
                      {state.combinations
                        .filter(c => !DEFAULT_COMBINATIONS.some(dc => dc.id === c.id))
                        .map((combination) => (
                          <div key={combination.id} className="bg-white rounded-md p-2 shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="text-sm font-medium text-gray-800">{combination.name || '未命名组合'}</h4>
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => {
                                    // 复制组合逻辑
                                    const copyCombination = {
                                      ...combination,
                                      id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
                                      name: `${combination.name} (复制)`,
                                      segments: combination.segments.map(segment => ({
                                        ...segment,
                                        id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
                                      })),
                                      createdAt: new Date(),
                                      updatedAt: new Date()
                                    };
                                    dispatch({ type: 'ADD_COMBINATION', payload: copyCombination });
                                  }}
                                  className="text-xs text-green-600 hover:text-green-800"
                                >
                                  复制
                                </button>
                                <button
                                  onClick={() => {
                                    // 编辑组合逻辑
                                    setEditingCombination(combination);
                                    setCurrentPage('config');
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                  编辑
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm('确定要删除这个计时组合吗？')) {
                                      dispatch({ type: 'DELETE_COMBINATION', payload: combination.id });
                                    }
                                  }}
                                  className="text-xs text-red-600 hover:text-red-800"
                                >
                                  删除
                                </button>
                              </div>
                            </div>
                          
                            {/* 时间段列表 */}
                            <div className="space-y-1">
                              {combination.segments.map((segment) => (
                                <div key={segment.id} className="flex items-center space-x-2 p-1 rounded" style={{ backgroundColor: `${segment.color}20` }}>
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }} />
                                  <div className="flex-1 text-xs">
                                    <div className="font-medium text-left">{segment.name}</div>
                                    <div className="text-gray-500 text-left">{segment.duration}秒</div>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    {segment.showTime && (
                                      <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">显示时间</span>
                                    )}
                                    {segment.playSound && (
                                      <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">提示音</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      {state.combinations.filter(c => !DEFAULT_COMBINATIONS.some(dc => dc.id === c.id)).length === 0 && (
                        <p className="text-xs text-gray-400 italic text-center py-2">暂无自定义组合</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* 实时时间线和控制按钮（仅在计时页面、显示且展开时显示） */}
        {currentPage === 'timer' && showSidebar && (sidebarExpanded || mobileMenuOpen) && (
          <div className="p-3 overflow-y-auto flex-1 text-sm">
            <div className="bg-gray-50 rounded-lg p-3 space-y-2.5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-800">当前会话</h3>
              {state.currentSession && (
                <div className="space-y-0.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">名称:</span>
                    <span className="font-medium">{state.currentSession.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">开始时间:</span>
                    <span className="font-medium">
                      {new Date(state.currentSession.startTime).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">持续时间:</span>
                    <span className="font-medium text-blue-600">
                      {Math.floor(state.elapsedTime / 60).toString().padStart(2, '0')}:
                      {(state.elapsedTime % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>
              )}
              
              {state.currentCombination && state.currentCombination.segments[state.currentSegmentIndex] && (
                <div className="mt-2 space-y-0.5 text-xs">
                  <h3 className="text-sm font-semibold text-gray-800">当前时间段</h3>
                  <div className="flex justify-between">
                    <span className="text-gray-600">名称:</span>
                    <span className="font-medium">
                      {state.currentCombination.segments[state.currentSegmentIndex].name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">剩余时间:</span>
                    <span className="font-medium text-green-600">
                      {Math.floor((state.currentCombination.segments[state.currentSegmentIndex].duration - (state.elapsedTime - state.currentCombination.segments.slice(0, state.currentSegmentIndex).reduce((sum, s) => sum + s.duration, 0))) / 60).toString().padStart(2, '0')}:
                      {(state.currentCombination.segments[state.currentSegmentIndex].duration - (state.elapsedTime - state.currentCombination.segments.slice(0, state.currentSegmentIndex).reduce((sum, s) => sum + s.duration, 0)) % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">颜色:</span>
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: state.currentCombination.segments[state.currentSegmentIndex].color }}
                    />
                  </div>
                </div>
              )}
              
              {/* 计时进度 */}
              {state.currentCombination && (
                <div className="mt-2 space-y-1.5">
                  <h3 className="text-sm font-semibold text-gray-800">计时进度</h3>
                  {state.currentCombination.segments.map((segment, index) => {
                    const segmentStart = state.currentCombination?.segments.slice(0, index).reduce((sum, s) => sum + s.duration, 0) || 0;
                    const isCurrent = index === state.currentSegmentIndex;
                    const isCompleted = index < state.currentSegmentIndex;
                    
                    return (
                      <div key={segment.id} className="space-y-0.5">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>{segment.name}</span>
                          <span>{segment.duration}秒</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div
                            className="h-1 rounded-full transition-all duration-300"
                            style={{
                              backgroundColor: segment.color,
                              width: isCompleted ? '100%' : 
                                     isCurrent ? `${Math.min(100, ((state.elapsedTime - segmentStart) / segment.duration) * 100)}%` : '0%'
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* 计时控制按钮 - 移至侧边栏 */}
              {state.isRunning && (
                <div className="mt-3 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-800">计时控制</h3>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => {
                        dispatch({ type: 'TOGGLE_COUNTDOWN_DISPLAY' });
                      }}
                      className="w-full px-3 py-2 text-xs bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg shadow-sm hover:shadow-md transition-all hover:from-gray-700 hover:to-gray-800"
                    >
                      {state.showCountdown ? '隐藏倒计时' : '显示倒计时'}
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => dispatch({ type: 'SET_PAUSED', payload: !state.isPaused })}
                      className="px-3 py-2 text-xs bg-gradient-to-r from-yellow-600 to-amber-600 text-white rounded-lg shadow-sm hover:shadow-md transition-all hover:from-yellow-700 hover:to-amber-700"
                    >
                      {state.isPaused ? '继续' : '暂停'}
                    </button>
                    <button
                      onClick={() => dispatch({ type: 'RESET_TIMER' })}
                      className="px-3 py-2 text-xs bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg shadow-sm hover:shadow-md transition-all hover:from-gray-700 hover:to-gray-800"
                    >
                      重置
                    </button>
                    <button
                      onClick={() => {
                        if (state.currentSession) {
                          dispatch({ type: 'END_SESSION', payload: { sessionId: state.currentSession.id, endTime: new Date() } });
                        }
                      }}
                      className="px-3 py-2 text-xs bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg shadow-sm hover:shadow-md transition-all hover:from-red-700 hover:to-rose-700"
                    >
                      结束
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* 历史记录筛选下拉选项（仅在时间线页面、展开时显示） */}
        {currentPage === 'timeline' && (sidebarExpanded || mobileMenuOpen) && (
          <div className="p-3 text-sm">
            <div className="bg-gray-50 rounded-lg p-4 shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span>📅</span> 历史记录筛选
              </h3>
              <div className="relative">
                <select
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
                  value={selectedDate}
                  onChange={(e) => {
                    handleDateChange(e.target.value);
                    setShowSidebar(true);
                  }}
                >
                  {availableDates.map(date => (
                    <option key={date} value={date}>
                      {date}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>
      
      {/* 右侧主要内容 - 自适应宽度，支持滚动 */}
      <main className={`flex-1 transition-all duration-300 ${sidebarExpanded ? 'md:ml-72' : 'md:ml-20'} overflow-auto`}>
        {/* 页面内容 - 居中显示，有最大宽度 */}
        <div className="max-w-5xl mx-auto p-6">
          {/* 根据当前页面渲染不同的组件 */}
          {currentPage === 'timer' && <TimerDisplay />}
          {currentPage === 'config' && <TimingConfig />}
          {currentPage === 'timeline' && <Timeline selectedDate={selectedDate} />}
          {currentPage === 'contact' && <Contact />}
        </div>
      </main>
    </div>
  );
}

export default App;
