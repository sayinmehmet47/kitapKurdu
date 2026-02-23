export const buildUserBadge = (isAdmin: boolean, isPremium: boolean, hasOverdue: boolean) => {
  const role = isAdmin ? 'ADMIN' : isPremium ? 'PREMIUM' : 'MEMBER';
  const suffix = hasOverdue ? ' - ACTION NEEDED' : '';
  return role + suffix;
};
