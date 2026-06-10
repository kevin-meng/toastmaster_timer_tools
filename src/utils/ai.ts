import type { Session, TimingCombination } from '../types';

// localStorage 键名
const STORAGE_KEYS = {
  API_KEY: 'toastmaster_ai_api_key',
  PROMPT: 'toastmaster_ai_prompt',
  REPORTS: 'toastmaster_ai_reports',
};

// ============================================================
// 默认提示词（返回 JSON 格式，中英文同时输出）
// ============================================================

const DEFAULT_PROMPT = `你是一位专业的 Toastmasters International 演讲俱乐部时间官（Timer）。

请根据以下会议计时记录，生成时间官报告。你必须严格按照 JSON 格式输出。

## 报告要求

1. 每份报告时长控制在 1-2 分钟口头汇报
2. 使用金字塔结构：整体结论 → 分模块汇报 → 总结鼓励
3. 按照会议角色分类：备稿演讲、即兴演讲、评估环节、其他角色
4. 对每位参与者：姓名、实际用时、是否合格、超时则温和提醒、优秀则表扬
5. 如果某部分所有人准时，可合并总结
6. 超时请使用礼貌表达，不批评、不生硬
7. 不要机械罗列数据，像真实时间官一样口头表达

## 会议信息

会议日期：{meeting_date}

{meeting_data}

## 输出格式

你必须只输出一个 JSON 对象，不要包含 markdown 代码块标记，不要有任何其他文字：

{
  "zh": {
    "summary": "一句话总结本场会议时间管理情况（中文）",
    "report": "完整的中文时间官口头报告，可以照着读"
  },
  "en": {
    "summary": "One-line summary of the meeting's time management (English)",
    "report": "Full English Timer's verbal report, ready to read aloud"
  }
}`;

// ============================================================
// 格式工具函数
// ============================================================

function formatTime(date: Date): string {
  return date.toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function fmtDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}'${String(secs).padStart(2, '0')}"`;
}

// ============================================================
// API Key 管理
// ============================================================

export function getApiKey(): string {
  try { return localStorage.getItem(STORAGE_KEYS.API_KEY) || ''; } catch { return ''; }
}

export function saveApiKey(key: string): void {
  try { localStorage.setItem(STORAGE_KEYS.API_KEY, key); } catch (e) { console.error('Failed to save API key:', e); }
}

export function clearApiKey(): void {
  try { localStorage.removeItem(STORAGE_KEYS.API_KEY); } catch (e) { console.error('Failed to clear API key:', e); }
}

// ============================================================
// 提示词模板管理
// ============================================================

export function getPromptTemplate(): string {
  try { return localStorage.getItem(STORAGE_KEYS.PROMPT) || DEFAULT_PROMPT; } catch { return DEFAULT_PROMPT; }
}

export function savePromptTemplate(template: string): void {
  try { localStorage.setItem(STORAGE_KEYS.PROMPT, template); } catch (e) { console.error('Failed to save prompt template:', e); }
}

export function resetPromptTemplate(): string {
  savePromptTemplate(DEFAULT_PROMPT);
  return DEFAULT_PROMPT;
}

// ============================================================
// 会议数据格式化为结构化 JSON（供 LLM 使用）
// ============================================================

export function formatMeetingData(
  sessions: Session[],
  getCombination: (id: string) => TimingCombination | undefined
): string {
  if (sessions.length === 0) return '[]';

  const items = sessions.map((session, i) => {
    const c = getCombination(session.combinationId);
    const expected = c ? c.segments.reduce((sum, s) => sum + s.duration, 0) : 0;
    const actual = session.duration ||
      (session.endTime
        ? Math.floor((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000)
        : 0);
    const overtime = actual - expected;
    return {
      index: i + 1,
      name: session.name,
      role: session.notes || '',
      rule: c ? c.name : '未知',
      segments: c ? c.segments.map(s => ({ name: s.name, duration: s.duration })) : [],
      expected_seconds: expected,
      actual_seconds: actual,
      overtime_seconds: overtime > 0 ? overtime : 0,
      status: overtime > 60 ? '严重超时' : overtime > 0 ? '轻微超时' : overtime === 0 ? '恰好完成' : '未用满时间',
      start_time: formatTime(new Date(session.startTime)),
      end_time: session.endTime ? formatTime(new Date(session.endTime)) : '未结束',
    };
  });

  // 统计
  const totalActual = items.reduce((s, i) => s + i.actual_seconds, 0);
  const totalExpected = items.reduce((s, i) => s + i.expected_seconds, 0);
  const onTime = items.filter(i => i.overtime_seconds <= 0).length;
  const overtimeCount = items.filter(i => i.overtime_seconds > 0).length;
  const severeOvertime = items.filter(i => i.overtime_seconds > 60).length;

  return JSON.stringify({
    items,
    stats: {
      total_speakers: items.length,
      on_time_count: onTime,
      overtime_count: overtimeCount,
      severe_overtime_count: severeOvertime,
      total_actual_seconds: totalActual,
      total_expected_seconds: totalExpected,
    },
  }, null, 2);
}

// ============================================================
// 报告数据结构
// ============================================================

export interface AIReport {
  zh: { summary: string; report: string };
  en: { summary: string; report: string };
}

export interface SavedReport {
  id: string;
  date: string;
  type: 'ai' | 'manual';
  report: AIReport;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// 报告存储
// ============================================================

export function getReports(): SavedReport[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.REPORTS) || '[]'); } catch { return []; }
}

export function saveReport(report: SavedReport): void {
  const reports = getReports().filter(r => r.id !== report.id);
  reports.push(report);
  localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
}

export function deleteReport(id: string): void {
  const reports = getReports().filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
}

// ============================================================
// 解析 AI 返回的 JSON
// ============================================================

export function parseAIResponse(text: string): AIReport {
  // 尝试去掉 markdown 代码块标记
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\w*\n?/, '').replace(/\n?```$/, '');
  }
  const parsed = JSON.parse(cleaned);
  if (!parsed.zh?.report || !parsed.en?.report) {
    throw new Error('AI 返回格式不完整，缺少中文或英文报告');
  }
  return {
    zh: { summary: parsed.zh.summary || '', report: parsed.zh.report },
    en: { summary: parsed.en.summary || '', report: parsed.en.report },
  };
}

// ============================================================
// DeepSeek API 调用
// ============================================================

export async function callDeepSeekAPI(apiKey: string, userPrompt: string): Promise<string> {
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'deepseek-v4-pro',
      messages: [
        { role: 'system', content: '你是一个精准的 JSON 输出引擎。只输出要求的 JSON，不输出其他内容。' },
        { role: 'user', content: userPrompt },
      ],
      stream: false,
      reasoning_effort: 'high',
      thinking: { type: 'enabled' },
    }),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => 'Unknown error');
    throw new Error(`DeepSeek API error (${response.status}): ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('API 返回为空');
  return content;
}
