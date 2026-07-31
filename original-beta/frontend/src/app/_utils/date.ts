import dayjs from 'dayjs';
import 'dayjs/locale/ja';

dayjs.locale('ja');

export const formatDate = (date: string | number | Date, template?: string) => {
  return dayjs(date).format(template);
};
