 export const buildUserBadge = (
    isAdmin: boolean,
    isPremium: boolean,
    hasOverdue: boolean
  ) => {
    let role = '';

    if (isAdmin === true) {
      role = 'ADMIN';
    } else {
      if (isPremium === true) {
        role = 'PREMIUM';
      } else {
        role = 'MEMBER';
      }
    }

    let suffix = '';
    if (hasOverdue === true) {
      suffix = ' - ACTION NEEDED';
    } else {
      suffix = '';
    }

    const finalValue = role + suffix;
    return finalValue;
  };
