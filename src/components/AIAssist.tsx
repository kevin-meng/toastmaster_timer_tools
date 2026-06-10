import React, { useState, useEffect } from 'react';
import {
  getApiKey, saveApiKey, getPromptTemplate, savePromptTemplate, resetPromptTemplate,
} from '../utils/ai';

// ============================================================
// 共享 tab 状态（第 2、3 栏同步）
// ============================================================
type SubTab = 'text' | 'voice';
let _tab: SubTab = 'text';
const _ls = new Set<() => void>();
function useTab() {
  const [t, st] = useState<SubTab>(_tab);
  useEffect(() => { const f = () => st(_tab); _ls.add(f); return () => { _ls.delete(f); }; }, []);
  return [t, (v: SubTab) => { _tab = v; _ls.forEach(f => f()); }] as const;
}

// ============================================================
// 第 2 栏：子 tab 切换
// ============================================================
const Panel: React.FC = () => {
  const [tab, setTab] = useTab();
  return (
    <div className="flex flex-col gap-2 p-3">
      <button onClick={() => setTab('text')}
        className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all text-left px-4 ${tab === 'text' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-500 hover:text-gray-700 border border-gray-200'}`}
      >📝 文本 AI</button>
      <button onClick={() => setTab('voice')}
        className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all text-left px-4 ${tab === 'voice' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-500 hover:text-gray-700 border border-gray-200'}`}
      >🎙️ 语音 AI</button>
    </div>
  );
};

// ============================================================
// 第 3 栏：内容（受栏 2 tab 控制）
// ============================================================
const Main: React.FC = () => {
  const [tab] = useTab();
  return (
    <div className="w-full max-w-3xl mx-auto">
      {tab === 'text' && <TextSettings />}
      {tab === 'voice' && <VoicePlaceholder />}
    </div>
  );
};

// ============================================================
// 文本 AI 设置
// ============================================================
const TextSettings: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [promptExpanded, setPromptExpanded] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setApiKey(getApiKey()); setPrompt(getPromptTemplate()); }, []);

  const handleSaveAll = () => { saveApiKey(apiKey.trim()); savePromptTemplate(prompt); setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-base font-semibold text-gray-800 mb-3">🔑 DeepSeek API Key</h3>
        <div className="relative">
          <input type={showKey ? 'text' : 'password'} value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-..."
            className="w-full px-3 py-2.5 pr-10 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm font-mono" />
          <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm">{showKey ? '🙈' : '👁️'}</button>
        </div>
        <p className="text-xs text-gray-400 mt-2">🔒 仅存储于浏览器本地，不上传任何服务器</p>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <button onClick={() => setPromptExpanded(!promptExpanded)} className="w-full flex items-center justify-between text-base font-semibold text-gray-800">
          <span>📝 提示词模板</span><span className="text-xs text-gray-400">{promptExpanded ? '收起 ▲' : '展开编辑 ▼'}</span>
        </button>
        {promptExpanded && (
          <div className="mt-3 space-y-3">
            <p className="text-xs text-gray-400">变量 <code className="bg-gray-100 px-1 rounded">{'{meeting_date}'}</code>、<code className="bg-gray-100 px-1 rounded">{'{meeting_data}'}</code> 自动替换</p>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={14}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm resize-y font-mono leading-relaxed" />
            <button onClick={() => setPrompt(resetPromptTemplate())} className="px-3 py-1.5 text-xs text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">🔄 恢复默认模板</button>
          </div>
        )}
      </div>

      <button onClick={handleSaveAll} className={`w-full py-3 rounded-xl shadow-md transition-all text-sm font-medium ${saved ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'}`}>
        {saved ? '✅ 已保存' : '💾 保存全部设置'}
      </button>
    </div>
  );
};

const VoicePlaceholder: React.FC = () => (
  <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100 text-center">
    <div className="text-5xl mb-4">🎙️</div>
    <p className="text-gray-700 font-semibold text-lg mb-1">语音 AI 功能开发中</p>
    <p className="text-gray-400 text-sm">敬请期待 · Coming Soon</p>
  </div>
);

export default { Panel, Main };
