import { seasonalEvents } from '../_constants/seasonal-event';

export const getCurrentSeasonalEvent = (baseDate: Date = new Date()) => {
  const now = baseDate;

  const currentEvent = seasonalEvents.find((event) => {
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    return now >= startDate && now <= endDate;
  });

  return currentEvent ?? null;
};
