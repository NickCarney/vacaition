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
    <div className="flex sm:flex-row flex-col w-full gap-4 justify-center">
      <Card className="sm:w-full shadow-lg">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-t-lg">
          <div className="flex items-center gap-2">
            <PalmTree className="h-6 w-6 text-emerald-600" />
            <CardTitle className="text-2xl text-emerald-700 text-center">
              Vac<span className="text-[#123456] font-serif">AI</span>tion
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
                  value={locationRef}
                  onChange={(e) => {
                    setLocationRef(e.target.value);
                    if (errors.location) {
                      setErrors({ ...errors, location: "" });
                    }
                  }}
                  required
                  className={errors.location ? "border-red-500" : ""}
                />
                {errors.location && (
                  <p className="text-sm text-red-600">{errors.location}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="transport">
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
                        className={`w-fit ${
                          errors.transport ? "border-red-500" : ""
                        }`}
                      >
                        <SelectValue placeholder="Select transport method" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-200">
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
                    <Label htmlFor="travelTime">Travel time</Label>
                    <div className="flex gap-2">
                      <Input
                        id="travelTime"
                        type="number"
                        placeholder="Enter time"
                        className={`w-[120px] ${
                          errors.travelTime ? "border-red-500" : ""
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
                        <SelectTrigger className="w-[110px]">
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
                <Label htmlFor="activities">
                  Activities you would like to have
                </Label>
                <Textarea
                  id="activities"
                  placeholder="E.g., hiking, swimming, sightseeing, local cuisine..."
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
        <CardFooter className="flex justify-end bg-gradient-to-r from-emerald-50 to-teal-50 rounded-b-lg">
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
          >
            <PlaneTakeoff className="mr-2 h-4 w-4" />
            {isLoading ? "Searching..." : "Find Vacations"}
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
          </div>
        )}
      </Card>

      {isSubmitted && (
        <div className="w-full">
          <div>
            <p>
              {destination}
              <br />
              {response}
            </p>
            {!isMapReady && (
              <div className="flex items-center justify-center w-full h-[500px] bg-gray-100 rounded-lg">
                <p className="text-gray-600">Loading map...</p>
              </div>
            )}
            {isMapReady && (
              <GoogleMap
                // center={{ lat: 40.7128, lng: -74.006 }}
                // zoom={10}
                mapContainerStyle={{ width: "100%", height: "500px" }}
                options={{
                  draggable: true,
                  scrollwheel: true,
                  disableDefaultUI: false,
                }}
              >
                {directionsResponse && (
                  <DirectionsRenderer directions={directionsResponse} />
                )}
              </GoogleMap>
            )}
          </div>
        </div>
      )}
      {/* {isSubmitted && (
          <Button onClick={handleSubmit}>Not a fan? Try again!</Button>
        )} */}
    </div>
  );
}
