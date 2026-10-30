import type { Profile } from '@/types';

export function dmTitle(members: Profile[], myId: string): string {
  if (members.length === 0) return 'Direct Message';
  const isMember = members.some((m) => m.id === myId);
  if (isMember) {
    const other = members.find((m) => m.id !== myId);
    return other?.display_name || 'Student';
  }
  return members.map((m) => m.display_name || 'Student').join(' \u2194 ');
}

export function dmOtherMember(members: Profile[], myId: string): Profile | null {
  return members.find((m) => m.id !== myId) ?? null;
}
