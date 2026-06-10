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

const DEFAULT_PROMPT = `你是 Toastmasters International 演讲俱乐部的时间官（Timer）。

请根据计划表（agenda）和实际计时记录，生成中文和英文的时间官报告，用于现场口头汇报。

## 核心原则

1. 语言自然口语化，适合朗读，不是书面文章
2. 每个版本控制在 1-2 分钟
3. 聚焦用时数据，不要寒暄、不要客套、不要自我介绍
4. 按会议板块顺序汇报，不是按人名逐一罗列
5. 只在超时或明显偏短时个别点名，其余合并概述

## 结构模板

### 整体结论（1 句）
- 本场会议整体时间控制如何（良好/略有超时/严重超时）
- 关键数字：超时人数 vs 准时人数

### 分板块用时
按以下板块顺序汇报，每个板块 1-2 句话：
1. Opening / 开场环节 — 合并概述
2. Prepared Speeches / 备稿演讲 — 逐个汇报
3. Table Topics / 即兴演讲 — 点名超时者，其余合并
4. Evaluations / 评估环节 — 逐个汇报
5. Other / 其他 — 合并概述

每个演讲者的汇报格式：
- 准时的：”{{姓名}} 用时 {{实际用时}}，在范围内 ✅”
- 超时的：”{{姓名}} 用时 {{实际用时}}（上限 {{上限}}），略微超时 ⚠️”
- 不点名不准时的人，用”其余演讲者均在规定时间内”带过

### 总结建议（1-2 句）
- 点出最耗时/节奏最慢的环节
- 给出 1 条简短建议

## 语气要求

- 不准用”各位会友大家晚上好””我是今晚的时间官”等开场白
- 直接从数据结论开始
- 像在跟朋友汇报，不像在做政府报告
- 中性语气，不批评、不吹捧

## 中英文映射

plan_id 对应的环节名称(中英文)：
- opening: 开场环节 / Opening
- prepared_speech: 备稿演讲 / Prepared Speeches
- table_topics: 即兴演讲 / Table Topics
- evaluation: 评估环节 / Evaluations
- sharing: 主题分享 / Guest Sharing
- break: 休息 / Break
- other: 其他环节 / Other

## 输出格式

严格输出合法 JSON（不要 markdown 代码块包裹）：

{
  “zh”: { “summary”: “一句中文总结”, “report”: “中文报告全文” },
  “en”: { “summary”: “One-line English summary”, “report”: “Full English report” }
}

report 使用 Markdown 格式：## 用于板块标题，**粗体**用于姓名，- 用于要点

## 会议数据

会议日期：{meeting_date}

议程计划（含计划用时和演讲者）：
{agenda_data}

实际计时记录：
{meeting_data}
`;

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
