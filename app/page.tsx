"use client";

import { useState } from "react";
import VacationFinder from "./components/vacation-finder";
import ActivityFinder from "./components/activity-finder";
import { Button } from "@/components/ui/button";
import { MapPin, PlaneTakeoff } from "lucide-react";

export default function Home() {
  const [activeComponent, setActiveComponent] = useState<
    "vacation" | "activity"
  >("activity");

  return (
    <main className="flex min-h-screen flex-col p-6 sm:p-8 sm:w-[75%] mx-auto bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Toggle Button Section */}
      <div className="flex justify-center mb-8 sticky top-4 z-10">
        <div className="flex bg-white/80 backdrop-blur-sm rounded-xl p-2 shadow-lg border border-gray-200">
          <Button
            onClick={() => setActiveComponent("vacation")}
            variant={activeComponent === "vacation" ? "default" : "ghost"}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-300 ${
              activeComponent === "vacation"
                ? "bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 transform scale-105"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
            }`}
          >
            <PlaneTakeoff className="h-5 w-5" />
            <span className="font-semibold">Find Destinations</span>
          </Button>
          <Button
            onClick={() => setActiveComponent("activity")}
            variant={activeComponent === "activity" ? "default" : "ghost"}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-300 ${
              activeComponent === "activity"
                ? "bg-blue-600 text-white shadow-lg hover:bg-blue-700 transform scale-105"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
            }`}
          >
            <MapPin className="h-5 w-5" />
            <span className="font-semibold">Find Activities</span>
          </Button>
        </div>
      </div>

      {/* Component Display */}
      <div className="flex-1 animate-in fade-in duration-500">
        {activeComponent === "vacation" ? (
          <VacationFinder />
        ) : (
          <ActivityFinder />
        )}
      </div>
    </main>
  );
}
