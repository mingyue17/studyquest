'use client';

import { useEffect, useRef, useState } from 'react';
import { Bot, Send, User } from 'lucide-react';
import { PixelPanel } from '@/components/ui/PixelPanel';
import { PixelButton } from '@/components/ui/PixelButton';
import { useStore } from '@/store/useStore';
import { answerQuestion, SUGGESTED_PROMPTS } from '@/lib/assistant';

interface ChatMessage { id: string; role: 'user' | 'assistant'; text: string }

export default function AssistantPage() {
  const { tasks, modules, grades, teamTasks, targetCgpa } = useStore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'assistant', text: "Hi Ming — ask me about tonight's study plan, deadline clashes, your GPA target, or what's blocking the team." },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  const send = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', text };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setThinking(true);

    const reply = await answerQuestion(text, { tasks, modules, grades, teamTasks, targetCgpa });
    setThinking(false);
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: 'assistant', text: reply.text }]);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="pixel-heading text-base text-neon-green sm:text-lg">AI Assistant</h1>
        <p className="mt-2 text-sm text-slate-400">Answers pulled from your own quests, planner and grades — nothing invented.</p>
      </header>

      <PixelPanel accent="cyan" className="flex flex-col">
        <div ref={scrollRef} className="max-h-[50vh] min-h-[320px] space-y-4 overflow-y-auto pr-1">
          {messages.map((m) => (
            <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center border-2 ${
                m.role === 'user' ? 'border-neon-pink text-neon-pink' : 'border-neon-cyan text-neon-cyan'
              }`}>
                {m.role === 'user' ? <User className="h-4 w-4" aria-hidden /> : <Bot className="h-4 w-4" aria-hidden />}
              </span>
              <div className={`max-w-[80%] border-2 p-3 text-sm ${
                m.role === 'user'
                  ? 'border-neon-pink/50 bg-neon-pink/10 text-slate-100'
                  : 'border-navy-600 bg-navy-950 text-slate-200'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {thinking && (
            <div className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-neon-cyan text-neon-cyan">
                <Bot className="h-4 w-4" aria-hidden />
              </span>
              <div className="border-2 border-navy-600 bg-navy-950 p-3 text-sm text-slate-500">Thinking…</div>
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="mt-4 flex gap-2 border-t-2 border-navy-700 pt-4"
        >
          <label className="sr-only" htmlFor="assistant-input">Ask the assistant</label>
          <input
            id="assistant-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about deadlines, GPA, or the team board..."
            className="focus-ring flex-1 border-2 border-navy-600 bg-navy-950 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600"
          />
          <PixelButton tone="cyan" type="submit" disabled={!input.trim()}>
            <Send className="h-4 w-4" aria-hidden />
          </PixelButton>
        </form>
      </PixelPanel>

      <PixelPanel title="Suggested prompts" accent="plain">
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => send(prompt)}
              className="focus-ring border-2 border-navy-600 bg-navy-950 px-3 py-2 text-xs text-slate-300 hover:border-neon-cyan/60 hover:text-neon-cyan"
            >
              {prompt}
            </button>
          ))}
        </div>
      </PixelPanel>
    </div>
  );
}
