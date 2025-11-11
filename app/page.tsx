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
    <main className="flex min-h-screen flex-col p-4 sm:w-[70%] sm:justify-center">
      {/* Toggle Button Section */}
      <div className="flex justify-center mb-6">
        <div className="flex bg-gray-100 rounded-lg p-1 shadow-sm">
          <Button
            onClick={() => setActiveComponent("vacation")}
            variant={activeComponent === "vacation" ? "default" : "ghost"}
            className={`flex items-center gap-2 px-6 py-3 transition-all ${
              activeComponent === "vacation"
                ? "bg-emerald-600 text-white shadow-md hover:bg-emerald-700"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-200"
            }`}
          >
            <PlaneTakeoff className="h-4 w-4" />
            Find Destinations
          </Button>
          <Button
            onClick={() => setActiveComponent("activity")}
            variant={activeComponent === "activity" ? "default" : "ghost"}
            className={`flex items-center gap-2 px-6 py-3 transition-all ${
              activeComponent === "activity"
                ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-200"
            }`}
          >
            <MapPin className="h-4 w-4" />
            Find Activities
          </Button>
        </div>
      </div>

      {/* Component Display */}
      <div className="flex-1">
        {activeComponent === "vacation" ? (
          <VacationFinder />
        ) : (
          <ActivityFinder />
        )}
      </div>
    </main>
  );
}
