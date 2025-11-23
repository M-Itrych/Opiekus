import type { ReactNode } from 'react';
import ParentLayout from '../../components/global/Layout/ParentLayout';

export default function ParentLayoutWrapper({ children }: { children: ReactNode }) {
  return (
    <ParentLayout>
      {children}
    </ParentLayout>
  );
}