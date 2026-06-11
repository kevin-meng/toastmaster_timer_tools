import { useState, useEffect } from 'react';
import './App.css';
import TimingConfig from './components/TimingConfig';
import TimerDisplay from './components/TimerDisplay';
import Timeline from './components/Timeline';
import { TimelineActionsPanel } from './components/Timeline';
import Contact from './components/Contact';
import AIAssist from './components/AIAssist';
import { useTimerContext } from './context/TimerContext';
import { useAuth } from './context/AuthContext';
import type { TimingCombination } from './types';
import { DEFAULT_COMBINATIONS } from './constants/defaultCombinations';

type Page = 'config' | 'timer' | 'timeline' | 'contact' | 'ai-assist';

interface NavItem {
  page: Page;
  label: string;
  icon: string;
  colorClass: string;
}

const NAV_ITEMS: NavItem[] = [
  { page: 'timer', label: '正式计时', icon: '▶', colorClass: 'bg-blue-500' },
  { page: 'config', label: '时间组设置', icon: '⚙', colorClass: 'bg-purple-500' },
  { page: 'timeline', label: '时间线', icon: '📈', colorClass: 'bg-green-500' },
  { page: 'ai-assist', label: 'AI 辅助', icon: '🤖', colorClass: 'bg-gradient-to-br from-purple-500 to-indigo-500' },
];

