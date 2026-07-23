'use client';

import { useMemo } from 'react';
import { PixelPanel } from '@/components/ui/PixelPanel';
import { useStore } from '@/store/useStore';
import {
  calculateCgpa, requiredSemesterGpa, projectCgpa, explainRequirement, GRADE_OPTIONS,
} from '@/lib/gpa';

export default function GpaGoalPage() {
  const { modules, grades, targetCgpa } = useStore();
  const setModuleGrade = useStore((s) => s.setModuleGrade);
  const setTargetCgpa = useStore((s) => s.setTargetCgpa);

  const currentCgpa = useMemo(
    () => calculateCgpa(grades.map((g) => ({ grade: g.grade, academicUnits: g.academicUnits }))),
    [grades]);

  const requirement = useMemo(
    () => requiredSemesterGpa({ pastGrades: grades, currentModules: modules, targetCgpa }),
    [grades, modules, targetCgpa]);

  const bestCase = useMemo(
    () => projectCgpa({ pastGrades: grades, currentModules: modules, assumeGrade: 'A+' }),
    [grades, modules]);
  const worstCase = useMemo(
    () => projectCgpa({ pastGrades: grades, currentModules: modules, assumeGrade: 'D' }),
    [grades, modules]);

  const totalUnits = grades.reduce((s, g) => s + g.academicUnits, 0) + modules.reduce((s, m) => s + m.academicUnits, 0);

  // Gauge: semicircle from 0 to 5.0
  const gaugePercent = Math.min(100, (currentCgpa / 5) * 100);
  const gaugeAngle = (gaugePercent / 100) * 180;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="pixel-heading text-base text-neon-green sm:text-lg">GPA Goal</h1>
        <p className="mt-2 text-sm text-slate-400">Weighted by academic units, recalculated the moment a grade changes.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <PixelPanel title="Current CGPA" accent="cyan" className="lg:col-span-1">
          <div className="flex flex-col items-center">
            <svg viewBox="0 0 200 110" className="w-full max-w-[220px]">
              <path d="M 10 100 A 90 90 0 0 1 190 100" fill="none" stroke="#1b2560" strokeWidth="16" strokeLinecap="round" />
              <path
                d="M 10 100 A 90 90 0 0 1 190 100"
                fill="none" stroke="#22e0ff" strokeWidth="16" strokeLinecap="round"
                strokeDasharray={`${(gaugeAngle / 180) * 283} 283`}
              />
              <text x="100" y="90" textAnchor="middle" className="fill-slate-100" style={{ font: '700 28px var(--font-pixel)' }}>
                {currentCgpa.toFixed(2)}
              </text>
            </svg>
            <p className="mt-1 text-xs text-slate-500">out of 5.00 · {totalUnits} AU total</p>
          </div>
        </PixelPanel>

        <PixelPanel title="Target CGPA" accent="pink" className="lg:col-span-2">
          <div className="flex flex-col justify-center gap-4">
            <div className="flex items-baseline justify-between">
              <span className="font-pixel text-2xl text-neon-pink">{targetCgpa.toFixed(2)}</span>
              <span className="text-xs text-slate-500">Slide to set your target</span>
            </div>
            <input
              type="range" min={2} max={5} step={0.05} value={targetCgpa}
              onChange={(e) => setTargetCgpa(Number(e.target.value))}
              className="w-full accent-[#ff4fd8]"
              aria-label="Target CGPA"
            />
            <div className="border-2 border-navy-700 bg-navy-950 p-4">
              <p className="text-sm text-slate-200">
                {explainRequirement(requirement.required, requirement.achievable, requirement.alreadyThere)}
              </p>
              {!requirement.alreadyThere && (
                <p className="mt-2 font-pixel text-[10px] text-neon-yellow">
                  Required this semester: {requirement.required.toFixed(2)} GPA
                </p>
              )}
            </div>
          </div>
        </PixelPanel>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <PixelPanel title="Best case" accent="green">
          <p className="font-pixel text-2xl text-neon-green">{bestCase.toFixed(2)}</p>
          <p className="mt-2 text-xs text-slate-400">If every current module lands an A+.</p>
        </PixelPanel>
        <PixelPanel title="Worst case" accent="plain">
          <p className="font-pixel text-2xl text-slate-400">{worstCase.toFixed(2)}</p>
          <p className="mt-2 text-xs text-slate-400">If every current module lands a D.</p>
        </PixelPanel>
      </div>

      <PixelPanel title="Current semester modules" accent="cyan">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-navy-700 text-left font-pixel text-[8px] uppercase text-slate-500">
                <th className="py-2 pr-3">Module</th>
                <th className="py-2 pr-3">Academic units</th>
                <th className="py-2 pr-3">Grade</th>
              </tr>
            </thead>
            <tbody>
              {modules.map((m) => (
                <tr key={m.moduleId} className="border-b border-navy-800">
                  <td className="py-2.5 pr-3">
                    <p className="text-slate-200">{m.moduleCode}</p>
                    <p className="text-[11px] text-slate-500">{m.moduleName}</p>
                  </td>
                  <td className="py-2.5 pr-3 text-slate-300">{m.academicUnits}</td>
                  <td className="py-2.5 pr-3">
                    <select
                      value={m.currentGrade ?? ''}
                      onChange={(e) => setModuleGrade(m.moduleId, e.target.value)}
                      className="focus-ring border-2 border-navy-600 bg-navy-950 px-2 py-1.5 text-sm text-slate-200"
                    >
                      <option value="">Not graded</option>
                      {GRADE_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PixelPanel>

      <PixelPanel title="Past grades" accent="plain">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-navy-700 text-left font-pixel text-[8px] uppercase text-slate-500">
                <th className="py-2 pr-3">Module</th>
                <th className="py-2 pr-3">Semester</th>
                <th className="py-2 pr-3">Academic units</th>
                <th className="py-2 pr-3">Grade</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((g) => (
                <tr key={g.gradeId} className="border-b border-navy-800">
                  <td className="py-2.5 pr-3 text-slate-200">{g.moduleCode}</td>
                  <td className="py-2.5 pr-3 text-slate-400">{g.semester}</td>
                  <td className="py-2.5 pr-3 text-slate-300">{g.academicUnits}</td>
                  <td className="py-2.5 pr-3 font-pixel text-[10px] text-neon-cyan">{g.grade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PixelPanel>
    </div>
  );
}
