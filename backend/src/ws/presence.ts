const socketsByUser = new Map<string, Set<string>>();

export function addPresence(userId: string, socketId: string): number {
  const set = socketsByUser.get(userId) ?? new Set<string>();
  set.add(socketId);
  socketsByUser.set(userId, set);
  return socketsByUser.size;
}

export function removePresence(userId: string, socketId: string): number {
  const set = socketsByUser.get(userId);
  if (!set) return socketsByUser.size;
  set.delete(socketId);
  if (set.size === 0) socketsByUser.delete(userId);
  return socketsByUser.size;
}

export function onlineCount(): number {
  return socketsByUser.size;
}

export function onlineUserIds(): string[] {
  return [...socketsByUser.keys()];
}