function App() {
  const { loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('timer');
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [customCombinationsExpanded, setCustomCombinationsExpanded] = useState(true);
  const [defaultCombinationsExpanded, setDefaultCombinationsExpanded] = useState(true);
  const [sessionName, setSessionName] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [editingCombination, setEditingCombination] = useState<TimingCombination | null>(null);

  const getCurrentDate = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };
  const [selectedDate, setSelectedDate] = useState<string>(getCurrentDate());

  const { state, dispatch } = useTimerContext();

  const availableDates = (() => {
    const dates = new Set<string>();
    dates.add(getCurrentDate());
    state.sessions.forEach(session => {
      const date = new Date(session.startTime);
      dates.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`);
    });
    return Array.from(dates).sort((a, b) => b.localeCompare(a));
  })();

  useEffect(() => {
    const audioFiles = ['/sounds/bell.m4a', '/sounds/bell_service.m4a', '/sounds/chime.m4a'];
    audioFiles.forEach(file => {
      const audio = new Audio();
      audio.src = file;
      audio.preload = 'auto';
      audio.onerror = () => console.warn(`Failed to preload audio: ${file}`);
    });
  }, []);

  useEffect(() => {
    if (currentPage === 'config' && editingCombination) {
      dispatch({ type: 'SET_CURRENT_COMBINATION', payload: editingCombination });
    }
  }, [currentPage, editingCombination, dispatch]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const expanded = sidebarExpanded || mobileMenuOpen;

  // ---- 处理结束会话：保存输入框中的名称和备注到记录 ----
  const handleEndSession = () => {
    if (!state.currentSession) return;
    const displayName = sessionName.trim() || state.currentSession.name;
    const displayNotes = sessionNotes.trim() || state.currentSession.notes || '';
    // 先更新 sessions 列表中当前会话的名称和备注
    const updatedSessions = state.sessions.map(s => {
      if (s.id === state.currentSession!.id) {
        return { ...s, name: displayName, notes: displayNotes };
      }
      return s;
    });
    dispatch({ type: 'SET_SESSIONS', payload: updatedSessions });
    dispatch({ type: 'END_SESSION', payload: { sessionId: state.currentSession.id, endTime: new Date() } });
    setSessionName('');
    setSessionNotes('');
  };

  // ---- 第 2 栏面板 ----
  const renderPanel = () => {
    if (currentPage === 'timer') {
      return (
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">选择计时组合</h3>
            <select
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all"
              onChange={(e) => {
                if (e.target.value === 'new') { setCurrentPage('config'); return; }
                const combination = state.combinations.find(c => c.id === e.target.value) || DEFAULT_COMBINATIONS.find(c => c.id === e.target.value);
                if (combination) dispatch({ type: 'SET_CURRENT_COMBINATION', payload: combination });
              }}
              value={state.currentCombination?.id || ''}
            >
              <option value="">请选择计时组合</option>
              <optgroup label="默认时间组合">
                {DEFAULT_COMBINATIONS.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </optgroup>
              <optgroup label="自定义时间组合">
                {state.combinations.filter(c => !DEFAULT_COMBINATIONS.some(dc => dc.id === c.id)).map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </optgroup>
              <option value="new" className="text-blue-600 font-medium">+ 创建新的时间组合</option>
            </select>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">会话信息</h3>
            <div className="space-y-2.5">
              <input
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all"
                placeholder="会话名称"
                value={sessionName}
                onChange={e => setSessionName(e.target.value)}
              />
              <textarea
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all resize-y min-h-[60px] max-h-[100px]"
                placeholder="备注（可选）"
                rows={2}
                value={sessionNotes}
                onChange={e => setSessionNotes(e.target.value)}
              />
              <button
                onClick={() => {
                  if (state.currentCombination) {
                    const displayName = sessionName.trim() || '未命名会话';
                    const displayNotes = sessionNotes.trim();
                    const newSession = {
                      id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
                      name: displayName,
                      notes: displayNotes,
                      combinationId: state.currentCombination.id,
                      startTime: new Date(),
                      createdAt: new Date(),
                    };
                    dispatch({ type: 'START_SESSION', payload: newSession });
                  }
                }}
                className="w-full py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium"
                disabled={!state.currentCombination || state.isRunning}
              >
                🟢 开始计时
              </button>
            </div>
          </div>

          {/* 计时进度 + 控制 */}
          {state.currentCombination && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">计时进度</h3>
              {state.currentSession && (
                <div className="space-y-1 text-xs mb-3 pb-3 border-b border-gray-100">
                  <div className="flex justify-between"><span className="text-gray-500">名称</span><span className="font-medium">{state.currentSession.name}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">开始</span><span className="font-medium">{new Date(state.currentSession.startTime).toLocaleTimeString()}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">已用</span><span className="font-medium text-blue-600">{String(Math.floor(state.elapsedTime / 60)).padStart(2, '0')}:{String(state.elapsedTime % 60).padStart(2, '0')}</span></div>
                </div>
              )}
              <div className="space-y-2">
                {state.currentCombination.segments.map((segment, index) => {
                  const segmentStart = state.currentCombination!.segments.slice(0, index).reduce((sum, s) => sum + s.duration, 0);
                  const isCurrent = index === state.currentSegmentIndex;
                  const isCompleted = index < state.currentSegmentIndex;
                  return (
                    <div key={segment.id} className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span className={isCurrent ? 'font-semibold' : ''}>{segment.name}</span>
                        <span>{Math.floor(segment.duration / 60)}:{String(segment.duration % 60).padStart(2, '0')}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full transition-all duration-300" style={{ backgroundColor: segment.color, width: isCompleted ? '100%' : isCurrent ? `${Math.min(100, ((state.elapsedTime - segmentStart) / segment.duration) * 100)}%` : '0%' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {state.isRunning && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">计时控制</h3>
              <div className="space-y-2">
                <button onClick={() => dispatch({ type: 'TOGGLE_COUNTDOWN_DISPLAY' })} className="w-full py-2 text-xs bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all font-medium">
                  {state.showCountdown ? '隐藏倒计时' : '显示倒计时'}
                </button>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => dispatch({ type: 'SET_PAUSED', payload: !state.isPaused })} className="py-2 text-xs bg-amber-500 text-white rounded-xl shadow-sm hover:shadow-md transition-all font-medium">
                    {state.isPaused ? '继续' : '暂停'}
                  </button>
                  <button onClick={() => dispatch({ type: 'RESET_TIMER' })} className="py-2 text-xs bg-gray-500 text-white rounded-xl shadow-sm hover:shadow-md transition-all font-medium">重置</button>
                  <button onClick={handleEndSession} className="py-2 text-xs bg-red-500 text-white rounded-xl shadow-sm hover:shadow-md transition-all font-medium">结束</button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (currentPage === 'config') {
      return (
        <div className="p-4 overflow-y-auto flex-1">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-gray-800">计时组合列表</h3>
              <button onClick={() => { const ids = DEFAULT_COMBINATIONS.map(dc => dc.id); state.combinations.forEach(c => { if (!ids.includes(c.id)) dispatch({ type: 'DELETE_COMBINATION', payload: c.id }); }); }} className="text-xs text-red-500 hover:text-red-700">删除自定义</button>
            </div>
            <div className="space-y-4">
              <div>
                <button onClick={() => setDefaultCombinationsExpanded(!defaultCombinationsExpanded)} className="w-full flex items-center justify-between text-xs font-semibold text-gray-500 uppercase mb-2 hover:bg-gray-50 p-1 rounded-lg transition-colors">
                  <span>默认组合</span><span>{defaultCombinationsExpanded ? '▼' : '▶'}</span>
                </button>
                {defaultCombinationsExpanded && (
                  <div className="space-y-2">
                    {DEFAULT_COMBINATIONS.map(c => (
                      <div key={c.id} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-sm font-medium text-gray-800">{c.name}</h4>
                          <button onClick={() => { const copy = { ...c, id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15), name: `${c.name} (复制)`, segments: c.segments.map(s => ({ ...s, id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) })), createdAt: new Date(), updatedAt: new Date() }; dispatch({ type: 'ADD_COMBINATION', payload: copy }); }} className="text-xs text-green-600 hover:text-green-800">复制</button>
                        </div>
                        <div className="space-y-1">
                          {c.segments.map(s => (
                            <div key={s.id} className="flex items-center gap-1.5 p-1.5 rounded-lg" style={{ backgroundColor: `${s.color}20` }}>
                              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                              <span className="flex-1 text-xs font-medium text-left">{s.name}</span>
                              <span className="text-[10px] flex-shrink-0 w-4 text-center">{s.playSound ? '🔔' : ''}</span>
                              <span className="text-[10px] flex-shrink-0 w-4 text-center">{s.showTime ? '🕐' : ''}</span>
                              <span className="text-[10px] text-gray-400 flex-shrink-0 text-right w-10">{Math.floor(s.duration / 60)}:{String(s.duration % 60).padStart(2, '0')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <button onClick={() => setCustomCombinationsExpanded(!customCombinationsExpanded)} className="w-full flex items-center justify-between text-xs font-semibold text-gray-500 uppercase mb-2 hover:bg-gray-50 p-1 rounded-lg transition-colors">
                  <span>自定义组合</span><span>{customCombinationsExpanded ? '▼' : '▶'}</span>
                </button>
                {customCombinationsExpanded && (
                  <div className="space-y-2">
                    {state.combinations.filter(c => !DEFAULT_COMBINATIONS.some(dc => dc.id === c.id)).map(c => (
                      <div key={c.id} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-sm font-medium text-gray-800">{c.name || '未命名组合'}</h4>
                          <div className="flex gap-1">
                            <button onClick={() => { const copy = { ...c, id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15), name: `${c.name} (复制)`, segments: c.segments.map(s => ({ ...s, id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) })), createdAt: new Date(), updatedAt: new Date() }; dispatch({ type: 'ADD_COMBINATION', payload: copy }); }} className="text-xs text-green-600 hover:text-green-800">复制</button>
                            <button onClick={() => { setEditingCombination(c); setCurrentPage('config'); }} className="text-xs text-blue-600 hover:text-blue-800">编辑</button>
                            <button onClick={() => { if (window.confirm('确定删除？')) dispatch({ type: 'DELETE_COMBINATION', payload: c.id }); }} className="text-xs text-red-500 hover:text-red-700">删除</button>
                          </div>
                        </div>
                        <div className="space-y-1">
                          {c.segments.map(s => (
                            <div key={s.id} className="flex items-center gap-1.5 p-1.5 rounded-lg" style={{ backgroundColor: `${s.color}20` }}>
                              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                              <span className="flex-1 text-xs font-medium text-left">{s.name}</span>
                              <span className="text-[10px] flex-shrink-0 w-4 text-center">{s.playSound ? '🔔' : ''}</span>
                              <span className="text-[10px] flex-shrink-0 w-4 text-center">{s.showTime ? '🕐' : ''}</span>
                              <span className="text-[10px] text-gray-400 flex-shrink-0 text-right w-10">{Math.floor(s.duration / 60)}:{String(s.duration % 60).padStart(2, '0')}</span>
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
      );
    }

    if (currentPage === 'timeline') {
      return (
        <div className="p-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span>📅</span> 日期筛选
            </h3>
            <select
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
            >
              {availableDates.map(date => (<option key={date} value={date}>{date}</option>))}
            </select>
          </div>
          {/* Timeline 操作按钮放在第 2 栏 */}
          {state.sessions.filter(s => {
            const d = new Date(s.startTime);
            const sd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            return sd === selectedDate && !s.deleted;
          }).length > 0 && (
            <TimelineActionsPanel selectedDate={selectedDate} />
          )}
        </div>
      );
    }

    // AI 辅助 — 文本设置 & 语音设置（占位）
    if (currentPage === 'ai-assist') {
      return <AIAssist.Panel />;
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col md:flex-row">
      {/* ===== 移动端顶部 ===== */}
      <div className="md:hidden bg-white shadow-sm border-b border-gray-100 p-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Toastmasters" className="h-8 w-auto object-contain" />
          <div className="leading-tight">
            <div className="text-sm font-bold text-gray-800">时间官</div>
            <div className="text-xs font-semibold text-gray-500">Timer</div>
          </div>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* ===== 第 1 栏：导航边栏 ===== */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-screen z-50 bg-white shadow-lg flex flex-col transition-all duration-300 ease-in-out border-r border-gray-100
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${sidebarExpanded ? 'w-64' : 'w-[4.5rem]'}
      `}>
        <div className={`flex items-center border-b border-gray-100 ${sidebarExpanded ? 'p-4 justify-between' : 'p-3 flex-col gap-2'}`}>
          {sidebarExpanded ? (
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Toastmasters" className="h-9 w-auto object-contain" />
              <div className="leading-tight">
                <div className="text-base font-bold text-gray-800">时间官</div>
                <div className="text-xs font-semibold text-gray-500">Timer</div>
              </div>
            </div>
          ) : (
            <img src="/logo.png" alt="TM" className="h-9 w-auto object-contain" />
          )}
          <button onClick={() => setSidebarExpanded(!sidebarExpanded)} className="hidden md:block p-1 rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
            {sidebarExpanded ? '◀' : '▶'}
          </button>
          <button onClick={() => setMobileMenuOpen(false)} className="md:hidden p-1 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">✕</button>
        </div>

        <nav className="p-2 space-y-1.5 flex-1">
          {NAV_ITEMS.map(item => (
            <button
              key={item.page}
              onClick={() => { setCurrentPage(item.page); setMobileMenuOpen(false); }}
              className={`w-full rounded-xl text-[15px] font-medium transition-all duration-200 flex items-center gap-3 hover:shadow-md hover:translate-x-0.5
                ${expanded ? 'px-4 py-3 text-left' : 'px-0 py-3 justify-center'}
                ${currentPage === item.page ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'}`}
            >
              <span className={`w-6 h-6 ${item.colorClass} rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0`}>
                {item.icon}
              </span>
              {expanded && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* 联系我们 */}
        <div className="border-t border-gray-100">
          <button
            onClick={() => { setCurrentPage('contact'); setMobileMenuOpen(false); }}
            className={`w-full rounded-none transition-all duration-200 flex items-center gap-3 hover:bg-gray-50
              ${expanded ? 'px-4 py-3 text-left' : 'px-0 py-3 justify-center'}
              ${currentPage === 'contact' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <span className="text-lg flex-shrink-0 grayscale opacity-40">💬</span>
            {expanded && <span className="text-[15px] font-medium">联系我们</span>}
          </button>
        </div>
      </aside>

      {/* ===== 第 2 栏：设置面板 ===== */}
      <div className="hidden md:flex flex-col bg-gray-50 border-r border-gray-100 overflow-y-auto w-80">
        <div className="px-4 py-3 border-b border-gray-100 bg-white/60">
          <h3 className="text-sm font-semibold text-gray-700">
            {currentPage === 'timer' && '⏱️ 计时设置'}
            {currentPage === 'config' && '⚙️ 组合管理'}
            {currentPage === 'timeline' && '📈 日期筛选'}
            {currentPage === 'ai-assist' && '🤖 AI 设置'}
            {currentPage === 'contact' && '💬 联系方式'}
          </h3>
        </div>
        {renderPanel()}
      </div>

      {/* 移动端：第 2 栏以浮层面板展示 */}
      {currentPage !== 'timer' && mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[65px] bottom-0 z-45 bg-gray-50 overflow-y-auto">
          <div className="py-2">{renderPanel()}</div>
        </div>
      )}

      {/* ===== 第 3 栏：主内容 ===== */}
      <main className="flex-1 transition-all duration-300 overflow-auto">
        {/* 移动端计时页面同时展示第 2 栏（计时设置）在第 3 栏顶部 */}
        <div className="md:hidden">
          {!mobileMenuOpen && renderPanel()}
        </div>
        <div className={currentPage === 'timer' ? '' : 'hidden'}>
          <TimerDisplay />
        </div>
        {currentPage !== 'timer' && (
          <div className="max-w-5xl mx-auto p-4 md:p-6">
            {currentPage === 'config' && <TimingConfig />}
            {currentPage === 'timeline' && <Timeline selectedDate={selectedDate} />}
            {currentPage === 'contact' && <Contact />}
            {currentPage === 'ai-assist' && <AIAssist.Main />}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
