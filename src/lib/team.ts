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

/**
 * Rule-based response to a student venting about a teammate. Reads the actual
 * board state so the suggestion is grounded, not generic — same "mocked but
 * structured for a real model later" pattern as the main AI Assistant.
 */
export function suggestTeammateAdvice(
  complaint: string,
  teamTasks: TeamTask[],
  teamMembers: TeamMember[],
): TeamAdvice {
  const text = complaint.toLowerCase();
  const blocked = teamTasks.filter((t) => t.blocker && t.status !== 'Merged');
  const openByMember = new Map<string, number>();
  teamTasks.filter((t) => t.status !== 'Merged' && t.assignedUserId)
    .forEach((t) => openByMember.set(t.assignedUserId as string, (openByMember.get(t.assignedUserId as string) ?? 0) + 1));

  const busiest = [...openByMember.entries()].sort((a, b) => b[1] - a[1])[0];
  const busiestName = busiest ? teamMembers.find((m) => m.teamMemberId === busiest[0])?.displayName : null;

  if (text.includes('not doing') || text.includes('lazy') || text.includes('nothing') || text.includes('not contribut')) {
    return {
      tone: 'actionable',
      text: `Before assuming it's effort, check the board: ${busiestName ? `${busiestName} is currently carrying the most open tasks` : 'workload looks roughly even right now'}. Try assigning one small, clearly-owned task with a real deadline instead of a general ask — it's easier to follow up on "finish the login form by Friday" than "help out more".`,
    };
  }
  if (text.includes('deadline') || text.includes('late') || text.includes('missed')) {
    return {
      tone: 'actionable',
      text: blocked.length > 0
        ? `"${blocked[0].title}" is stuck with a noted blocker — that's often the real cause of a missed deadline, not a person. Clear that blocker first, then set a check-in 48 hours before the next due date.`
        : 'Set a shared check-in the day before each deadline — a quick "where are you at" message surfaces problems before they become a missed date.',
    };
  }
  if (text.includes('communicat') || text.includes('respond') || text.includes('reply') || text.includes('ignor')) {
    return {
      tone: 'supportive',
      text: 'Slow replies are usually a channel problem more than a caring problem. Move the ask into the shared Teams channel with a specific question and a date, so it is visible to the whole group rather than easy to miss in a DM.',
    };
  }
  if (text.includes('conflict') || text.includes('argu') || text.includes('fight') || text.includes('disagree')) {
    return {
      tone: 'supportive',
      text: 'Disagreements about direction are normal in a team project. Bring it back to the task board in your next sync — deciding "what does Done look like for this card" is usually easier than resolving it as a personal disagreement.',
    };
  }
  return {
    tone: 'supportive',
    text: `Every team hits friction mid-project — it does not mean the team is failing. Naming the specific task that's stuck (rather than the person) usually makes the next conversation easier.${
      blocked.length > 0 ? ` Right now "${blocked[0].title}" is the one actually blocked.` : ''
    }`,
  };
}
