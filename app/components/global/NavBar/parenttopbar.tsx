'use client';

import Home from '@mui/icons-material/Home';
import ChildCare from '@mui/icons-material/ChildCare';
import CalendarMonth from '@mui/icons-material/CalendarMonth';
import Notifications from '@mui/icons-material/Notifications';
import Article from '@mui/icons-material/Article';
import ImageIcon from '@mui/icons-material/Image';
import Checklist from '@mui/icons-material/Checklist';
import Payments from '@mui/icons-material/Payments';
import ExitToApp from '@mui/icons-material/ExitToApp';
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
      'wyloguj': '/Login',
    };
    return routes[tabId] || '/Parent';
  };

  const handleTabClick = (tabId: string) => {
    const route = getRouteForTab(tabId);
    if (route) {
      router.push(route);
    }
  };

  const tabs = [
    { id: 'panel', label: 'Panel', icon: Home },
    { id: 'dziecko', label: 'Moje dziecko', icon: ChildCare },
    { id: 'obecnosc', label: 'Obecności', icon: CalendarMonth },
    { id: 'jadlospisy', label: 'Jadłospisy', icon: Checklist },
    { id: 'galeria', label: 'Galeria', icon: ImageIcon },
    { id: 'ogloszenia', label: 'Ogłoszenia', icon: Notifications },
    { id: 'wiadomosci', label: 'Wiadomości', icon: Article },
    { id: 'platnosci', label: 'Płatności', icon: Payments },
    { id: 'wyloguj', label: 'Wyloguj', icon: ExitToApp },
  ];

  return (
    <div className="w-full bg-white border-b border-gray-200">
      <div className="flex items-center justify-end overflow-x-auto scrollbar-hide px-2 md:px-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 whitespace-nowrap
                transition-colors duration-200
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
              <span className="text-sm font-medium">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}