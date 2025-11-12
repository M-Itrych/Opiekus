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
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden pt-[64px] ml-[80px]">
        <Topbar />
        <main className="flex min-w-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-6 md:px-8">
          {(title || headerAction) && (
            <div className="flex items-center justify-between">
              {title && (
                <div>
                  <h1 className="text-2xl font-bold text-zinc-900">
                    {title}
                  </h1>
                  {description && (
                    <p className="text-sm text-zinc-500 mt-1">
                      {description}
                    </p>
                  )}
                </div>
              )}
              {headerAction && <div>{headerAction}</div>}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

