"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    phone: "",
    password: "",
    role: "PARENT",
    secretCode: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (value: string) => {
    setFormData({ ...formData, role: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Błąd rejestracji");
      }

      router.push("/Login?registered=true");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const NameOfSchool = "Przedszkole nr 14 \"Biały Żagiel\"";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8">
        <div>
          <h2 className="mt-4 sm:mt-6 text-center text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
            Zarejestruj się w Opiekuś
          </h2>
          <p className="mt-2 text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400 px-2">
            {NameOfSchool}
          </p>
        </div>
        <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-red-800 dark:text-red-400">{error}</p>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="name" className="sr-only">
                Imię
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-sm sm:text-base text-gray-900 dark:text-white dark:bg-gray-800 rounded-t-md focus:outline-none focus:ring-[#005FA6] focus:border-[#005FA6] focus:z-10"
                placeholder="Imię"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="surname" className="sr-only">
                Nazwisko
              </label>
              <input
                id="surname"
                name="surname"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-sm sm:text-base text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-[#005FA6] focus:border-[#005FA6] focus:z-10"
                placeholder="Nazwisko"
                value={formData.surname}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">
                Adres email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-sm sm:text-base text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-[#005FA6] focus:border-[#005FA6] focus:z-10"
                placeholder="Adres email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="phone" className="sr-only">
                Telefon (opcjonalnie)
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="appearance-none rounded-none relative block w-full px-3 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-sm sm:text-base text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-[#005FA6] focus:border-[#005FA6] focus:z-10"
                placeholder="Telefon (opcjonalnie)"
                value={formData.phone}
                onChange={handleChange}
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
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-sm sm:text-base text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-[#005FA6] focus:border-[#005FA6] focus:z-10"
                placeholder="Hasło"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
             <div className="relative block w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800">
               <Select onValueChange={handleRoleChange} defaultValue={formData.role}>
                <SelectTrigger className="w-full border-0 focus:ring-0 rounded-none h-[42px] sm:h-10 text-sm sm:text-base">
                  <SelectValue placeholder="Wybierz rolę" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PARENT">Rodzic</SelectItem>
                  <SelectItem value="TEACHER">Nauczyciel</SelectItem>
                  <SelectItem value="HEADTEACHER">Dyrektor</SelectItem>
                  <SelectItem value="ADMIN">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="secretCode" className="sr-only">
                Kod rejestracyjny
              </label>
              <input
                id="secretCode"
                name="secretCode"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-sm sm:text-base text-gray-900 dark:text-white dark:bg-gray-800 rounded-b-md focus:outline-none focus:ring-[#005FA6] focus:border-[#005FA6] focus:z-10"
                placeholder="Kod rejestracyjny"
                value={formData.secretCode}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2.5 sm:py-2 px-4 border border-transparent text-sm sm:text-base font-medium rounded-md text-white bg-[#005FA6] hover:bg-[#004a85] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#005FA6] disabled:opacity-50 transition-colors"
            >
              {loading ? "Rejestracja..." : "Zarejestruj się"}
            </button>
          </div>
          <div className="text-xs sm:text-sm text-center">
             <span className="text-gray-600 dark:text-gray-400">Masz już konto? </span>
             <Link href="/Login" className="font-medium text-[#005FA6] hover:text-[#005FA6]">
               Zaloguj się
             </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

