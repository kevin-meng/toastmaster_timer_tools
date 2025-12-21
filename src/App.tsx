import { useState, useEffect } from 'react';
import './App.css';
import TimingConfig from './components/TimingConfig';
import TimerDisplay from './components/TimerDisplay';
import Timeline from './components/Timeline';
import { useTimerContext } from './context/TimerContext';

// 定义页面类型
type Page = 'config' | 'timer' | 'timeline';

function App() {
  // 状态管理：当前页面
  const [currentPage, setCurrentPage] = useState<Page>('config');
  // 状态管理：侧边栏显示
  const [showSidebar, setShowSidebar] = useState(false);
  
  // 获取计时器上下文
  const { state } = useTimerContext();
  
  // 监听计时器状态，当开始计时时显示侧边栏
  useEffect(() => {
    if (state.isRunning) {
      setShowSidebar(true);
    }
  }, [state.isRunning]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* 导航栏 */}
      <nav className="bg-white/80 backdrop-blur-md shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Toastmasters Timer
              </h1>
            </div>
            <div className="flex items-center space-x-1">
              {(['config', 'timer', 'timeline'] as const).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${currentPage === page 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'}`}
                >
                  {page === 'config' && '计时配置'}
                  {page === 'timer' && '正式计时'}
                  {page === 'timeline' && '时间线'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        <main className="bg-white rounded-xl shadow-xl p-8 transition-all duration-300 hover:shadow-2xl">
          {/* 页面标题 */}
          <h2 className="text-3xl font-bold text-gray-800 mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {currentPage === 'config' && '计时组合配置'}
            {currentPage === 'timer' && '正式计时'}
            {currentPage === 'timeline' && '时间线记录'}
          </h2>

          {/* 页面内容 */}
          {currentPage === 'config' && <TimingConfig />}
          {currentPage === 'timer' && <TimerDisplay />}
          {currentPage === 'timeline' && <Timeline />}
        </main>
        
        {/* 侧边栏时间线弹窗 */}
        {showSidebar && (
          <>
            {/* 移动端背景遮罩 */}
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 sm:hidden" onClick={() => setShowSidebar(false)} />
            
            {/* 侧边栏 */}
            <aside className={`fixed top-0 right-0 h-full bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${showSidebar ? 'translate-x-0' : 'translate-x-full'}
              ${showSidebar ? 'sm:w-80' : 'sm:w-0'}
              w-full sm:w-80
            `}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">实时时间线</h3>
                  <button
                    onClick={() => setShowSidebar(false)}
                    className="text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* 时间线内容 */}
                <div className="space-y-4 max-h-[calc(100vh-120px)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {state.currentSession && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-800 mb-2">当前会话</h4>
                      <div className="space-y-1 text-sm">
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
                    </div>
                  )}
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-2">当前时间段</h4>
                    {state.currentCombination && state.currentCombination.segments[state.currentSegmentIndex] && (
                      <div className="space-y-1 text-sm">
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
                          <div className="flex items-center">
                            <div
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: state.currentCombination.segments[state.currentSegmentIndex].color }}
                            />
                            <span>{state.currentCombination.segments[state.currentSegmentIndex].color}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-2">计时进度</h4>
                    {state.currentCombination && (
                      <div className="space-y-2">
                        {state.currentCombination.segments.map((segment, index) => {
                          const segmentStart = state.currentCombination.segments.slice(0, index).reduce((sum, s) => sum + s.duration, 0);
                          const segmentEnd = segmentStart + segment.duration;
                          const isCurrent = index === state.currentSegmentIndex;
                          const isCompleted = index < state.currentSegmentIndex;
                          
                          return (
                            <div key={segment.id} className="space-y-1">
                              <div className="flex justify-between text-xs text-gray-600">
                                <span>{segment.name}</span>
                                <span>{segment.duration}秒</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="h-2 rounded-full transition-all duration-300"
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
                  </div>
                </div>
              </div>
            </aside>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
