import * as webpush from 'web-push';
import { User } from './models/User';

const publicVapidKey =
  'BCrScCgFJml1t1UsPNfsgd6562aSzuyRB_qQw79KrAfaALzpxkYPaLxavkP2s_P1OP3kWXuvhiK2T1ZJNmhhCiE';

const privateVapidKey = 'yHYRAaCqdtMCmSJrmUz248yriRJC6hqbcmzhM0NBEwM';
webpush.setVapidDetails(
  'https://yourwebsite.com',
  publicVapidKey,
  privateVapidKey
);

export const getUserSubscriptionsExcludingUser = async (
  userIdToExclude: string
) => {
  try {
    const subscriptions = await User.find({
      _id: { $ne: userIdToExclude },
      'subscription.endpoint': { $exists: true },
    }).select('subscription');
    return subscriptions;
  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    throw error;
  }
};

export const removeSubscription = async (subscription: any) => {
  // Remove the subscription from your database
  await User.findOneAndUpdate(
    { 'subscription.endpoint': subscription.endpoint },
    { $unset: { subscription: '' } }
  );
};
