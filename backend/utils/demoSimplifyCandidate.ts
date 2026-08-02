 export const buildUserBadge = (
  isAdmin: boolean,
  isPremium: boolean,
  hasOverdue: boolean
): string => {
  let role: string;
  if (isAdmin) {
    role = 'ADMIN';
  } else if (isPremium) {
    role = 'PREMIUM';
  } else {
    role = 'MEMBER';
  }

  const suffix = hasOverdue ? ' - ACTION NEEDED' : '';
  return role + suffix;
};
