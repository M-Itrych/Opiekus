"use client";

import { useState, useEffect } from "react";
import { Monitor, Tablet, X } from "lucide-react";

export default function MobileWarningModal() {
    const [isVisible, setIsVisible] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        const dismissed = sessionStorage.getItem("mobileWarningDismissed");
        if (dismissed) {
            setIsDismissed(true);
            return;
        }

        const checkScreenSize = () => {
            setIsVisible(window.innerWidth < 768);
        };

        checkScreenSize();
        window.addEventListener("resize", checkScreenSize);

        return () => window.removeEventListener("resize", checkScreenSize);
    }, []);

    const handleDismiss = () => {
        setIsDismissed(true);
        sessionStorage.setItem("mobileWarningDismissed", "true");
    };

    if (!isVisible || isDismissed) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:hidden">
            <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900">
                <button
                    onClick={handleDismiss}
                    className="absolute right-4 top-4 rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="flex flex-col items-center text-center">
                    <div className="mb-4 flex items-center gap-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/30">
                            <Tablet className="h-6 w-6 text-sky-600" />
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/30">
                            <Monitor className="h-6 w-6 text-sky-600" />
                        </div>
                    </div>

                    <h2 className="mb-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        Lepsze doświadczenie na większym ekranie
                    </h2>

                    <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
                        Dla najlepszego doświadczenia zalecamy korzystanie z aplikacji{" "}
                        <span className="font-semibold">Opiekuś</span> na tablecie lub
                        komputerze.
                    </p>

                    <button
                        onClick={handleDismiss}
                        className="w-full rounded-lg bg-sky-500 px-4 py-3 font-medium text-white transition-colors hover:bg-sky-600"
                    >
                        Rozumiem, kontynuuj
                    </button>

                    <p className="mt-3 text-xs text-zinc-400">
                        Ta wiadomość nie pojawi się ponownie w tej sesji
                    </p>
                </div>
            </div>
        </div>
    );
}
