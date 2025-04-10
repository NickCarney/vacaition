"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PlaneTakeoff, TreePalmIcon as PalmTree } from "lucide-react";

export default function VacationFinder() {
  const [location, setLocation] = useState("");
  const [transport, setTransport] = useState("");
  const [travelTime, setTravelTime] = useState("");
  const [timeUnit, setTimeUnit] = useState("hours");
  const [activities, setActivities] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [response, setResponse] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    // In a real app, this would trigger a search or API call
    console.log({ location, transport, travelTime, timeUnit, activities });
    const prompt = `Find exactly one vacation spot near ${location} that are accessible by ${transport} that is close to ${travelTime} ${timeUnit} away. The user is interested in activities like ${activities}.`;
    const response = await fetch(`/api/find`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt: prompt }),
    });
    const data = await response.text();
    const extractedText = data.match(/\"([\s\S]*?)\"/)?.[1] || "";
    const formattedText = extractedText.replace(/\\n/g, "\n");
    const formattedText2 = formattedText.replace(/\\/g, "");
    setResponse(formattedText2);
  };

  return (
    <div>
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-t-lg">
          <div className="flex items-center gap-2">
            <PalmTree className="h-6 w-6 text-emerald-600" />
            <CardTitle className="text-2xl text-emerald-700 text-center">
              VacAIton
            </CardTitle>
          </div>
          <CardDescription>
            Find your perfect getaway based on your preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="location">
                  Where are you currently located?
                </Label>
                <Input
                  id="location"
                  placeholder="Enter your current location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="transport">Preferred method of transport</Label>
                <Select value={transport} onValueChange={setTransport} required>
                  <SelectTrigger id="transport">
                    <SelectValue placeholder="Select transport method" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-200">
                    <SelectItem value="air">Air</SelectItem>
                    <SelectItem value="car">Car</SelectItem>
                    <SelectItem value="bike">Bike</SelectItem>
                    <SelectItem value="train">Train</SelectItem>
                    <SelectItem value="cruise">Cruise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="travelTime">Travel time</Label>
                <div className="flex gap-2">
                  <Input
                    id="travelTime"
                    type="number"
                    placeholder="Enter time"
                    className="flex-1"
                    min="1"
                    value={travelTime}
                    onChange={(e) => setTravelTime(e.target.value)}
                    required
                  />
                  <Select value={timeUnit} onValueChange={setTimeUnit}>
                    <SelectTrigger className="w-[110px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutes">Minutes</SelectItem>
                      <SelectItem value="hours">Hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="activities">
                  Activities you would like to have
                </Label>
                <Textarea
                  id="activities"
                  placeholder="E.g., hiking, swimming, sightseeing, local cuisine..."
                  className="min-h-[100px]"
                  value={activities}
                  onChange={(e) => setActivities(e.target.value)}
                  required
                />
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-end bg-gradient-to-r from-emerald-50 to-teal-50 rounded-b-lg">
          <Button
            type="submit"
            onClick={handleSubmit}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <PlaneTakeoff className="mr-2 h-4 w-4" />
            Find Vacations
          </Button>
        </CardFooter>

        {isSubmitted && (
          <div className="p-4 bg-emerald-50 rounded-b-lg border-t border-emerald-100">
            <p className="text-sm text-emerald-700">
              Searching for vacations near <strong>{location}</strong>,
              traveling by <strong>{transport}</strong>, within{" "}
              <strong>
                {travelTime} {timeUnit}
              </strong>
              , with activities like <strong>{activities}</strong>.
            </p>
            <p>{response}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
