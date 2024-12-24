export const isVirtualEvent = (event) => {
  return event.venue?.type === 'Virtual';
};

export const isLiveStream = (event) => {
  if (!event.datetime || !event.venue.timezone) return false;
  
  const eventTime = new Date(event.datetime);
  const now = new Date();
  const diffMinutes = (eventTime - now) / (1000 * 60);
  
  // Event is live from 15 minutes before start until 4 hours after start
  return diffMinutes <= 15 && diffMinutes >= -(60 * 4);
};

export const formatEventTime = (datetime, timezone) => {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
    timeZone: timezone || 'UTC'
  }).format(new Date(datetime));
}; 