import { SEASONAL_EVENT_VALUES } from '../_constants/seasonal-event';

export type SeasonalEventName = (typeof SEASONAL_EVENT_VALUES)[number];

export type SeasonalEvent = {
  name: SeasonalEventName;
  image: string;
  startDate: string;
  endDate: string;
  chat: {
    keyMessage: string;
    content: string;
    image: string;
  };
};
