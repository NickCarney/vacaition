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
import { Textarea } from "@/components/ui/textarea";
import { MapPin, ExternalLink, Search } from "lucide-react";

interface ActivityRecommendation {
  name: string;
  description: string;
  website?: string;
  location?: string;
}

export default function ActivityFinder() {
  const [destination, setDestination] = useState("");
  const [activities, setActivities] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<
    ActivityRecommendation[]
  >([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/activities`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          destination: destination,
          activities: activities,
        }),
      });

      const data = await response.text();
      console.log("Raw response:", data);

      // Try to extract JSON from the response
      let parsedRecommendations: ActivityRecommendation[] = [];
      try {
        // Look for JSON array in the response
        const jsonMatch = data.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          parsedRecommendations = JSON.parse(jsonMatch[0]);
        } else {
          // If no JSON found, parse as text and create manual structure
          const lines = data.split("\n").filter((line) => line.trim());
          parsedRecommendations = lines.slice(0, 5).map((line, index) => ({
            name: `Recommendation ${index + 1}`,
            description: line.trim(),
          }));
        }
      } catch (parseError) {
        console.error("JSON parsing failed:", parseError);
        // Fallback: split response into recommendations
        const lines = data.split("\n").filter((line) => line.trim());
        parsedRecommendations = lines.slice(0, 5).map((line, index) => ({
          name: `Activity Option ${index + 1}`,
          description: line.trim(),
        }));
      }

      setRecommendations(parsedRecommendations);
      setIsSubmitted(true);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      setRecommendations([
        {
          name: "Error",
          description:
            "Sorry, we couldn't fetch recommendations at this time. Please try again.",
        },
      ]);
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTryAgain = () => {
    setIsSubmitted(false);
    setRecommendations([]);
  };

  return (
    <div className="flex flex-col w-full gap-4">
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
          <div className="flex items-center gap-2">
            <MapPin className="h-6 w-6 text-blue-600" />
            <CardTitle className="text-2xl text-blue-700 text-center">
              Vac<span className="text-[#123456] font-serif">AI</span>tion
            </CardTitle>
          </div>
          <CardDescription>
            Get specific activity recommendations for your destination
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="destination">
                  Where are you planning to visit?
                </Label>
                <Input
                  id="destination"
                  placeholder="e.g., Yellowstone National Park, New York City, Paris..."
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="activities">
                  What activities are you interested in?
                </Label>
                <Textarea
                  id="activities"
                  placeholder="e.g., camping, swimming, hiking, restaurants, museums, nightlife..."
                  className="min-h-[100px]"
                  value={activities}
                  onChange={(e) => setActivities(e.target.value)}
                  required
                />
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-end bg-gradient-to-r from-blue-50 to-indigo-50 rounded-b-lg">
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            <Search className="mr-2 h-4 w-4" />
            {isLoading ? "Searching..." : "Find Activities"}
          </Button>
        </CardFooter>
      </Card>

      {isSubmitted && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-blue-700">
                Recommendations for {destination}
              </CardTitle>
              <CardDescription>
                Here are specific places and activities for {activities}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 mb-2">
                          {rec.name}
                        </h3>
                        <p className="text-gray-700 mb-2">{rec.description}</p>
                        {rec.location && (
                          <p className="text-sm text-gray-600 mb-2">
                            📍 {rec.location}
                          </p>
                        )}
                      </div>
                      {rec.website && (
                        <a
                          href={rec.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-4 flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Visit Website
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleTryAgain}
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                Try Different Activities
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
