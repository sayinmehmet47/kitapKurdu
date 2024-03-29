import { User } from '../../models/User';

export const logoutUser = async (userId: string) => {
  const user = await User.findById(userId);
  if (user && user.subscription) {
    user.subscription = undefined;
    await user.save();
  }
};
