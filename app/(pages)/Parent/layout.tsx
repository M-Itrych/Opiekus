import type { ReactNode } from 'react';
import Topbar from '../../components/global/NavBar/parenttopbar';

export default function ParentLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen flex flex-col bg-blue-50 overflow-hidden">
      <Topbar />
      <div className="flex flex-1 overflow-hidden min-h-0">
        <main className="flex-1 overflow-y-auto bg-blue-50 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}