const webPush = require('web-push');
const PushSubscription = require('../models/PushSubscription');

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || 'mailto:meetpatel5243@gmail.com';

if (publicKey && privateKey) {
  webPush.setVapidDetails(subject, publicKey, privateKey);
} else {
  console.warn('VAPID keys are not configured. Push notifications will be disabled.');
}

/**
 * Sends a push notification to all registered subscriptions of a user.
 * @param {string|ObjectId} userId - The recipient user's ID.
 * @param {string} title - The notification title.
 * @param {string} body - The notification body content.
 * @param {Object} [data] - Additional metadata (e.g. redirect URL).
 */
async function sendPushNotification(userId, title, body, data = {}) {
  try {
    const subscriptions = await PushSubscription.find({ userId });
    if (subscriptions.length === 0) return;

    const payload = JSON.stringify({
      title,
      body,
      data: {
        url: data.url || '/',
        ...data
      }
    });

    const sendPromises = subscriptions.map(async (sub) => {
      try {
        await webPush.sendNotification(sub.subscription, payload);
      } catch (error) {
        // If the subscription has expired or is no longer active, clean it up
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log(`Cleaning up expired subscription: ${sub._id}`);
          await PushSubscription.deleteOne({ _id: sub._id });
        } else {
          console.error(`Failed to send push notification to subscription ${sub._id}:`, error);
        }
      }
    });

    await Promise.all(sendPromises);
  } catch (error) {
    console.error(`Error sending push notification to user ${userId}:`, error);
  }
}

module.exports = { sendPushNotification };
