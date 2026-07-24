'use client';

import { useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { PixelPanel } from '@/components/ui/PixelPanel';
import { PixelButton } from '@/components/ui/PixelButton';
import { useStore } from '@/store/useStore';
import { generateAiSummary, currentWeekStart } from '@/lib/reflection';
import type { Reflection } from '@/types';

const STRESS_LABELS = ['Very calm', 'Calm', 'Steady', 'Stressed', 'Overwhelmed'];

export default function ReflectionPage() {
  const { reflections, tasks, sessions, modules } = useStore();
  const saveReflection = useStore((s) => s.saveReflection);

  const weekStart = currentWeekStart();
  const existing = reflections.find((r) => r.weekStart === weekStart);

  const [completedTasks, setCompletedTasks] = useState(existing?.completedTasks ?? '');
  const [delays, setDelays] = useState(existing?.delays ?? '');
  const [focusModule, setFocusModule] = useState(existing?.focusModule ?? modules[0]?.moduleCode ?? '');
  const [stressLevel, setStressLevel] = useState(existing?.stressLevel ?? 3);
  const [nextWeekChange, setNextWeekChange] = useState(existing?.nextWeekChange ?? '');
  const [submitted, setSubmitted] = useState(Boolean(existing?.aiSummary));

  const summary = useMemo(() => {
    if (!submitted) return existing?.aiSummary ?? null;
    return generateAiSummary({ completedTasks, delays, focusModule, stressLevel, tasks, sessions });
  }, [submitted, completedTasks, delays, focusModule, stressLevel, tasks, sessions, existing]);

  const handleSubmit = () => {
    const reflection: Reflection = {
      reflectionId: existing?.reflectionId ?? crypto.randomUUID(),
      userId: tasks[0]?.userId ?? '',
      weekStart,
      completedTasks,
      delays,
      focusModule,
      stressLevel,
      nextWeekChange,
      aiSummary: generateAiSummary({ completedTasks, delays, focusModule, stressLevel, tasks, sessions }),
    };
    saveReflection(reflection);
    setSubmitted(true);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="pixel-heading text-base text-neon-green sm:text-lg">Weekly reflection</h1>
        <p className="mt-2 text-sm text-slate-400">Week of {new Date(weekStart).toLocaleDateString('en-SG', { day: 'numeric', month: 'long' })}.</p>
      </header>

      <PixelPanel title="This week's diary" accent="cyan">
        <div className="space-y-5">
          <Field label="What did you complete?" value={completedTasks} onChange={setCompletedTasks} />
          <Field label="What caused delays?" value={delays} onChange={setDelays} />

          <label className="block">
            <span className="mb-1.5 block font-pixel text-[8px] uppercase text-slate-500">Which module needs more attention?</span>
            <select
              value={focusModule}
              onChange={(e) => setFocusModule(e.target.value)}
              className="focus-ring w-full border-2 border-navy-600 bg-navy-950 px-3 py-2 text-sm text-slate-200"
            >
              {modules.map((m) => <option key={m.moduleId} value={m.moduleCode}>{m.moduleCode} — {m.moduleName}</option>)}
            </select>
          </label>

          <div>
            <span className="mb-1.5 block font-pixel text-[8px] uppercase text-slate-500">
              How stressed do you feel? — {STRESS_LABELS[stressLevel - 1]}
            </span>
            <input
              type="range" min={1} max={5} step={1} value={stressLevel}
              onChange={(e) => setStressLevel(Number(e.target.value))}
              className="w-full accent-[#ffd23f]"
              aria-label="Stress level"
            />
          </div>

          <Field label="What should change next week?" value={nextWeekChange} onChange={setNextWeekChange} />

          <PixelButton tone="green" onClick={handleSubmit}>
            {existing ? 'Update reflection' : 'Submit reflection'} · +30 XP
          </PixelButton>
        </div>
      </PixelPanel>

      {summary && (
        <PixelPanel title="AI summary" accent="pink">
          <div className="mb-4 flex items-center gap-2 text-neon-pink">
            <Sparkles className="h-4 w-4" aria-hidden />
            <p className="font-pixel text-[9px]">Generated from this week's data</p>
          </div>
          <dl className="space-y-4">
            <SummaryRow label="Main achievement" value={summary.mainAchievement} />
            <SummaryRow label="Main problem" value={summary.mainProblem} />
            <SummaryRow label="Study pattern" value={summary.studyPattern} />
            <SummaryRow label="Suggested improvement" value={summary.suggestedImprovement} />
            <SummaryRow label="Recommended focus module" value={summary.recommendedFocusModule} />
          </dl>
        </PixelPanel>
      )}

      {reflections.length > 1 && (
        <PixelPanel title="Past reflections" accent="plain">
          <ul className="divide-y-2 divide-navy-800">
            {reflections.filter((r) => r.weekStart !== weekStart).map((r) => (
              <li key={r.reflectionId} className="py-3">
                <p className="font-pixel text-[9px] text-slate-400">
                  Week of {new Date(r.weekStart).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })}
                </p>
                <p className="mt-1.5 text-xs text-slate-400">{r.aiSummary?.mainAchievement}</p>
              </li>
            ))}
          </ul>
        </PixelPanel>
      )}
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-pixel text-[8px] uppercase text-slate-500">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="focus-ring w-full resize-y border-2 border-navy-600 bg-navy-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600"
        placeholder="Type your answer..."
      />
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-pixel text-[8px] uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-200">{value}</dd>
    </div>
  );
}
