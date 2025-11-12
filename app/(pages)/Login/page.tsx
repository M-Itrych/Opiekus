"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");

	const arrayOfRoles = [
		{
			role: "admin",
			name: "Admin",
			email: "Admin",
			password: "Admin",
			redirect: "/Admin",
		},
		{
			role: "headteacher",
			name: "Nauczyciel",
			email: "Headteacher",
			password: "Headteacher",
			redirect: "/HeadTeacher",
		},
		{
			role: "parent",
			name: "Opiekun",
			email: "Parent",
			password: "Parent",
			redirect: "/Parent",
		},
		{
			role: "teacher",
			name: "Nauczyciel",
			email: "Teacher",
			password: "Teacher",
			redirect: "/Teacher",
		},
	];

	const router = useRouter();

	const handleLogin = (e: React.FormEvent) => {
		e.preventDefault();
		setError("");


		const user = arrayOfRoles.find(
			(role) => role.email === email && role.password === password
		);

		if (user) {
			router.push(user.redirect);
		} else {
			setError("Nieprawidłowy email lub hasło");
		}
	};

	const NameOfSchool = "Przedszkole nr 14 \"Biały Żagiel\"";

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
			<div className="max-w-md w-full space-y-8">
				<div>
					<h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
						Zaloguj się do swojego konta Opiekuś
					</h2>
					<p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
						{NameOfSchool}
					</p>
				</div>
				<form className="mt-8 space-y-6" onSubmit={handleLogin}>
					{error && (
						<div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
							<p className="text-sm text-red-800 dark:text-red-400">{error}</p>
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
								className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-800 rounded-t-md focus:outline-none focus:ring-[#005FA6] focus:border-[#005FA6] focus:z-10 sm:text-sm"
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
								className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-800 rounded-b-md focus:outline-none focus:ring-[#005FA6] focus:border-[#005FA6] focus:z-10 sm:text-sm"
								placeholder="Podaj hasło"
							/>
						</div>
					</div>

					<div className="flex items-center justify-between">
						<div className="flex items-center">
							<input
								id="remember-me"
								name="remember-me"
								type="checkbox"
								className="h-4 w-4 text-[#005FA6] focus:ring-[#005FA6] border-gray-300 dark:border-gray-600 rounded"
							/>
							<label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-white">
								Zapamiętaj mnie
							</label>
						</div>

						<div className="text-sm">
							<a href="#" className="font-medium text-[#005FA6] hover:text-[#005FA6]">
								Zapomniałeś hasła?
							</a>
						</div>
					</div>

					<div>
						<button
							type="submit"
							className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#005FA6] hover:bg-[#004a85] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#005FA6]"
						>
							Zaloguj się
						</button>
					</div>
					<div>
					</div>
				</form>
			</div>
		</div>
	);
}