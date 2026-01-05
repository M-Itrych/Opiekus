"use client";

import NavbarHeadteacher from "@/app/components/global/NavBar/variants/navbar_headteacher";
import Topbar from "@/app/components/global/TopBar/topbar";

interface HeadTeacherLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  headerAction?: React.ReactNode;
}

export default function HeadTeacherLayout({
  children,
  title,
  description,
  headerAction,
}: HeadTeacherLayoutProps) {
  return (
    <div className="flex min-h-screen w-full overflow-hidden bg-zinc-50">
      <NavbarHeadteacher />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden pt-[64px] sm:pt-[64px] ml-0 sm:ml-[80px]">
        <Topbar />
        <main className="flex min-w-0 flex-1 flex-col gap-4 sm:gap-6 overflow-y-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
          {(title || headerAction) && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
              {title && (
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-zinc-900">
                    {title}
                  </h1>
                  {description && (
                    <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                      {description}
                    </p>
                  )}
                </div>
              )}
              {headerAction && <div className="w-full sm:w-auto">{headerAction}</div>}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

