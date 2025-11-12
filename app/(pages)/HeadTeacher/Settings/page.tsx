"use client";

import React, { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import HeadTeacherLayout from "@/app/components/global/Layout/HeadTeacherLayout";

export default function Ustawienia() {
	const [notifications, setNotifications] = useState(true);
	const [isSaved, setIsSaved] = useState(false);
    const [isError, setIsError] = useState(false);

	const handleSaveChanges = () => {
		console.log("Zapisuję ustawienia:", { notifications });
		

		setIsSaved(true);
		setIsError(false);

		setTimeout(() => {
			setIsSaved(false);
		}, 2000);
	};

	return (
		<HeadTeacherLayout
			title="Ustawienia"
			description="Zarządzaj swoim kontem i preferencjami"
		>
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
								: isError
								? "bg-red-500 hover:bg-red-600"
								: "bg-sky-500 hover:bg-sky-600"
						}`}
						onClick={handleSaveChanges}
					>
						{isSaved ? "Zapisano!" : isError ? "Błąd zapisu danych!" : "Zapisz zmiany"}
					</Button>
				</div>
			</div>
		</HeadTeacherLayout>
	);
}