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

  const [response, setResponse] = useState("");
  const [directionsResponse, setDirectionsResponse] =
    useState<google.maps.DirectionsResult | null>(null);

  const [destination, setDestination] = useState("Charlotte, NC");
  const [suggestions, setSuggestions] = useState<{ destination: string }[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTimeout(() => {
      console.log("Delayed for 3 second.");
      setIsSubmitted(true);
    }, 3000);

    setLocation(locationRef);
    // In a real app, this would trigger a search or API call
    console.log({ location, transport, travelTime, timeUnit, activities });
    const prompt = `Find exactly one vacation spot (NAME THE CITY, STATE, AND COUNTRY) near ${locationRef} that are accessible by ${transport} that is close to ${travelTime} ${timeUnit} away. The user is interested in activities like ${activities}. Put the destination between triple backticks. put details about this location between double quotes. You have suggested ${JSON.stringify(
      suggestions
    )} already do not suggest these again please.`;
    const response = await fetch(`/api/find`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt: prompt }),
    });
    const data = await response.text();
    console.log(data);
    const extractedText = data.match(/\"([\s\S]*?)\"/)?.[1] || "";
    const formattedText = extractedText.replace(/\\n/g, "\n");
    const formattedText2 = formattedText.replace(/\\/g, "");
    const destinationMatch = formattedText2.match(/```([\s\S]*?)```/);
    setDestination(destinationMatch ? destinationMatch[1].trim() : "");
    setSuggestions([...suggestions, { destination }]);
    const desc = data.split('"')[2];
    setResponse(desc);
    // setResponse(formattedText2);
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
        } else {
          setLocation(destination);
          console.log(`Error fetching directions: ${status}`);
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
    <div className="flex flex-row w-full gap-4">
      <Card className="w-[50%] shadow-lg">
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
                  onChange={(e) => setLocationRef(e.target.value)}
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
          </div>
        )}
      </Card>
      <div className="w-full">
        {isSubmitted && (
          <div>
            <p>
              {destination}
              <br />
              {response}
            </p>
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
          </div>
        )}
        {isSubmitted && (
          <Button onClick={handleSubmit}>Not a fan? Try again!</Button>
        )}
      </div>
    </div>
  );
}
