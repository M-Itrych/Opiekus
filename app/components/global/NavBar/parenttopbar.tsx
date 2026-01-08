'use client';

import Home from '@mui/icons-material/Home';
import ChildCare from '@mui/icons-material/ChildCare';
import CalendarMonth from '@mui/icons-material/CalendarMonth';
import Notifications from '@mui/icons-material/Notifications';
import ImageIcon from '@mui/icons-material/Image';
import Checklist from '@mui/icons-material/Checklist';
import MessageIcon from '@mui/icons-material/Message';
import PaymentIcon from '@mui/icons-material/Payment';
import GavelIcon from '@mui/icons-material/Gavel';
import PeopleIcon from '@mui/icons-material/People';
import LogoutIcon from '@mui/icons-material/Logout';
import { usePathname, useRouter } from 'next/navigation';

export default function Topbar() {
  const pathname = usePathname();
  const router = useRouter();

  const getActiveTabFromPath = (path: string): string => {
    if (path.startsWith('/Parent/dziecko')) return 'dziecko';
    if (path.startsWith('/Parent/obecnosci')) return 'obecnosc';
    if (path.startsWith('/Parent/jadlospis')) return 'jadlospisy';
    if (path.startsWith('/Parent/galeria')) return 'galeria';
    if (path.startsWith('/Parent/ogloszenia')) return 'ogloszenia';
    if (path.startsWith('/Parent/wiadomosci')) return 'wiadomosci';
    if (path.startsWith('/Parent/platnosci')) return 'platnosci';
    if (path.startsWith('/Parent/zgody')) return 'zgody';
    if (path.startsWith('/Parent/odbior')) return 'odbior';
    if (path === '/Parent' || path.startsWith('/Parent/panel')) return 'panel';
    return 'panel';
  };

  const activeTab = getActiveTabFromPath(pathname);

  const getRouteForTab = (tabId: string) => {
    const routes: { [key: string]: string } = {
      'panel': '/Parent',
      'dziecko': '/Parent/dziecko',
      'obecnosc': '/Parent/obecnosci',
      'jadlospisy': '/Parent/jadlospis',
      'galeria': '/Parent/galeria',
      'ogloszenia': '/Parent/ogloszenia',
      'wiadomosci': '/Parent/wiadomosci',
      'platnosci': '/Parent/platnosci',
      'zgody': '/Parent/zgody',
      'odbior': '/Parent/odbior',
    };
    return routes[tabId] || '/Parent';
  };

  const handleTabClick = (tabId: string) => {
    const route = getRouteForTab(tabId);
    if (route) {
      router.push(route);
    }
  };

  const signOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Error logging out:", error);
    } finally {
      router.push("/Login");
    }
  };

  const tabs = [
    { id: 'panel', label: 'Panel', icon: Home },
    { id: 'dziecko', label: 'Moje dziecko', icon: ChildCare },
    { id: 'obecnosc', label: 'Obecności', icon: CalendarMonth },
    { id: 'jadlospisy', label: 'Jadłospisy', icon: Checklist },
    { id: 'galeria', label: 'Galeria', icon: ImageIcon },
    { id: 'ogloszenia', label: 'Ogłoszenia', icon: Notifications },
    { id: 'wiadomosci', label: 'Wiadomości', icon: MessageIcon },
    { id: 'platnosci', label: 'Płatności', icon: PaymentIcon },
    { id: 'zgody', label: 'Zgody', icon: GavelIcon },
    { id: 'odbior', label: 'Osoby upoważnione', icon: PeopleIcon },
  ];

  return (
    <div className="w-full bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-start overflow-x-auto scrollbar-hide px-1 sm:px-2 md:px-4 flex-1 min-w-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`
                  flex items-center gap-1 sm:gap-1.5 md:gap-2 px-1.5 sm:px-2.5 md:px-4 py-2 sm:py-2.5 md:py-3 whitespace-nowrap
                  transition-colors duration-200 text-xs sm:text-sm shrink-0
                  ${isActive 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                  }
                `}
              >
                <Icon 
                  fontSize="small" 
                  className={isActive ? 'text-blue-600' : 'text-gray-500'}
                />
                <span className="font-medium hidden sm:inline">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors duration-200 text-xs sm:text-sm whitespace-nowrap border-l border-gray-200 shrink-0"
          title="Wyloguj"
        >
          <LogoutIcon fontSize="small" />
          <span className="font-medium hidden sm:inline">Wyloguj</span>
        </button>
      </div>
    </div>
  );
}