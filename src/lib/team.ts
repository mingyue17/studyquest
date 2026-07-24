import type { TeamMember, TeamTask } from '@/types';

/** Deterministic accent colour so the same name always gets the same avatar. */
const AVATAR_COLORS = ['#39ff6a', '#22e0ff', '#ff4fd8', '#ffd23f', '#ff5470', '#8b7bff'];

export function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) % 997;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function initialsForName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
}

export interface TeamAdvice { text: string; tone: 'supportive' | 'actionable' }

/** Small deterministic hash so the same complaint always gets the same fallback phrasing (not random every click). */
function hashText(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) % 9973;
  return h;
}

/**
 * Rule-based response to a student venting about a teammate. Reads the actual
 * board state so the suggestion is grounded, not generic — same "mocked but
 * structured for a real model later" pattern as the main AI Assistant.
 *
 * Keyword coverage is intentionally broad (see each `some(...)` list) — a
 * narrow keyword list means most real complaints fall through to the fallback
 * and, since board state rarely changes between two clicks, that produced the
 * exact same message every time. The fallback below now also rotates and
 * pulls a different piece of board context, so a miss still doesn't repeat.
 */
export function suggestTeammateAdvice(
  complaint: string,
  teamTasks: TeamTask[],
  teamMembers: TeamMember[],
): TeamAdvice {
  const text = complaint.toLowerCase();
  const has = (...words: string[]) => words.some((w) => text.includes(w));

  const blocked = teamTasks.filter((t) => t.blocker && t.status !== 'Merged');
  const backlog = teamTasks.filter((t) => t.status === 'Backlog');
  const inReview = teamTasks.filter((t) => t.status === 'Review');
  const openByMember = new Map<string, number>();
  teamTasks.filter((t) => t.status !== 'Merged' && t.assignedUserId)
    .forEach((t) => openByMember.set(t.assignedUserId as string, (openByMember.get(t.assignedUserId as string) ?? 0) + 1));

  const busiest = [...openByMember.entries()].sort((a, b) => b[1] - a[1])[0];
  const busiestName = busiest ? teamMembers.find((m) => m.teamMemberId === busiest[0])?.displayName : null;
  const unassignedCount = teamTasks.filter((t) => t.status !== 'Merged' && !t.assignedUserId).length;

  if (has('not doing', 'lazy', 'nothing', 'not contribut', 'slacking', 'not helping', "doesn't do", 'does not do', 'not pulling')) {
    return {
      tone: 'actionable',
      text: `Before assuming it's effort, check the board: ${busiestName ? `${busiestName} is currently carrying the most open tasks` : 'workload looks roughly even right now'}. Try assigning one small, clearly-owned task with a real deadline instead of a general ask — it's easier to follow up on "finish the login form by Friday" than "help out more".`,
    };
  }
  if (has('deadline', 'late', 'missed', 'behind', 'running out of time', 'overdue')) {
    return {
      tone: 'actionable',
      text: blocked.length > 0
        ? `"${blocked[0].title}" is stuck with a noted blocker — that's often the real cause of a missed deadline, not a person. Clear that blocker first, then set a check-in 48 hours before the next due date.`
        : 'Set a shared check-in the day before each deadline — a quick "where are you at" message surfaces problems before they become a missed date.',
    };
  }
  if (has('communicat', 'respond', 'reply', 'ignor', 'silent', 'ghosting', 'ghosted', "won't answer", 'not answering', 'no response')) {
    return {
      tone: 'supportive',
      text: 'Slow replies are usually a channel problem more than a caring problem. Move the ask into the shared Teams channel with a specific question and a date, so it is visible to the whole group rather than easy to miss in a DM.',
    };
  }
  if (has('conflict', 'argu', 'fight', 'disagree', 'tension', 'annoyed', 'annoying', 'frustrat', 'irritat', 'clash')) {
    return {
      tone: 'supportive',
      text: 'Disagreements about direction are normal in a team project. Bring it back to the task board in your next sync — deciding "what does Done look like for this card" is usually easier than resolving it as a personal disagreement.',
    };
  }
  if (has('overwhelm', 'too much', 'burnt out', 'burned out', 'exhaust', 'stress', 'carrying', 'doing everything', 'doing all')) {
    return {
      tone: 'actionable',
      text: unassignedCount > 0
        ? `There ${unassignedCount === 1 ? 'is' : 'are'} ${unassignedCount} unassigned open task${unassignedCount === 1 ? '' : 's'} on the board — claim-and-assign those out loud in your next sync so the load is visible, not just felt.`
        : `${busiestName ? `${busiestName} is currently the most loaded member` : 'One person is carrying more than the rest'} — say so directly in your next sync and move a task off before it becomes a deadline problem.`,
    };
  }
  if (has('confus', 'unclear', "don't know who", 'not sure who', 'roles', 'whose job', 'who is doing')) {
    return {
      tone: 'actionable',
      text: unassignedCount > 0
        ? `${unassignedCount} task${unassignedCount === 1 ? ' is' : 's are'} sitting without an owner right now — that's usually the actual source of "who's doing what" confusion. Assign names to those first.`
        : 'Every card already has an owner, so the confusion is likely about scope, not ownership — pin down exactly what "done" looks like for the task in question.',
    };
  }

  // No keyword matched. Rotate between a few honest, board-grounded fallbacks
  // instead of one fixed sentence, so repeated misses don't read as broken.
  const fallbacks: string[] = [
    `Every team hits friction mid-project — it doesn't mean the team is failing. Naming the specific task that's stuck (rather than the person) usually makes the next conversation easier.${blocked.length > 0 ? ` Right now "${blocked[0].title}" is the one actually blocked.` : ''}`,
    inReview.length > 0
      ? `"${inReview[0].title}" has been sitting in Review — a stalled review is a common, low-drama reason things feel stuck. Worth a nudge before assuming it's about effort.`
      : `Try turning the frustration into one specific, assignable task on the board — vague tension is hard to act on, a named card with an owner isn't.`,
    backlog.length > 0
      ? `There ${backlog.length === 1 ? 'is' : 'are'} still ${backlog.length} task${backlog.length === 1 ? '' : 's'} in Backlog — worth checking in your next sync whether that's a workload issue or a clarity issue before it turns into a bigger one.`
      : `Backlog's actually clear right now, so if something still feels off it's probably about communication or pace rather than missing work — worth naming that directly in your next sync.`,
  ];
  return { tone: 'supportive', text: fallbacks[hashText(text) % fallbacks.length] };
}
