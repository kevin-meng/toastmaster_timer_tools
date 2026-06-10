import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useTimerContext } from '../context/TimerContext';
import { DEFAULT_COMBINATIONS } from '../constants/defaultCombinations';
import {
  formatMeetingData,
  callDeepSeekAPI,
  getApiKey,
  getPromptTemplate,
  parseAIResponse,
  getReports,
  saveReport,
  deleteReport,
  type SavedReport,
} from '../utils/ai';
import type { TimingCombination } from '../types';

// ---- Markdown → HTML ----
const markdownToHtml = (md: string): string => {
  const lines = md.split('\n');
  let out = '', listOpen = false;
  for (let i = 0; i < lines.length; i++) {
    let l = lines[i];
    l = l.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    l = l.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');
    l = l.replace(/\*(.+?)\*/g, '<em>$1</em>');
    l = l.replace(/`(.+?)`/g, '<code class="bg-gray-100 text-rose-600 px-1 py-0.5 rounded text-xs font-mono">$1</code>');
    const h6 = l.match(/^######\s+(.+)/);
    if (h6) { if (listOpen) { out += '</ul>'; listOpen = false; }; out += `<h6 class="text-xs font-semibold text-gray-600 mt-2 mb-1">${h6[1]}</h6>`; continue; }
    const h5 = l.match(/^#####\s+(.+)/);
    if (h5) { if (listOpen) { out += '</ul>'; listOpen = false; }; out += `<h5 class="text-sm font-semibold text-gray-700 mt-3 mb-1">${h5[1]}</h5>`; continue; }
    const h4 = l.match(/^####\s+(.+)/);
    if (h4) { if (listOpen) { out += '</ul>'; listOpen = false; }; out += `<h4 class="text-base font-semibold text-gray-800 mt-3 mb-1">${h4[1]}</h4>`; continue; }
    const h3 = l.match(/^###\s+(.+)/);
    if (h3) { if (listOpen) { out += '</ul>'; listOpen = false; }; out += `<h3 class="text-lg font-bold text-gray-900 mt-4 mb-2">${h3[1]}</h3>`; continue; }
    const h2 = l.match(/^##\s+(.+)/);
    if (h2) { if (listOpen) { out += '</ul>'; listOpen = false; }; out += `<h2 class="text-xl font-bold text-gray-900 mt-5 mb-3 pb-1 border-b border-gray-100">${h2[1]}</h2>`; continue; }
    const h1 = l.match(/^#\s+(.+)/);
    if (h1) { if (listOpen) { out += '</ul>'; listOpen = false; }; out += `<h1 class="text-2xl font-bold text-gray-900 mt-5 mb-3">${h1[1]}</h1>`; continue; }
    if (/^-\s/.test(l)) {
      if (!listOpen) { out += '<ul class="space-y-1 my-2 pl-1">'; listOpen = true; }
      out += `<li class="flex items-start gap-2 text-gray-700 text-sm"><span class="text-gray-300 mt-1.5 flex-shrink-0">•</span><span>${l.replace(/^-\s/, '')}</span></li>`;
      continue;
    }
    if (/^\d+[.)]\s/.test(l)) {
      if (!listOpen) { out += '<ul class="space-y-1 my-2 pl-1">'; listOpen = true; }
      const n = l.match(/^(\d+)[.)]/)?.[1] || '';
      out += `<li class="flex items-start gap-2 text-gray-700 text-sm"><span class="text-gray-400 mt-0.5 flex-shrink-0 w-5 text-right font-mono text-xs">${n}.</span><span>${l.replace(/^\d+[.)]\s/, '')}</span></li>`;
      continue;
    }
    if (listOpen) { out += '</ul>'; listOpen = false; }
    if (l.trim() === '') { out += '<div class="h-2"></div>'; continue; }
    out += `<p class="text-gray-700 text-sm leading-relaxed">${l}</p>`;
  }
  if (listOpen) out += '</ul>';
  return out;
};

// ============================================================
// 第 2 栏操作面板
// ============================================================
export const TimelineActionsPanel: React.FC<{ selectedDate: string }> = ({ selectedDate }) => {
  const { state } = useTimerContext();
  const [generating, setGenerating] = useState(false);
  const [reportError, setReportError] = useState('');

  const getCombination = useCallback((id: string): TimingCombination | undefined =>
    state.combinations.find(c => c.id === id) || DEFAULT_COMBINATIONS.find(c => c.id === id),
  [state.combinations]);

  const fmtDate = (d: Date | string) => { const dt = new Date(d); return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`; };
  const hasSessions = state.sessions.filter(s => fmtDate(s.startTime) === selectedDate && !s.deleted).length > 0;

  const handleGenerate = async () => {
    // 如果已有报告，先确认
    const existing = getReports().find(r => r.date === selectedDate);
    if (existing && !window.confirm('已有时间官报告，确定要重新生成吗？之前的报告将被覆盖。\n\n确定：重新生成 | 取消：保留现有报告')) {
      return;
    }
    setReportError(''); setGenerating(true);
    const apiKey = getApiKey();
    if (!apiKey) { setReportError('请先在 AI 辅助页面填写 API Key'); setGenerating(false); return; }
    const daySessions = state.sessions.filter(s => fmtDate(s.startTime) === selectedDate && !s.deleted);
    if (daySessions.length === 0) { setReportError('无有效记录'); setGenerating(false); return; }
    try {
      const meetingData = formatMeetingData(daySessions, getCombination);
      const prompt = getPromptTemplate().replace(/\{meeting_date\}/g, selectedDate).replace(/\{meeting_data\}/g, meetingData);
      const raw = await callDeepSeekAPI(apiKey, prompt);
      const parsed = parseAIResponse(raw);
      const r: SavedReport = { id: existing?.id || Date.now().toString(36) + Math.random().toString(36).substring(2, 8), date: selectedDate, type: 'ai', report: parsed, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      saveReport(r);
      window.dispatchEvent(new CustomEvent('timeline-report-updated', { detail: r }));
    } catch (err: any) { setReportError(err instanceof Error ? err.message : String(err)); }
    finally { setGenerating(false); }
  };

  const handleExportPDF = () => {
    const daySessions = state.sessions.filter(s => fmtDate(s.startTime) === selectedDate && !s.deleted);
    const existing = getReports().find(r => r.date === selectedDate);

    const rows = daySessions.map((s, i) => {
      const c = getCombination(s.combinationId);
      const expected = c ? c.segments.reduce((sum, seg) => sum + seg.duration, 0) : 0;
      const actual = s.duration || (s.endTime ? Math.floor((new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 1000) : 0);
      const ot = actual - expected;
      return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center">${i + 1}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-weight:600">${s.name.replace(/</g, '&lt;')}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280">${c ? c.name : '—'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-family:monospace;text-align:right">${String(Math.floor(actual / 60)).padStart(2, '0')}:${String(actual % 60).padStart(2, '0')}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-family:monospace;text-align:right;color:#9ca3af">${String(Math.floor(expected / 60)).padStart(2, '0')}:${String(expected % 60).padStart(2, '0')}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;color:${ot > 0 ? '#ef4444' : '#22c55e'};font-weight:600">${ot > 0 ? `+${ot}s` : 'OK'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:12px">${(s.notes || '—').replace(/</g, '&lt;')}</td>
      </tr>`;
    }).join('');

    const zhReport = existing ? existing.report.zh.summary + '\n\n' + existing.report.zh.report : '';
    const enReport = existing ? existing.report.en.summary + '\n\n' + existing.report.en.report : '';

    // 将 Markdown 转为 HTML（紧凑排版）
    const renderMD = (text: string) => {
      let html = text
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/^\- (.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>\n?)+/gs, '<ul>$&</ul>')
        .replace(/\n\n/g, '\n')
        .replace(/\n/g, '');
      return html;
    };

    const html = `<!DOCTYPE html>
<html lang="zh"><head><meta charset="UTF-8"><title>Timer Report – ${selectedDate}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans SC", sans-serif; font-size: 13px; color: #374151; padding: 40px 48px; max-width: 780px; margin: 0 auto; }
  h1 { font-size: 22px; font-weight: 800; color: #111827; margin-bottom: 2px; }
  .date { color: #9ca3af; font-size: 12px; margin-bottom: 24px; }
  h2 { font-size: 16px; font-weight: 700; color: #1f2937; margin: 24px 0 8px; padding-bottom: 4px; border-bottom: 1px solid #e5e7eb; }
  h3 { font-size: 14px; font-weight: 600; color: #374151; margin: 14px 0 4px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th { text-align: left; padding: 6px 10px; font-size: 10px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1.5px solid #e5e7eb; }
  td { font-size: 12px; }
  .report { font-size: 13px; line-height: 1.5; color: #374151; background: #f9fafb; border-radius: 10px; padding: 20px; margin-bottom: 24px; }
  .report p { margin: 0 0 4px; }
  .report h2 { font-size: 15px; font-weight: 700; color: #1f2937; margin: 12px 0 4px; padding-bottom: 3px; border-bottom: 1px solid #e5e7eb; }
  .report h3 { font-size: 13px; font-weight: 600; color: #374151; margin: 8px 0 2px; }
  .report ul { margin: 2px 0 4px; padding-left: 16px; }
  .report li { margin-bottom: 1px; }
  .badge { display: inline-block; padding: 1px 7px; border-radius: 9999px; font-size: 10px; font-weight: 600; }
  .ai { background: #f3e8ff; color: #9333ea; }
  .manual { background: #fef3c7; color: #d97706; }
  .footer { margin-top: 36px; padding-top: 12px; border-top: 1px solid #e5e7eb; text-align: center; color: #d1d5db; font-size: 10px; }
  @media print { body { padding: 20px 24px; } }
</style></head><body>
<h1>⏱️ Timer Report</h1>
<p class="date">${selectedDate} · ${daySessions.length} 项记录 · ${existing ? '<span class="badge ' + (existing.type === 'ai' ? 'ai' : 'manual') + '">' + (existing.type === 'ai' ? 'AI 生成' : '人工编辑') + '</span>' : '手动整理'}</p>
<h2>📋 计时记录</h2>
<table><thead><tr><th>#</th><th>演讲者</th><th>组合</th><th style="text-align:right">实际用时</th><th style="text-align:right">预期用时</th><th style="text-align:center">状态</th><th>备注</th></tr></thead><tbody>${rows}</tbody></table>
${existing ? '<h2>🇨🇳 中文报告</h2><div class="report">' + renderMD(zhReport) + '</div><h2>🇬🇧 English Report</h2><div class="report">' + renderMD(enReport) + '</div>' : ''}
<div class="footer">Toastmaster 时间官 · Timer Tools</div>
</body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500); }
    else { const a = document.createElement('a'); a.href = url; a.download = `timer-report-${selectedDate}.html`; a.click(); }
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">报告操作</h3>
      <button onClick={handleGenerate} disabled={generating || !hasSessions}
        className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-sm hover:shadow-md transition-all disabled:bg-gray-300 disabled:shadow-none text-sm font-medium flex items-center gap-2 px-4"
      >{generating ? <><span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"/> 生成中…</> : <>🤖 AI 生成报告</>}</button>
      <button onClick={() => window.dispatchEvent(new CustomEvent('timeline-start-edit'))}
        className="w-full py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all text-sm font-medium flex items-center gap-2 px-4"
      >✏️ 人工编辑</button>
      <button onClick={handleExportPDF}
        className="w-full py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all text-sm font-medium flex items-center gap-2 px-4"
      >🖨️ 导出 PDF</button>
      {reportError && <div className="bg-red-50 border border-red-200 rounded-xl p-3"><p className="text-xs text-red-700">{reportError}</p></div>}
    </div>
  );
};

// ============================================================
// 主组件
// ============================================================
const Timeline: React.FC<{ selectedDate: string }> = ({ selectedDate }) => {
  const { state, dispatch } = useTimerContext();

  // 本地状态
  const [showDeleted, setShowDeleted] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [delConfirm, setDelConfirm] = useState<string | null>(null);

  // 报告状态
  const [aiReport, setAiReport] = useState<SavedReport | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editZh, setEditZh] = useState('');
  const [editEn, setEditEn] = useState('');
  const [lang, setLang] = useState<'zh' | 'en'>('zh');

  // 工具函数
  const fmtTime = (d: Date | string) => new Date(d).toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const fmtDate = (d: Date | string) => { const dt = new Date(d); return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`; };
  const fmtDur = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const getComb = useCallback((id: string): TimingCombination | undefined => state.combinations.find(c => c.id === id) || DEFAULT_COMBINATIONS.find(c => c.id === id), [state.combinations]);
  const combName = (id: string) => { const c = getComb(id); return c ? c.name : '未知组合'; };
  const calcOT = (s: any) => { const c = getComb(s.combinationId); if (!c) return null; const e = c.segments.reduce((sum: number, seg: any) => sum + seg.duration, 0); const a = s.duration || (s.endTime ? Math.floor((new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 1000) : 0); return a - e > 0 ? a - e : null; };

  const [sortAsc, setSortAsc] = useState(false); // 默认降序（最新的在前）→ 改为默认升序

  // Sessions
  const daySessions = useMemo(() => {
    const filtered = state.sessions.filter(s => fmtDate(s.startTime) === selectedDate && (!showDeleted ? !s.deleted : true));
    return filtered.sort((a, b) => {
      const diff = new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      return sortAsc ? diff : -diff;  // false=降序(新→旧), true=升序(旧→新)
    });
  }, [state.sessions, selectedDate, showDeleted, sortAsc]);
  const hasSessions = daySessions.length > 0;

  // 报告加载
  useEffect(() => { setAiReport(getReports().find(r => r.date === selectedDate) || null); setEditMode(false); }, [selectedDate]);
  useEffect(() => { const h = () => setAiReport(getReports().find(r => r.date === selectedDate) || null); window.addEventListener('timeline-report-updated', h); return () => window.removeEventListener('timeline-report-updated', h); }, [selectedDate]);
  useEffect(() => {
    const h = () => { setEditMode(true); const r = getReports().find(r => r.date === selectedDate); if (r) { setEditZh(r.report.zh.report); setEditEn(r.report.en.report); setAiReport(r); } else { setEditZh(''); setEditEn(''); } };
    window.addEventListener('timeline-start-edit', h); return () => window.removeEventListener('timeline-start-edit', h);
  }, [selectedDate]);

  const saveManual = () => {
    const r: SavedReport = { id: aiReport?.id || Date.now().toString(36) + Math.random().toString(36).substring(2, 8), date: selectedDate, type: 'manual',
      report: { zh: { summary: aiReport?.report.zh.summary || '', report: editZh }, en: { summary: aiReport?.report.en.summary || '', report: editEn } },
      createdAt: aiReport?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() };
    saveReport(r); setAiReport(r); setEditMode(false);
  };

  return (
    <div className="w-full">
      {/* 标题行 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{selectedDate}</h2>
          <p className="text-sm text-gray-500 mt-1">会议计时记录</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-600 font-medium"
          >
            {sortAsc ? '↑ 升序' : '↓ 降序'}
          </button>
          <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer select-none">
            <span>显示已删除</span>
            <input type="checkbox" checked={showDeleted} onChange={e => setShowDeleted(e.target.checked)} className="sr-only peer" />
            <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 relative after:absolute" />
          </label>
        </div>
      </div>

      {/* 编辑模式 */}
      {editMode ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 space-y-4">
            {/* Tab 切换：AI 报告 / 人工编辑 */}
            {aiReport && (
              <div className="flex bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5 gap-1">
                <button onClick={() => setEditMode(false)}
                  className="flex-1 py-2 rounded-xl text-sm font-medium transition-all text-gray-500 hover:text-gray-700"
                >🤖 AI 生成报告</button>
                <button
                  className="flex-1 py-2 rounded-xl text-sm font-medium transition-all bg-blue-600 text-white shadow-sm"
                >✏️ 人工编辑</button>
              </div>
            )}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">🇨🇳 中文报告</h3>
              <textarea value={editZh} onChange={e => setEditZh(e.target.value)} rows={12} className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y leading-relaxed" />
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">🇬🇧 English Report</h3>
              <textarea value={editEn} onChange={e => setEditEn(e.target.value)} rows={12} className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y leading-relaxed" />
            </div>
            <div className="flex gap-3">
              <button onClick={saveManual} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl shadow-sm hover:bg-blue-700 text-sm font-semibold transition-colors">💾 保存报告</button>
              <button onClick={() => setEditMode(false)} className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 text-sm font-medium transition-colors">取消</button>
            </div>
          </div>
          <div className="bg-gray-50/70 rounded-2xl border border-gray-100 p-5 max-h-[70vh] overflow-y-auto">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">计时对照</h3>
            <div className="space-y-3">
              {daySessions.map((s, i) => {
                const ot = calcOT(s);
                return (
                  <div key={s.id} className="flex items-start gap-3 text-sm bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                    <span className="text-gray-300 font-mono text-xs w-5 text-right flex-shrink-0 mt-0.5">{i + 1}</span>
                    <div className="flex-1 min-w-0"><p className="font-medium text-gray-800 truncate">{s.name}</p><p className="text-xs text-gray-400">{combName(s.combinationId)}</p></div>
                    <span className={`font-mono text-xs font-medium flex-shrink-0 ${ot ? 'text-red-500' : 'text-green-600'}`}>{fmtDur(s.duration || (s.endTime ? Math.floor((new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 1000) : 0))}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* 报告展示 */
        aiReport && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
            <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-lg">📋</span>
                <h3 className="text-base font-semibold text-gray-900">时间官报告</h3>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${aiReport.type === 'ai' ? 'bg-purple-50 text-purple-600' : 'bg-amber-50 text-amber-600'}`}>{aiReport.type === 'ai' ? 'AI 生成' : '人工编辑'}</span>
              </div>
              <span className="text-xs text-gray-400">{expanded ? '收起 ▲' : '展开 ▼'}</span>
            </button>
            {expanded && (
              <div className="px-6 pb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button onClick={() => setLang('zh')} className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all ${lang === 'zh' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}>🇨🇳 中文</button>
                    <button onClick={() => setLang('en')} className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all ${lang === 'en' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}>🇬🇧 English</button>
                  </div>
                  <button onClick={() => navigator.clipboard.writeText(aiReport.report[lang].report)} className="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors font-medium">📋 复制</button>
                  <button onClick={() => { deleteReport(aiReport.id); setAiReport(null); }} className="px-3 py-1.5 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-auto">🗑️ 删除</button>
                </div>
                {aiReport.report[lang].summary && (
                  <div className="text-sm font-medium text-blue-700 mb-4 px-4 py-3 bg-blue-50/50 rounded-xl border border-blue-100">{aiReport.report[lang].summary}</div>
                )}
                <div className="text-left leading-relaxed bg-white rounded-xl p-6 border border-gray-100 max-h-[60vh] overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: markdownToHtml(aiReport.report[lang].report) }} />
              </div>
            )}
          </div>
        )
      )}

      {/* 无记录 */}
      {!hasSessions ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-16 text-center shadow-sm">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-gray-500 font-medium text-lg">当日暂无计时记录</p>
          <p className="text-gray-400 text-sm mt-2">开始使用计时器后，记录将显示在这里</p>
        </div>
      ) : (
        /* 时间线 */
        <div>
          {daySessions.map((s) => {
            const editing = editId === s.id;
            const deleting = delConfirm === s.id;
            const ot = calcOT(s);
            const dur = s.duration || (s.endTime ? Math.floor((new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 1000) : 0);
            return (
              <div key={s.id} className={`flex gap-4 pb-6 group ${s.deleted ? 'opacity-40' : ''}`}>
                {/* 时间轴 */}
                <div className="flex flex-col items-center flex-shrink-0 pt-1">
                  <div className={`w-3 h-3 rounded-full ${ot ? 'bg-red-500' : 'bg-blue-500'} ring-4 ring-white shadow-sm`} />
                  <div className="w-px bg-gray-200 flex-1 mt-1 group-last:hidden" />
                </div>
                {/* 卡片 */}
                <div className="flex-1 min-w-0">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow p-5 relative">
                    <div className="flex items-start gap-4">
                      {/* 左侧内容 */}
                      <div className="flex-1 min-w-0 text-left">
                        {editing ? (
                          <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full text-lg font-bold text-gray-900 border-b border-gray-200 focus:border-blue-500 outline-none bg-transparent pb-1" />
                        ) : (
                          <h4 className="text-lg font-bold text-gray-900">{s.name}</h4>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-gray-400">
                          <span className="font-mono">{fmtTime(s.startTime)} – {s.endTime ? fmtTime(s.endTime) : '进行中'}</span>
                          <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">{combName(s.combinationId)}</span>
                          <span className={`font-mono font-semibold ${ot ? 'text-red-500' : 'text-green-600'}`}>
                            {fmtDur(dur)}
                            {ot && <span className="ml-1 text-red-400 font-normal">+{fmtDur(ot)}</span>}
                          </span>
                        </div>
                        {/* 备注 */}
                        <div className="mt-3 text-left">
                          {editing ? (
                            <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={2} className="w-full text-sm text-gray-600 border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-100 outline-none resize-y" placeholder="添加备注…" />
                          ) : s.notes ? (
                            <p className="text-sm text-gray-500 leading-relaxed bg-gray-50 rounded-xl p-3">{s.notes}</p>
                          ) : (
                            <span className="text-xs text-gray-300 italic">无备注</span>
                          )}
                        </div>
                        {/* 保存 / 取消 */}
                        {editing && (
                          <div className="flex justify-end gap-2 mt-3">
                            <button onClick={() => setEditId(null)} className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">取消</button>
                            <button onClick={() => { dispatch({ type: 'SET_SESSIONS', payload: state.sessions.map(x => x.id === s.id ? { ...x, name: editTitle, notes: editNotes, updatedAt: new Date() } : x) }); setEditId(null); }}
                              className="px-3 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors font-medium">保存</button>
                          </div>
                        )}
                      </div>
                      {/* 操作按钮 */}
                      <div className="flex gap-1 flex-shrink-0">
                        {s.deleted ? (
                          <button onClick={() => setDelConfirm(s.id)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors text-xs" title="还原">♻️</button>
                        ) : (
                          <>
                            <button onClick={() => { setEditId(s.id); setEditTitle(s.name); setEditNotes(s.notes || ''); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-xs" title="编辑">✏️</button>
                            <button onClick={() => setDelConfirm(s.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-xs" title="删除">🗑️</button>
                          </>
                        )}
                      </div>
                    </div>
                    {/* 删除确认 */}
                    {deleting && (
                      <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-2xl flex items-center justify-center z-20">
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-800 mb-3">{s.deleted ? '还原这条记录？' : '删除这条记录？'}</p>
                          <div className="flex justify-center gap-3">
                            <button onClick={() => setDelConfirm(null)} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">取消</button>
                            <button onClick={() => { if (s.deleted) { dispatch({ type: 'SET_SESSIONS', payload: state.sessions.map(x => x.id === s.id ? { ...x, deleted: false } : x) }); } else { dispatch({ type: 'SET_SESSIONS', payload: state.sessions.map(x => x.id === s.id ? { ...x, deleted: true } : x) }); } setDelConfirm(null); }}
                              className={`px-4 py-2 text-sm text-white rounded-lg shadow-sm transition-colors font-medium ${s.deleted ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                              {s.deleted ? '确认还原' : '确认删除'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
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
