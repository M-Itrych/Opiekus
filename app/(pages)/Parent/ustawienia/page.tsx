"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export default function Ustawienia() {
	const [notifications, setNotifications] = useState(true);
	const [isSaved, setIsSaved] = useState(false);

	const handleSaveChanges = () => {
		console.log("Zapisuję ustawienia:", { notifications });

		setIsSaved(true);

		setTimeout(() => {
			setIsSaved(false);
		}, 2000);
	};

	return (
		<>
			<div className="flex flex-col gap-3">
				<div>
					<h1 className="text-2xl font-bold text-gray-800">Ustawienia</h1>
					<p className="text-sm text-gray-600">
						Zarządzaj swoim kontem i preferencjami
					</p>
				</div>
			</div>

			<div className="max-w-4xl space-y-6">
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
					<h2 className="text-xl font-bold text-gray-900 mb-6">Preferencje</h2>
					
					<div className="space-y-6">
						<div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
							<div>
								<p className="text-base font-medium text-gray-900">Powiadomienia</p>
								<p className="text-sm text-gray-600">Otrzymuj powiadomienia o ważnych wydarzeniach</p>
							</div>
							<Switch 
								id="notifications" 
								checked={notifications}
								onCheckedChange={setNotifications}
								className="data-[state=checked]:bg-sky-500 cursor-pointer"
							/>
						</div>
					</div>
				</div>

				<div className="flex justify-end">
					<Button 
						className={`px-6 cursor-pointer text-white transition-colors ${
							isSaved 
								? "bg-green-500 hover:bg-green-600" 
								: "bg-sky-500 hover:bg-sky-600"
						}`}
						onClick={handleSaveChanges}
					>
						{isSaved ? "✓ Zapisano!" : "Zapisz zmiany"}
					</Button>
				</div>
			</div>
		</>
	);
}