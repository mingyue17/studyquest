import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxies to the StudyQuest AI Assistant n8n workflow. Kept server-side so
 * N8N_ASSISTANT_WEBHOOK_URL and N8N_ASSISTANT_SECRET never reach the browser.
 * If either env var is missing, returns 501 so the client falls back to the
 * local rule-based assistant in lib/assistant.ts — no crash, just less smart.
 */
export async function POST(req: NextRequest) {
  const webhookUrl = process.env.N8N_ASSISTANT_WEBHOOK_URL;
  const secret = process.env.N8N_ASSISTANT_SECRET;
  if (!webhookUrl || !secret) {
    return NextResponse.json({ error: 'not_configured' }, { status: 501 });
  }

  let body: { question?: string; context?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }
  if (!body.question || !body.context) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }

  try {
    const upstream = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-studyquest-secret': secret },
      body: JSON.stringify({ question: body.question, context: body.context }),
      signal: AbortSignal.timeout(25_000),
    });
    if (!upstream.ok) {
      console.error('StudyQuest assistant: n8n responded with', upstream.status, await upstream.text().catch(() => ''));
      return NextResponse.json({ error: 'upstream_error' }, { status: 502 });
    }

    const data = await upstream.json();
    if (typeof data?.answer !== 'string') {
      console.error('StudyQuest assistant: n8n response missing "answer"', JSON.stringify(data));
      return NextResponse.json({ error: 'no_answer' }, { status: 502 });
    }

    return NextResponse.json({ answer: data.answer });
  } catch (err) {
    console.error('StudyQuest assistant: fetch to n8n failed —', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'upstream_unreachable' }, { status: 502 });
  }
}
