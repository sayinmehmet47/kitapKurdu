import { User } from '../../models/User';

export const authenticateUser = async (userId: string) => {
  const user = await User.findById(userId).select('-password');

  return {
    user: {
      id: user?._id?.toString(),
      username: user?.username,
      isAdmin: user?.isAdmin,
      email: user?.email,
      createdAt: user?.createdAt,
      updatedAt: user?.updatedAt,
    },
  };
};
