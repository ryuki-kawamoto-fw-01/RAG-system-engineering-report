import { SeasonalEvent } from '../_types/seasonal-event';

export const SEASONAL_EVENT_HALLOWEEN = 'Halloween';
export const SEASONAL_EVENT_CHRISTMAS = 'Christmas';
export const SEASONAL_EVENT_NEWYEAR = 'NewYear';
export const SEASONAL_EVENT_VALENTINE = 'Valentine';
export const SEASONAL_EVENT_HINAMATSURI = 'Hinamatsuri';

export const SEASONAL_EVENT_VALUES = [
  SEASONAL_EVENT_HALLOWEEN,
  SEASONAL_EVENT_CHRISTMAS,
  SEASONAL_EVENT_NEWYEAR,
  SEASONAL_EVENT_VALENTINE,
  SEASONAL_EVENT_HINAMATSURI,
] as const;
export type SeasonalEventName = (typeof SEASONAL_EVENT_VALUES)[number];

const currentYear = new Date().getFullYear();

export const HALLOWEEN: SeasonalEvent = {
  name: SEASONAL_EVENT_HALLOWEEN,
  image: '/images/seasonal-event/halloween-bear.png',
  startDate: `${currentYear}-10-01`,
  endDate: `${currentYear}-11-01`,
  chat: {
    keyMessage: 'トリックオアトリート',
    content: 'ハッピーハロウィン！',
    image: '/images/seasonal-event/halloween-chat-image.png',
  },
};

export const CHRISTMAS: SeasonalEvent = {
  name: SEASONAL_EVENT_CHRISTMAS,
  image: '/images/seasonal-event/genta_202512.png',
  startDate: `${currentYear}-11-26`,
  endDate: `${currentYear}-12-26`,
  chat: {
    keyMessage: 'メリークリスマス',
    content: 'メリークリスマス！\nよいお年を！',
    image: '/images/seasonal-event/genta_202512_output.png',
  },
};

export const NEWYEAR: SeasonalEvent = {
  name: SEASONAL_EVENT_NEWYEAR,
  image: '/images/seasonal-event/genta_202601.png',
  startDate: `${currentYear}-01-01`,
  endDate: `${currentYear}-01-23`,
  chat: {
    keyMessage: 'あけましておめでとう',
    content: '今年もよろしくお願いします！',
    image: '/images/seasonal-event/genta_202601_output.png',
  },
};

export const VALENTINE: SeasonalEvent = {
  name: SEASONAL_EVENT_VALENTINE,
  image: '/images/seasonal-event/genta_202602.png',
  startDate: `${currentYear}-02-01`,
  endDate: `${currentYear}-02-15`,
  chat: {
    keyMessage: 'ハッピーバレンタイン',
    content: 'いつもありがとう！',
    image: '/images/seasonal-event/genta_202602_output.png',
  },
};

export const HINAMATSURI: SeasonalEvent = {
  name: SEASONAL_EVENT_HINAMATSURI,
  image: '/images/seasonal-event/genta_202603.png',
  startDate: `${currentYear}-03-01`,
  endDate: `${currentYear}-03-15`,
  chat: {
    keyMessage: 'ひなまつり',
    content: 'おだいりさまであるぞ！\nげんあしをいつも使ってくれてありがとう！',
    image: '/images/seasonal-event/genta_202603_output.png',
  },
};

export const seasonalEvents: SeasonalEvent[] = [
  HALLOWEEN,
  CHRISTMAS,
  NEWYEAR,
  VALENTINE,
  HINAMATSURI,
];
