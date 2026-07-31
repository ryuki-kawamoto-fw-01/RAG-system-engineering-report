import React from 'react';
import SvgWarning from '../icon/decorative/Warning';

const importantNotifications = [
  {
    publishedAt: '2025/XX/XX',
    title: <></>,
  },
];

export function ImportantNotificationList() {
  return (
    <div className="mt-2.5 flex rounded-lg border border-red-600 bg-red-50 px-10 py-2.5">
      <div className="flex flex-col items-center justify-center">
        <SvgWarning className="mx-3.5 mb-0.5 size-6" />
        <span className="text-xs font-bold">重要</span>
      </div>
      <ul className="ml-6 list-inside list-disc text-sm">
        {importantNotifications.map((importantNotification) => (
          <li key={importantNotification.publishedAt} className="mb-1.5 last:mb-0">
            <span className="mr-4">{importantNotification.publishedAt} </span>
            <span>{importantNotification.title}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
