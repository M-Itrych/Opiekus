import type { ReactNode } from 'react';
import Topbar from '../../components/global/NavBar/parenttopbar';
import NavbarParent from '@/app/components/global/NavBar/variants/navbar_parent';

export default function ParentLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen flex flex-col bg-blue-50 overflow-hidden">
      <Topbar />
      <div className="flex flex-1 overflow-hidden min-h-0">
        <NavbarParent />
        <main className="flex-1 overflow-y-auto bg-blue-50 min-w-0  ml-[100px]">
          {children}
        </main>
      </div>
    </div>
  );
}