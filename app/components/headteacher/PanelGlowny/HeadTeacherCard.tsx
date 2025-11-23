import { ReactNode } from "react";

interface HeadTeacherCardProps {
  title: string;
  date: string;
  time: string;
  description: string;
  footerSlot?: ReactNode;
}

export default function HeadTeacherCard({
  title,
  date,
  time,
  description,
  footerSlot,
}: HeadTeacherCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white px-5 py-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {title}
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {date} • {time}
        </p>
      </div>
      <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
        {description}
      </p>
      {footerSlot ? <div className="mt-2">{footerSlot}</div> : null}
    </div>
  );
}