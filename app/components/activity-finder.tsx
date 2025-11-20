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
  const [travelDistance, setTravelDistance] = useState("");
  const [distanceUnit, setDistanceUnit] = useState("miles");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<
    ActivityRecommendation[]
  >([]);
  const [errors, setErrors] = useState({
    destination: "",
    travelDistance: "",
    activities: "",
  });

  const validateInputs = () => {
    const newErrors = {
      destination: "",
      travelDistance: "",
      activities: "",
    };

    // Validate destination
    if (!destination.trim()) {
      newErrors.destination = "Please enter a destination";
    } else if (destination.trim().length < 2) {
      newErrors.destination = "Destination must be at least 2 characters";
    }

    // Validate travel distance
    const distance = Number(travelDistance);
    if (!travelDistance) {
      newErrors.travelDistance = "Please enter a travel distance";
    } else if (isNaN(distance) || distance <= -1) {
      newErrors.travelDistance = "Distance must be a positive number";
    } else if (distance > 10000) {
      newErrors.travelDistance = "Distance seems too large (max 10,000)";
    }

    // Validate activities
    if (!activities.trim()) {
      newErrors.activities = "Please enter at least one activity";
    } else if (activities.trim().length < 3) {
      newErrors.activities = "Please provide more detail about activities";
    }

    setErrors(newErrors);
    return (
      !newErrors.destination &&
      !newErrors.travelDistance &&
      !newErrors.activities
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateInputs()) {
      return;
    }

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
          travelDistance: travelDistance,
          distanceUnit: distanceUnit,
        }),
      });

      const data = await response.json();
      console.log("Parsed response:", data);

      // Check if the response is an array of recommendations
      if (Array.isArray(data)) {
        setRecommendations(data);
      } else if (data.error) {
        // Handle error response from API
        setRecommendations([
          {
            name: "Error",
            description: data.error,
          },
        ]);
      } else {
        // Unexpected format
        setRecommendations([
          {
            name: "Error",
            description: "Unexpected response format",
          },
        ]);
      }
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
    setErrors({ destination: "", travelDistance: "", activities: "" });
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
          <div className="flex items-center gap-2">
            <MapPin className="h-6 w-6 text-blue-600" />
            <CardTitle className="text-2xl text-blue-700 text-center">
              Vac<span className="text-[#123456] font-serif">AI</span>tion
            </CardTitle>
          </div>
          <CardDescription>
            Discover what to do near you based on your location and interests
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="destination">
                  Where are you currently located?
                </Label>
                <Input
                  id="destination"
                  placeholder="e.g., Washington DC, New York City, Los Angeles..."
                  value={destination}
                  onChange={(e) => {
                    setDestination(e.target.value);
                    if (errors.destination) {
                      setErrors({ ...errors, destination: "" });
                    }
                  }}
                  required
                  className={errors.destination ? "border-red-500" : ""}
                />
                {errors.destination && (
                  <p className="text-sm text-red-600">{errors.destination}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="travelDistance">
                  How far are you willing to travel?
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="travelDistance"
                    type="number"
                    placeholder="Enter distance"
                    className={` ${
                      errors.travelDistance ? "border-red-500" : ""
                    }`}
                    min="1"
                    max="1000"
                    value={travelDistance}
                    onChange={(e) => {
                      setTravelDistance(e.target.value);
                      if (errors.travelDistance) {
                        setErrors({ ...errors, travelDistance: "" });
                      }
                    }}
                    required
                  />
                  <Select value={distanceUnit} onValueChange={setDistanceUnit}>
                    <SelectTrigger className="">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="miles">Miles</SelectItem>
                      <SelectItem value="kilometers">Kilometers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {errors.travelDistance && (
                  <p className="text-sm text-red-600">
                    {errors.travelDistance}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="activities">
                  What activities are you interested in?
                </Label>
                <Textarea
                  id="activities"
                  placeholder="e.g., camping, swimming, hiking, restaurants, museums, nightlife..."
                  className={`min-h-[100px] ${
                    errors.activities ? "border-red-500" : ""
                  }`}
                  value={activities}
                  onChange={(e) => {
                    setActivities(e.target.value);
                    if (errors.activities) {
                      setErrors({ ...errors, activities: "" });
                    }
                  }}
                  required
                />
                {errors.activities && (
                  <p className="text-sm text-red-600">{errors.activities}</p>
                )}
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
            {isLoading ? "Searching..." : "Find Things to Do"}
          </Button>
        </CardFooter>
      </Card>

      {isSubmitted && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-blue-700">
                Recommendations near {destination}
              </CardTitle>
              <CardDescription>
                Places within {travelDistance} {distanceUnit} for {activities}
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
                      <div className="">
                        <h3 className="font-semibold text-lg text-gray-900 mb-2">
                          {rec.name}
                        </h3>
                        <p className="text-gray-700 mb-2">{rec.description}</p>
                        {rec.location && (
                          <div className="flex items-center justify-center flex-wrap text-center">
                            <p className="text-sm text-gray-600">
                              {rec.location}
                            </p>
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
                        )}
                      </div>
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
                Search Again
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
