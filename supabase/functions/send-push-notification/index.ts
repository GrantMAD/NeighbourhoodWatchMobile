import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  try {
    const { record } = await req.json()
    console.log(`Function triggered for user: ${record.id}`)

    // Guard clause: Check if notifications exist and are not empty
    if (!record.notifications || record.notifications.length === 0) {
      console.log('No notifications found in the record or the array is empty. Exiting.');
      return new Response('ok - no notifications to send');
    }

    // Extract the latest notification
    const latestNotification = record.notifications[record.notifications.length - 1];

    // Guard clause: Check if the latest notification or its message is invalid
    if (!latestNotification || !latestNotification.message) {
      console.error('The latest notification is invalid or has no message.', latestNotification);
      return new Response('error - invalid notification format', { status: 400 });
    }

    // Guard clause: Check for a push token
    if (!record.push_token) {
        console.log(`User ${record.id} has no push token. Exiting.`);
        return new Response('ok - no push token');
    }

    console.log(`Attempting to send notification to token: ${record.push_token}`)

    // Construct the push notification payload
    const message = {
      to: record.push_token,
      sound: 'default',
      title: 'New Notification',
      body: latestNotification.message,
      data: { notification: latestNotification },
    };

    // Send the push notification
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const responseBody = await response.json();
    console.log('Response from Expo Push Service:', responseBody);

    return new Response('ok')

  } catch (e) {
    console.error('An unexpected error occurred:', e.message);
    return new Response(`Error: ${e.message}`, { status: 500 });
  }
})
