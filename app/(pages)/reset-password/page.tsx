"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from 'react';

function ResetPasswordContent() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setError("Brak tokenu resetowania hasła. Sprawdź link w emailu.");
    }
  }, [token]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Brak tokenu resetowania hasła.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Hasło musi mieć co najmniej 8 znaków");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Hasła nie są identyczne");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Błąd podczas resetowania hasła");
      }

      setSuccess(true);
      
      setTimeout(() => {
        router.push("/Login");
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const NameOfSchool = "Przedszkole nr 14 \"Biały Żagiel\"";

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:py-12 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6 sm:space-y-8">
          <div className="text-center">
            <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-green-800 dark:text-green-400">
                Hasło zostało pomyślnie zmienione. Przekierowywanie do strony logowania...
              </p>
            </div>
            <Link href="/Login" className="mt-4 inline-block text-xs sm:text-sm font-medium text-[#005FA6] hover:text-[#005FA6]">
              Przejdź do logowania
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8">
        <div>
          <h2 className="mt-4 sm:mt-6 text-center text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
            Resetowanie hasła
          </h2>
          <p className="mt-2 text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400 px-2">
            {NameOfSchool}
          </p>
        </div>
        <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-6" onSubmit={handleResetPassword}>
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-red-800 dark:text-red-400">{error}</p>
            </div>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="new-password" className="sr-only">
                Nowe hasło
              </label>
              <input
                id="new-password"
                name="new-password"
                type="password"
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-sm sm:text-base text-gray-900 dark:text-white dark:bg-gray-800 rounded-t-md focus:outline-none focus:ring-[#005FA6] focus:border-[#005FA6] focus:z-10"
                placeholder="Nowe hasło (min. 8 znaków)"
                disabled={!token || loading}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">
                Potwierdź hasło
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-sm sm:text-base text-gray-900 dark:text-white dark:bg-gray-800 rounded-b-md focus:outline-none focus:ring-[#005FA6] focus:border-[#005FA6] focus:z-10"
                placeholder="Potwierdź hasło"
                disabled={!token || loading}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !token}
              className="group relative w-full flex justify-center py-2.5 sm:py-2 px-4 border border-transparent text-sm sm:text-base font-medium rounded-md text-white bg-[#005FA6] hover:bg-[#004a85] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#005FA6] disabled:opacity-50 transition-colors"
            >
              {loading ? "Resetowanie..." : "Zresetuj hasło"}
            </button>
          </div>
          
          <div className="text-xs sm:text-sm text-center">
            <Link href="/Login" className="font-medium text-[#005FA6] hover:text-[#005FA6]">
              Powrót do logowania
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}

