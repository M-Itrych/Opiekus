"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from 'react';

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState("");
  const [forgotPasswordError, setForgotPasswordError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Błąd logowania");
      }

      router.push(data.redirectTo || "/");
      router.refresh(); // Refresh to update middleware/session state
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordError("");
    setForgotPasswordMessage("");
    setForgotPasswordLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Błąd podczas wysyłania żądania");
      }

      setForgotPasswordMessage(data.message || "Jeśli podany email istnieje w systemie, wysłano instrukcje resetowania hasła");
      setForgotPasswordEmail("");

      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotPasswordMessage("");
      }, 3000);
    } catch (err: any) {
      setForgotPasswordError(err.message);
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const NameOfSchool = process.env.NEXT_PUBLIC_SCHOOL_NAME || "Przedszkole nr 14 \"Biały Żagiel\"";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8">
        <div>
          <h2 className="mt-4 sm:mt-6 text-center text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
            Zaloguj się do swojego konta Opiekuś
          </h2>
          <p className="mt-2 text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400 px-2">
            {NameOfSchool}
          </p>
        </div>
        <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-6" onSubmit={handleLogin}>
          {registered && (
            <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-green-800 dark:text-green-400">
                Rejestracja pomyślna. Możesz się teraz zalogować.
              </p>
            </div>
          )}
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-red-800 dark:text-red-400">{error}</p>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Adres email
              </label>
              <input
                id="email"
                name="email"
                type="text"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-800 rounded-t-md focus:outline-none focus:ring-[#005FA6] focus:border-[#005FA6] focus:z-10"
                placeholder="Podaj email"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Hasło
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-800 rounded-b-md focus:outline-none focus:ring-[#005FA6] focus:border-[#005FA6] focus:z-10"
                placeholder="Podaj hasło"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-[#005FA6] focus:ring-[#005FA6] border-gray-300 dark:border-gray-600 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-xs sm:text-sm text-gray-900 dark:text-white">
                Zapamiętaj mnie
              </label>
            </div>

            <div className="text-xs sm:text-sm">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="font-medium text-[#005FA6] hover:text-[#005FA6] cursor-pointer"
              >
                Zapomniałeś hasła?
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2.5 sm:py-2 px-4 border border-transparent text-sm sm:text-base font-medium rounded-md text-white bg-[#005FA6] hover:bg-[#004a85] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#005FA6] disabled:opacity-50 transition-colors"
            >
              {loading ? "Logowanie..." : "Zaloguj się"}
            </button>
          </div>
          <div className="text-xs sm:text-sm text-center">
            <span className="text-gray-600 dark:text-gray-400">Nie masz konta? </span>
            <Link href="/Register" className="font-medium text-[#005FA6] hover:text-[#005FA6]">
              Zarejestruj się
            </Link>
          </div>
        </form>
      </div>

      {/* Modal resetowania hasła */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 sm:p-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Resetowanie hasła
            </h3>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              {forgotPasswordMessage && (
                <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-green-800 dark:text-green-400">
                    {forgotPasswordMessage}
                  </p>
                </div>
              )}

              {forgotPasswordError && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-red-800 dark:text-red-400">
                    {forgotPasswordError}
                  </p>
                </div>
              )}

              <div>
                <label htmlFor="forgot-email" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Adres email
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  required
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 text-sm sm:text-base text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-[#005FA6] focus:border-[#005FA6]"
                  placeholder="Podaj adres email"
                  disabled={forgotPasswordLoading || !!forgotPasswordMessage}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotPasswordEmail("");
                    setForgotPasswordError("");
                    setForgotPasswordMessage("");
                  }}
                  className="flex-1 px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#005FA6] transition-colors"
                  disabled={forgotPasswordLoading}
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={forgotPasswordLoading || !!forgotPasswordMessage}
                  className="flex-1 px-4 py-2.5 sm:py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-[#005FA6] hover:bg-[#004a85] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#005FA6] disabled:opacity-50 transition-colors"
                >
                  {forgotPasswordLoading ? "Wysyłanie..." : "Wyślij"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
