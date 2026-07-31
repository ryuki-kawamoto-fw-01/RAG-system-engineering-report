import React from 'react';
import SvgNews from '../icon/decorative/News';

const notifications = [
  {
    publishedAt: '2026/3/3',
    title: <>本環境はハンズオン・トライアル用の環境になります。</>,
  },
];

export function NotificationList() {
  return (
    <div className="flex rounded-lg border border-slate-500 bg-blue-50 px-10 py-2.5">
      <div className="flex flex-col items-center justify-center">
        <SvgNews className="mx-3.5 mb-0.5 size-6" />
        <span className="text-xs font-bold">お知らせ</span>
      </div>
      <ul className="ml-6 list-inside list-disc text-sm">
        {notifications.map((notification, idx) => (
          <li key={idx} className="mb-1.5 last:mb-0">
            <span className="mr-4">{notification.publishedAt} </span>
            <span>{notification.title}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
