'use client';
import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Square, SkipForward, Clock } from 'lucide-react';
import { PixelPanel } from '@/components/ui/PixelPanel';
import { PixelButton } from '@/components/ui/PixelButton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useStore } from '@/store/useStore';
import type { Task } from '@/types';

interface Preset {
  label: string;
  studySeconds: number;
  breakSeconds: number;
  /** Total run time before the whole session auto-ends. Only "Mock" uses this — real presets run until you hit Stop. */
  totalCapSeconds: number | null;
  description: string;
}

const PRESETS: Record<string, Preset> = {
  focus: { label: 'Focus (25/5)', studySeconds: 25 * 60, breakSeconds: 5 * 60, totalCapSeconds: null, description: '25 min study, 5 min break, repeats until you stop.' },
  deep: { label: 'Deep work (50/10)', studySeconds: 50 * 60, breakSeconds: 10 * 60, totalCapSeconds: null, description: '50 min study, 10 min break, repeats until you stop.' },
  mock: { label: 'Mock (demo)', studySeconds: 30, breakSeconds: 30, totalCapSeconds: 3 * 60, description: '30s study → 30s break, ends after 3 min total. For showing the break cycle without waiting a real session out.' },
};

type Phase = 'idle' | 'study' | 'break' | 'done';

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export function StudyTimer({ tasks }: { tasks: Task[] }) {
  const logStudyBlock = useStore((s) => s.logStudyBlock);
  const pushToast = useStore((s) => s.pushToast);

  const [presetKey, setPresetKey] = useState<keyof typeof PRESETS>('focus');
  const [taskId, setTaskId] = useState<string>('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [secondsLeft, setSecondsLeft] = useState(PRESETS.focus.studySeconds);
  const [running, setRunning] = useState(false);

  const studySecondsBanked = useRef(0);
  const totalElapsed = useRef(0);
  const preset = PRESETS[presetKey];

  const openTasks = tasks.filter((t) => t.status !== 'Submitted' && !t.parentTaskId);

  const finish = (announce: boolean) => {
    const minutes = Math.round((studySecondsBanked.current / 60) * 10) / 10;
    if (minutes > 0) logStudyBlock(minutes, taskId || undefined);
    if (announce) pushToast('Session complete', `Logged ${minutes < 1 ? '<1' : minutes} min of study time.`, 'xp');
    studySecondsBanked.current = 0;
    totalElapsed.current = 0;
    setPhase('idle');
    setRunning(false);
    setSecondsLeft(preset.studySeconds);
  };

  useEffect(() => {
    if (!running || phase === 'idle' || phase === 'done') return;
    const id = setInterval(() => {
      totalElapsed.current += 1;
      if (phase === 'study') studySecondsBanked.current += 1;
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [running, phase]);

  // Reacts to the countdown hitting zero — kept separate from the tick above so
  // the interval callback stays a pure decrement (side effects don't belong inside a setState updater).
  useEffect(() => {
    if (!running || phase === 'idle' || phase === 'done' || secondsLeft !== 0) return;

    const capHit = preset.totalCapSeconds !== null && totalElapsed.current >= preset.totalCapSeconds;
    if (capHit) { finish(true); return; }

    if (phase === 'study') {
      const breakMins = Math.round(preset.breakSeconds / 60);
      pushToast('Break time', breakMins > 0 ? `${breakMins} min to step away from the screen.` : `${preset.breakSeconds}s to step away from the screen.`, 'level');
      setPhase('break');
      setSecondsLeft(preset.breakSeconds);
    } else {
      pushToast('Back to it', "Break's over — next study block starting.", 'xp');
      setPhase('study');
      setSecondsLeft(preset.studySeconds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, running, phase]);

  const start = () => {
    studySecondsBanked.current = 0;
    totalElapsed.current = 0;
    setSecondsLeft(preset.studySeconds);
    setPhase('study');
    setRunning(true);
  };

  const phaseLabel = phase === 'study' ? 'Studying' : phase === 'break' ? 'On a break' : 'Ready';
  const phaseTone = phase === 'break' ? 'yellow' : 'cyan';
  const totalPhaseSeconds = phase === 'break' ? preset.breakSeconds : preset.studySeconds;
  const percentLeft = phase === 'idle' ? 100 : Math.round((secondsLeft / totalPhaseSeconds) * 100);

  return (
    <PixelPanel title="Study timer" accent={phaseTone}>
      <div className="grid gap-5 md:grid-cols-[1fr_auto]">
        <div>
          {phase === 'idle' ? (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block font-pixel text-[8px] uppercase text-slate-500">Mode</span>
                  <select
                    value={presetKey}
                    onChange={(e) => { const k = e.target.value as keyof typeof PRESETS; setPresetKey(k); setSecondsLeft(PRESETS[k].studySeconds); }}
                    className="focus-ring w-full border-2 border-navy-600 bg-navy-950 px-3 py-2 text-sm text-slate-200"
                  >
                    {Object.entries(PRESETS).map(([key, p]) => <option key={key} value={key}>{p.label}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block font-pixel text-[8px] uppercase text-slate-500">Quest (optional)</span>
                  <select
                    value={taskId}
                    onChange={(e) => setTaskId(e.target.value)}
                    className="focus-ring w-full border-2 border-navy-600 bg-navy-950 px-3 py-2 text-sm text-slate-200"
                  >
                    <option value="">No quest — just studying</option>
                    {openTasks.map((t) => <option key={t.taskId} value={t.taskId}>{t.title}</option>)}
                  </select>
                </label>
              </div>
              <p className="text-[11px] text-slate-500">{preset.description}</p>
              <PixelButton tone="cyan" onClick={start}>
                <Play className="mr-1.5 inline h-3 w-3" aria-hidden />Start timer
              </PixelButton>
            </div>
          ) : (
            <div className="space-y-3">
              <p className={`font-pixel text-[10px] ${phase === 'break' ? 'text-neon-yellow' : 'text-neon-cyan'}`}>
                {phaseLabel.toUpperCase()} · {preset.label}
              </p>
              <p className="font-pixel text-3xl text-slate-100">{fmt(secondsLeft)}</p>
              <ProgressBar value={percentLeft} tone={phase === 'break' ? 'yellow' : 'cyan'} showValue={false} />
              <p className="text-[11px] text-slate-500">
                Banked so far: {Math.round((studySecondsBanked.current / 60) * 10) / 10} min study time
              </p>
              <div className="flex flex-wrap gap-2">
                <PixelButton tone="cyan" onClick={() => setRunning((r) => !r)}>
                  {running
                    ? <><Pause className="mr-1.5 inline h-3 w-3" aria-hidden />Pause</>
                    : <><Play className="mr-1.5 inline h-3 w-3" aria-hidden />Resume</>}
                </PixelButton>
                {phase === 'break' && (
                  <PixelButton tone="ghost" onClick={() => { setPhase('study'); setSecondsLeft(preset.studySeconds); }}>
                    <SkipForward className="mr-1.5 inline h-3 w-3" aria-hidden />Skip break
                  </PixelButton>
                )}
                <PixelButton tone="ghost" onClick={() => finish(true)}>
                  <Square className="mr-1.5 inline h-3 w-3" aria-hidden />Stop & log
                </PixelButton>
              </div>
            </div>
          )}
        </div>
        <div className="hidden items-center justify-center border-l-2 border-navy-700 pl-5 md:flex">
          <Clock className={`h-10 w-10 ${phase === 'break' ? 'text-neon-yellow' : 'text-neon-cyan'}`} aria-hidden />
        </div>
      </div>
    </PixelPanel>
  );
}
