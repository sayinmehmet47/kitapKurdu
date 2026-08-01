import * as webpush from 'web-push';
import { logger } from './logger';
import { User } from './models/User';

const publicVapidKey = process.env.VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT;

export const isWebPushConfigured = Boolean(publicVapidKey && privateVapidKey && vapidSubject);

if (publicVapidKey && privateVapidKey && vapidSubject) {
  webpush.setVapidDetails(vapidSubject, publicVapidKey, privateVapidKey);
} else {
  logger.warn(
    'Web push notifications are disabled: set VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY and VAPID_SUBJECT to enable them.'
  );
}

export const getUserSubscriptionsExcludingUser = async (userIdToExclude: string) => {
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

interface SubscriptionReference {
  endpoint: string;
}

export const removeSubscription = async (subscription: SubscriptionReference) => {
  // Remove the subscription from your database
  await User.findOneAndUpdate(
    { 'subscription.endpoint': subscription.endpoint },
    { $unset: { subscription: '' } }
  );
};
