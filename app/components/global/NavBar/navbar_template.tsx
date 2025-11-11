"use client";

import Link from "next/link";
import { ReactNode } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

interface NavbarTemplateItem {
    icon: ReactNode;
    text: string;
    href: string;
}

interface NavbarTemplateProps {
    items: NavbarTemplateItem[];
    userName?: string;
}

export default function NavbarTemplate({ items, userName = "Użytkownik" }: NavbarTemplateProps) {
    const pathname = usePathname();
    const [isHovered, setIsHovered] = useState(false);
    
    return (
        <div 
            className="group fixed left-0 top-0 flex flex-col items-center p-4 w-[80px] hover:w-[240px] h-screen shadow-xl shadow-slate-900/10 bg-linear-to-b from-white to-slate-50/50 transition-all duration-300 ease-out overflow-hidden border-r border-slate-200/60 z-50"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >

            <div className="flex items-center justify-center group-hover:justify-start transition-all duration-300 border-b border-slate-200/60 pb-4 ease-in-out relative w-full mb-8 pt-2">
                <div className="relative">
                    <Image 
                        src="/global/logo.png" 
                        alt="Opiekuś" 
                        className="max-w-[60px] shrink-0 relative z-10 transition-transform duration-300 ease-in-out group-hover:scale-110 drop-shadow-sm" 
                        width={70} 
                        height={70} 
                    />
                </div>
                <AnimatePresence>
                    {isHovered && (
                        <motion.h1
                            initial={{ opacity: 0, x: -16, maxWidth: 0 }}
                            animate={{ opacity: 1, x: 0, maxWidth: 200 }}
                            exit={{ 
                                opacity: 0, 
                                x: -16, 
                                maxWidth: 0,
                                transition: { duration: 0.15 }
                            }}
                            transition={{ 
                                duration: 0.25, 
                                ease: "easeOut",
                            }}
                            className="absolute left-20 text-2xl font-bold whitespace-nowrap overflow-hidden text-slate-800"
                        >
                            Opiekuś
                        </motion.h1>
                    )}
                </AnimatePresence>
            </div>

            <div className="flex flex-col items-center justify-center gap-3 w-full flex-1 overflow-x-hidden overflow-y-auto">
                {items.map((item: NavbarTemplateItem, index: number) => (
                    <Link 
                        href={item.href} 
                        key={item.href} 
                        className={`${pathname === item.href ? "bg-blue-500 text-white shadow-md shadow-blue-500/30" : "text-slate-600 hover:bg-blue-50 hover:text-blue-600"} flex items-center justify-center group-hover:justify-start p-3 rounded-xl w-full transition-all duration-300 ease-in-out overflow-visible transform hover:scale-[1.02] active:scale-[0.98] relative min-h-[48px] group/item`}
                        style={{
                            transitionDelay: isHovered ? `${index * 10}ms` : '0ms'
                        }}
                    >
                        <span className={`shrink-0 relative z-10 transition-transform duration-300 ease-in-out ${pathname === item.href ? "scale-110" : "group-hover/item:scale-110"}`}>
                            {item.icon}
                        </span>
                        <AnimatePresence>
                            {isHovered && (
                                <motion.span
                                    initial={{ opacity: 0, x: -16, maxWidth: 0 }}
                                    animate={{ opacity: 1, x: 0, maxWidth: 200 }}
                                    exit={{ 
                                        opacity: 0, 
                                        x: -16, 
                                        maxWidth: 0,
                                        transition: { duration: 0.15 }
                                    }}
                                    transition={{ 
                                        duration: 0.25, 
                                        ease: "easeOut",
                                        delay: index * 0.02
                                    }}
                                    className={`absolute left-14 text-sm whitespace-nowrap overflow-hidden font-semibold ${pathname === item.href ? "text-white" : "text-slate-700"}`}
                                >
                                    {item.text}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </Link>
                ))}
            </div>

            <div className="flex flex-col items-center w-full mt-auto pt-4 border-t border-slate-200/60 gap-3">
                <div className="flex items-center justify-center group-hover:justify-start w-full p-3 rounded-xl bg-slate-50/50 hover:bg-slate-100/70 transition-all duration-300 ease-in-out relative min-h-[56px] group/user">
                    <span className="shrink-0 relative z-10 transition-transform duration-300 ease-in-out group-hover/user:scale-110 text-slate-600">
                        <AccountCircleIcon sx={{ fontSize: 32 }} />
                    </span>
                    <AnimatePresence>
                        {isHovered && (
                            <motion.div
                                initial={{ opacity: 0, x: -16, maxWidth: 0 }}
                                animate={{ opacity: 1, x: 0, maxWidth: 200 }}
                                exit={{ 
                                    opacity: 0, 
                                    x: -16, 
                                    maxWidth: 0,
                                    transition: { duration: 0.15 }
                                }}
                                transition={{ 
                                    duration: 0.25, 
                                    ease: "easeOut",
                                }}
                                className="absolute left-14 flex flex-col whitespace-nowrap overflow-hidden"
                            >
                                <span className="text-xs text-slate-500 font-medium">Zalogowany jako</span>
                                <span className="text-sm font-semibold text-slate-800 truncate">{userName}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <button 
                    className="flex items-center justify-center group-hover:justify-start gap-2 p-3 rounded-xl hover:bg-red-50 hover:text-red-600 text-slate-600 w-full transition-all duration-300 ease-in-out overflow-visible transform hover:scale-[1.02] active:scale-[0.98] relative min-h-[48px] group/logout"
                >
                    <span className="shrink-0 relative z-10 transition-transform duration-300 ease-in-out group-hover/logout:scale-110">
                        <LogoutIcon />
                    </span>
                    <AnimatePresence>
                        {isHovered && (
                            <motion.span
                                initial={{ opacity: 0, x: -16, maxWidth: 0 }}
                                animate={{ opacity: 1, x: 0, maxWidth: 200 }}
                                exit={{ 
                                    opacity: 0, 
                                    x: -16, 
                                    maxWidth: 0,
                                    transition: { duration: 0.15 }
                                }}
                                transition={{ 
                                    duration: 0.25, 
                                    ease: "easeOut",
                                }}
                                className="absolute left-14 text-sm whitespace-nowrap overflow-hidden font-semibold text-red-600"
                            >
                                Wyloguj
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>
            </div>
        </div>
    )
}