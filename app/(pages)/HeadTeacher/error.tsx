'use client';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-900">
            <div className="text-center p-8">
                <h2 className="text-2xl font-bold text-red-600 mb-4">Coś poszło nie tak!</h2>
                <p className="text-zinc-600 dark:text-zinc-400 mb-6">{error.message || 'Wystąpił nieoczekiwany błąd'}</p>
                <button
                    onClick={reset}
                    className="px-6 py-3 bg-sky-600 text-white rounded-lg font-medium hover:bg-sky-700 transition-colors"
                >
                    Spróbuj ponownie
                </button>
            </div>
        </div>
    );
}
