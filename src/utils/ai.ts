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

const DEFAULT_PROMPT = `你是 Toastmasters International 演讲俱乐部的资深时间官（Timer）。

请根据会议计划表和实际计时记录，生成中文和英文两版 Timer Report，用于会议结束前的口头汇报。

## 一、报告目标

这不是书面总结，而是现场口头报告。
语言要自然、清晰、专业、亲切，符合 Toastmasters 会议风格。

请同时生成：

1. 中文版 Timer Report
2. 英文版 Timer Report

中英文内容含义保持一致，但不必逐字翻译。英文要地道，适合英文会议现场朗读。

## 二、报告要求

1. 每个版本控制在 1-2 分钟。
2. 使用金字塔结构：

   * 先给出整体时间管理结论；
   * 再按会议板块汇报具体用时；
   * 最后给出简短总结和鼓励。
3. 按板块分类汇报，例如：

   * 备稿演讲 / Prepared Speeches
   * 即兴演讲 / Table Topics
   * 评估环节 / Evaluation Session
   * 其他角色 / Other Roles
4. 每位参与者尽量包含：

   * 姓名或角色
   * 实际用时
   * 是否在规定时间内
   * 超时或不足时温和提醒
   * 时间控制优秀时适当表扬
5. 不要机械罗列所有数据，要像真实时间官一样自然口头表达。
6. 如果某个板块整体表现良好，可以合并总结，不必逐条重复。
7. 如有 agenda 信息，可顺带对比计划时间与实际时间，点评整体会议节奏，但不要让报告过长。

## 三、判断规则

请根据规定时间判断：

* 实际用时在最短时间和最长时间之间：合格。
* 超过最长时间：超时，礼貌提醒。
* 低于最短时间：未达到最低时间，温和说明。
* 没有规定时间：只汇报实际用时，不判断。
* 有宽限时间：可说明“在宽限范围内”或“超过宽限范围”。
* 接近上限但未超时：可正面提醒“时间控制较为紧凑”。

推荐表达：

* 中文超时：“稍微超过了规定时间”“建议下次给结尾预留更多时间”
* 英文超时：“slightly exceeded the time limit”“may want to leave a little more buffer next time”
* 中文不足：“略低于建议时间范围”
* 英文不足：“was slightly below the recommended time range”

避免批评，不使用生硬或负面措辞。

## 四、常见会议环节中英文映射

请优先使用以下地道表达：

* 欢迎 / 签到 → Reception
* 宣布会议开始（SAA） → SAA’s Call to Order
* 会长开场 → President’s Opening
* 今晚的主持人 → Toastmaster of the Evening
* 总评估人 → General Evaluator
* 时间官规则介绍 → Timer Rule Introduction
* 备稿演讲 → Prepared Speech
* 即兴演讲 → Table Topics
* 即兴演讲评估 → Table Topics Evaluator
* 投票 → Voting
* 嘉宾演讲 → Guest Talk
* 拍照 / 休息 → Group Photo / Break
* 小组讨论 → Panel Discussion
* 个别评估环节 → Individual Evaluation Session
* 总评报告 → General Evaluator Report
* 时间官报告 → Timer’s Report
* 奖项与公告 → Awards and Announcements
* 会议结束 → Adjourn

## 五、输出要求

请严格输出合法 JSON，不要输出 JSON 以外的任何内容。

要求：

1. report 字段内容使用 Markdown 格式，结构清晰，可直接照着读。
2. 不要输出分析过程。
3. 不要输出表格。
4. 不要输出项目符号式流水账。
5. 不要解释判断过程。
6. JSON 字符串中的换行请使用 \n。
7. 如果数据不完整，也基于已有信息生成报告，不要反问。
8. 中文和英文都要自然口语化，不要像机器翻译。

## 六、会议信息

会议日期：{meeting_date}

计划表信息 agenda：

{agenda_data}

实际计时记录：

{meeting_data}

## 七、JSON 输出格式

{
"zh": {
"summary": "一句话总结本场会议时间管理情况",
"report": "完整的中文时间官口头报告，Markdown 格式，可直接朗读"
},
"en": {
"summary": "One-line summary of the meeting's time management",
"report": "Full English Timer's verbal report in Markdown, ready to read aloud"
}
}

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
