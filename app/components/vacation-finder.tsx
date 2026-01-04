"use client";

import type React from "react";

import { useState, useEffect } from "react";
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

import { useLoadScript } from "@react-google-maps/api";
import { GoogleMap, DirectionsRenderer } from "@react-google-maps/api";

export default function VacationFinder() {
  const [location, setLocation] = useState("Washington, DC");
  const [locationRef, setLocationRef] = useState("");
  const [transport, setTransport] = useState("");
  const [travelTime, setTravelTime] = useState("");
  const [timeUnit, setTimeUnit] = useState("hours");
  const [activities, setActivities] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [response, setResponse] = useState("");
  const [directionsResponse, setDirectionsResponse] =
    useState<google.maps.DirectionsResult | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const [destination, setDestination] = useState("");
  const [suggestions, setSuggestions] = useState<{ destination: string }[]>([]);
  const [errors, setErrors] = useState({
    location: "",
    transport: "",
    travelTime: "",
    activities: "",
  });

  const validateInputs = () => {
    const newErrors = {
      location: "",
      transport: "",
      travelTime: "",
      activities: "",
    };

    // Validate location
    if (!locationRef.trim()) {
      newErrors.location = "Please enter your location";
    } else if (locationRef.trim().length < 2) {
      newErrors.location = "Location must be at least 2 characters";
    }

    // Validate transport
    if (!transport) {
      newErrors.transport = "Please select a transport method";
    }

    // Validate travel time
    const time = Number(travelTime);
    if (!travelTime) {
      newErrors.travelTime = "Please enter travel time";
    } else if (isNaN(time) || time <= 0) {
      newErrors.travelTime = "Travel time must be a positive number";
    } else if (timeUnit === "minutes" && time > 1440) {
      newErrors.travelTime = "Travel time seems too large (max 24 hours)";
    } else if (timeUnit === "hours" && time > 24) {
      newErrors.travelTime = "Travel time seems too large (max 24 hours)";
    }

    // Validate activities
    if (!activities.trim()) {
      newErrors.activities = "Please enter at least one activity";
    } else if (activities.trim().length < 3) {
      newErrors.activities = "Please provide more detail about activities";
    }

    setErrors(newErrors);
    return (
      !newErrors.location &&
      !newErrors.transport &&
      !newErrors.travelTime &&
      !newErrors.activities
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);
    setIsMapReady(false);
    setTimeout(() => {
      console.log("Delayed for 3 second.");
      setIsSubmitted(true);
    }, 3000);

    setLocation(locationRef);
    console.log({ location, transport, travelTime, timeUnit, activities });

    try {
      const response = await fetch(`/api/find`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          location: locationRef,
          transport: transport,
          travelTime: travelTime,
          timeUnit: timeUnit,
          activities: activities,
          previousSuggestions: suggestions.map((s) => s.destination),
        }),
      });

      const data = await response.json();
      console.log("Parsed response:", data);

      if (data.destination && data.description) {
        setDestination(data.destination);
        setResponse(data.description);
        setSuggestions([...suggestions, { destination: data.destination }]);
      } else if (data.error) {
        setDestination("Error");
        setResponse(data.error);
      } else {
        setDestination("Error");
        setResponse("Unexpected response format");
      }
    } catch (error) {
      console.error("Error fetching vacation:", error);
      setDestination("Error");
      setResponse("Failed to fetch vacation destination. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });
  useEffect(() => {
    if (!isLoaded || !location || !destination || !transport) return;
    if (typeof window === "undefined" || !window.google?.maps) return;

    const directionsService = new window.google.maps.DirectionsService();

    directionsService.route(
      {
        origin: location,
        destination: destination,
        travelMode: getTravelMode(transport),
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirectionsResponse(result);
          setIsMapReady(true);
        } else {
          setLocation(destination);
          console.log(`Error fetching directions: ${status}`);
          setIsMapReady(true);
        }
      }
    );
  }, [isLoaded, isSubmitted, location, destination, transport]);

  if (loadError) {
    return <div>Error loading Google Maps</div>;
  }

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  function getTravelMode(transport: string): google.maps.TravelMode {
    switch (transport) {
      case "DRIVING":
        return window.google.maps.TravelMode.DRIVING;
      case "BICYCLING":
        return window.google.maps.TravelMode.BICYCLING;
      case "TRANSIT":
        return window.google.maps.TravelMode.TRANSIT;
      case "WALKING":
        return window.google.maps.TravelMode.WALKING;
      default:
        return window.google.maps.TravelMode.DRIVING; // Default to DRIVING
    }
  }

  return (
    <div className="flex sm:flex-row flex-col w-full gap-6 justify-center">
      <Card className="sm:w-full shadow-xl hover:shadow-2xl transition-shadow duration-300 border-0">
        <CardHeader className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 rounded-t-lg">
          <div className="flex items-center gap-2 justify-center">
            <PalmTree className="h-7 w-7 text-emerald-600" />
            <CardTitle className="text-3xl text-emerald-700">
              Vac<span className="text-[#123456] font-serif">AI</span>tion
            </CardTitle>
          </div>
          <CardDescription className="text-center text-base mt-2">
            Find your perfect getaway based on your preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 pb-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="location"
                  className="text-sm font-semibold text-gray-700"
                >
                  Where are you currently located?
                </Label>
                <Input
                  id="location"
                  placeholder="e.g., New York City, Los Angeles, Chicago..."
                  value={locationRef}
                  onChange={(e) => {
                    setLocationRef(e.target.value);
                    if (errors.location) {
                      setErrors({ ...errors, location: "" });
                    }
                  }}
                  required
                  className={`transition-all duration-200 ${
                    errors.location
                      ? "border-red-500 focus-visible:ring-red-500"
                      : "focus-visible:ring-emerald-500"
                  }`}
                />
                {errors.location && (
                  <p className="text-sm text-red-600">{errors.location}</p>
                )}
              </div>

              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="transport"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Preferred method of transport
                    </Label>
                    <Select
                      value={transport}
                      onValueChange={(value) => {
                        setTransport(value);
                        if (errors.transport) {
                          setErrors({ ...errors, transport: "" });
                        }
                      }}
                      required
                    >
                      <SelectTrigger
                        id="transport"
                        className={`w-full transition-all duration-200 ${
                          errors.transport
                            ? "border-red-500 focus:ring-red-500"
                            : "focus:ring-emerald-500"
                        }`}
                      >
                        <SelectValue placeholder="Select transport method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="air">Air</SelectItem>
                        <SelectItem value="car">Car</SelectItem>
                        <SelectItem value="bike">Bike</SelectItem>
                        <SelectItem value="train">Train</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.transport && (
                      <p className="text-sm text-red-600">{errors.transport}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="travelTime"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Travel time
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="travelTime"
                        type="number"
                        placeholder="Enter time"
                        className={`flex-1 transition-all duration-200 ${
                          errors.travelTime
                            ? "border-red-500 focus-visible:ring-red-500"
                            : "focus-visible:ring-emerald-500"
                        }`}
                        min="1"
                        max={timeUnit === "hours" ? "24" : "1440"}
                        value={travelTime}
                        onChange={(e) => {
                          setTravelTime(e.target.value);
                          if (errors.travelTime) {
                            setErrors({ ...errors, travelTime: "" });
                          }
                        }}
                        required
                      />
                      <Select value={timeUnit} onValueChange={setTimeUnit}>
                        <SelectTrigger className="w-[120px] transition-all duration-200 focus:ring-emerald-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minutes">Minutes</SelectItem>
                          <SelectItem value="hours">Hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {errors.travelTime && (
                      <p className="text-sm text-red-600">
                        {errors.travelTime}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="activities"
                  className="text-sm font-semibold text-gray-700"
                >
                  Activities you would like to have
                </Label>
                <Textarea
                  id="activities"
                  placeholder="E.g., hiking, swimming, sightseeing, local cuisine, nightlife, museums..."
                  className={`min-h-[100px] transition-all duration-200 resize-none ${
                    errors.activities
                      ? "border-red-500 focus-visible:ring-red-500"
                      : "focus-visible:ring-emerald-500"
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
        <CardFooter className="flex justify-between items-center bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 rounded-b-lg">
          {isSubmitted && (
            <p className="text-xs text-emerald-600 font-medium">
              {suggestions.length}{" "}
              {suggestions.length === 1 ? "suggestion" : "suggestions"} found
            </p>
          )}
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 ml-auto shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Searching...
              </>
            ) : (
              <>
                <PlaneTakeoff className="mr-2 h-4 w-4" />
                Find Vacations
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {isSubmitted && (
        <Card className="w-full shadow-lg animate-in fade-in duration-500">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
            <CardTitle className="text-2xl text-emerald-700 flex items-center gap-2">
              <PalmTree className="h-6 w-6" />
              {destination}
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {response}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {!isMapReady && (
              <div className="flex flex-col items-center justify-center w-full h-[500px] bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
                <p className="text-gray-600 font-medium">
                  Loading your route...
                </p>
              </div>
            )}
            {isMapReady && (
              <div className="rounded-b-lg overflow-hidden">
                <GoogleMap
                  mapContainerStyle={{ width: "100%", height: "500px" }}
                  options={{
                    draggable: true,
                    scrollwheel: true,
                    disableDefaultUI: false,
                    styles: [
                      {
                        featureType: "poi",
                        elementType: "labels",
                        stylers: [{ visibility: "off" }],
                      },
                    ],
                  }}
                >
                  {directionsResponse && (
                    <DirectionsRenderer directions={directionsResponse} />
                  )}
                </GoogleMap>
              </div>
            )}
          </CardContent>
          <CardFooter className="bg-gradient-to-r from-emerald-50 to-teal-50">
            <Button
              onClick={handleSubmit}
              variant="outline"
              className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 transition-all"
            >
              Not a fan? Try again!
            </Button>
          </CardFooter>
        </Card>
      )}
      {/* {isSubmitted && (
          <Button onClick={handleSubmit}>Not a fan? Try again!</Button>
        )} */}
    </div>
  );
}
