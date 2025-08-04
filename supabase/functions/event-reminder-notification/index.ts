import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  { global: { headers: { Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` } } }
);

// Helper to generate a unique ID for notifications
function generateUniqueId() {
  return crypto.randomUUID();
}

serve(async (_req) => {
  try {
    console.log("Event reminder function started.");

    // 1. Fetch all groups and their events
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('id, events');

    if (groupsError) {
      console.error('Error fetching groups:', groupsError.message);
      return new Response(`Error fetching groups: ${groupsError.message}`, { status: 500 });
    }

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // 2. Iterate through each group to find events happening today
    for (const group of groups) {
      if (!group.events || group.events.length === 0) continue;

      const upcomingEventsToday = group.events.filter(event => {
        const eventStartDate = new Date(event.startDate);
        const eventDateStart = new Date(eventStartDate.getFullYear(), eventStartDate.getMonth(), eventStartDate.getDate());
        return eventDateStart.getTime() === todayStart.getTime();
      });

      // 3. For each event today, process its attendees
      for (const event of upcomingEventsToday) {
        if (!event.attendees || event.attendees.length === 0) {
          console.log(`Event '${event.title}' has no attendees. Skipping.`);
          continue;
        }

        // 4. Fetch profiles of all attendees for this event
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, notifications')
          .in('id', event.attendees);

        if (profilesError) {
          console.error(`Error fetching profiles for event ${event.id}:`, profilesError.message);
          continue; // Skip to the next event if profiles can't be fetched
        }

        // 5. Create and add notifications for each attendee
        for (const profile of profiles) {
          let userNotifications = profile.notifications || [];

          const notificationExists = userNotifications.some(
            (n) => n.type === 'event_reminder' && n.eventId === event.id
          );

          if (!notificationExists) {
            const newNotification = {
              id: generateUniqueId(),
              type: 'event_reminder',
              message: `Reminder: '${event.title}' is today at ${new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}.`,
              eventId: event.id,
              groupId: group.id,
              createdAt: new Date().toISOString(),
              read: false,
            };
            
            const updatedNotifications = [...userNotifications, newNotification];

            const { error: updateError } = await supabase
              .from('profiles')
              .update({ notifications: updatedNotifications })
              .eq('id', profile.id);

            if (updateError) {
              console.error(`Error updating notifications for user ${profile.id}:`, updateError.message);
            } else {
              console.log(`Successfully added event reminder for user ${profile.id} for event '${event.title}'.`);
            }
          } else {
            console.log(`Event reminder for '${event.title}' already exists for user ${profile.id}.`);
          }
        }
      }
    }

    console.log("Event reminder function finished successfully.");
    return new Response('ok');

  } catch (e) {
    console.error('An unexpected error occurred:', e.message);
    return new Response(`Error: ${e.message}`, { status: 500 });
  }
});
