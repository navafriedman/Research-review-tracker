import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

export const formatRelativeTime = (date: Date): string => {
  return formatDistanceToNow(date, { addSuffix: true });
};

export const formatSmartDate = (date: Date): string => {
  if (isToday(date)) {
    return `Today at ${format(date, 'h:mm a')}`;
  }
  if (isYesterday(date)) {
    return `Yesterday at ${format(date, 'h:mm a')}`;
  }
  return format(date, 'MMM d, h:mm a');
};

export const formatMinutes = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

export const formatMinutesLong = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} minutes`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  return `${hours}h ${mins}m`;
};

export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const calculateProgress = (current: number, target: number): number => {
  return Math.min(Math.round((current / target) * 100), 100);
};

export const getRandomMotivationalMessage = (): string => {
  const messages = [
    "You're crushing it! 🎯",
    "Keep up the great work! 💪",
    "Democracy depends on accuracy! 🗳️",
    "Every review counts! ⭐",
    "Making a difference, one review at a time! 🌟",
    "Your attention to detail matters! 🔍",
    "Voters will thank you! 🙏",
    "Quality research, quality democracy! 📊",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
};

export const getPriorityWeight = (priority: string): number => {
  const weights: Record<string, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };
  return weights[priority] || 0;
};

export const sortByPriority = <T extends { priority: string }>(items: T[]): T[] => {
  return [...items].sort(
    (a, b) => getPriorityWeight(b.priority) - getPriorityWeight(a.priority)
  );
};
