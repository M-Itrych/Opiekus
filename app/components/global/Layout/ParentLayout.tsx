"use client";

import NavbarParent from "@/app/components/global/NavBar/variants/navbar_parent";
import ParentTopbar from "@/app/components/global/TopBar/ParentTopbar";

interface ParentLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  headerAction?: React.ReactNode;
}

export default function ParentLayout({
  children,
  title,
  description,
  headerAction,
}: ParentLayoutProps) {
  return (
    <div className="flex min-h-screen w-full overflow-hidden bg-zinc-50">
      <NavbarParent />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden p-8">
        <ParentTopbar />
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

