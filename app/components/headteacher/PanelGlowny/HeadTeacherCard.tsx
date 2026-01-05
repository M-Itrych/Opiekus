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
    <div className="flex flex-col gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border border-zinc-200 bg-white px-3 sm:px-4 md:px-5 py-3 sm:py-4 md:py-5 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-0.5 sm:gap-1">
        <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
          {date} • {time}
        </p>
      </div>
      <p className="text-xs sm:text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
        {description}
      </p>
      {footerSlot ? <div className="mt-1 sm:mt-2">{footerSlot}</div> : null}
    </div>
  );
}