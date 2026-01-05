"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
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
import {
  PlaneTakeoff,
  TreePalmIcon as PalmTree,
  Navigation,
} from "lucide-react";

import { useLoadScript } from "@react-google-maps/api";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";

interface Activity {
  name: string;
  location: string;
  description: string;
}

interface VacationSuggestion {
  destination: string;
  description: string;
  activities: Activity[];
}

interface MarkerData {
  position: google.maps.LatLngLiteral;
  name: string;
  description: string;
  isOrigin?: boolean;
}

export default function VacationFinder() {
  const [location, setLocation] = useState("Washington, DC");
  const [locationRef, setLocationRef] = useState("");
  const [transport, setTransport] = useState("");
  const [travelTime, setTravelTime] = useState("");
  const [timeUnit, setTimeUnit] = useState("hours");
  const [activities, setActivities] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [vacationSuggestions, setVacationSuggestions] = useState<
    VacationSuggestion[]
  >([]);
  const [streamingVacations, setStreamingVacations] = useState<string[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral | null>(
    null
  );
  const mapRef = useRef<google.maps.Map | null>(null);
  const [errors, setErrors] = useState({
    location: "",
    transport: "",
    travelTime: "",
    activities: "",
  });
  const [showMapPicker, setShowMapPicker] = useState<string | null>(null);

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
    setLocation(locationRef);
    setVacationSuggestions([]);
    setStreamingVacations([]);
    setMarkers([]);
    setIsSubmitted(true);

    const newSuggestions: VacationSuggestion[] = [];
    const previousDestinations = vacationSuggestions.map((s) => s.destination);

    try {
      // Fetch 3 vacation suggestions with streaming
      for (let i = 0; i < 3; i++) {
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
            previousSuggestions: [
              ...previousDestinations,
              ...newSuggestions.map((s) => s.destination),
            ],
          }),
        });

        if (!response.ok || !response.body) {
          throw new Error("Failed to fetch vacation");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        // Add a placeholder for this streaming vacation
        setStreamingVacations((prev) => [...prev, ""]);
        const currentIndex = i;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          // Update the streaming text
          setStreamingVacations((prev) => {
            const updated = [...prev];
            updated[currentIndex] = buffer;
            return updated;
          });
        }

        // Try to parse the complete JSON
        try {
          // Try to extract JSON from the buffer
          let jsonString = buffer.trim();

          // Look for JSON object in the response
          const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            jsonString = jsonMatch[0];
          }

          const data = JSON.parse(jsonString);

          if (data.destination && data.description) {
            const newSuggestion = {
              destination: data.destination,
              description: data.description,
              activities: data.activities || [],
            };
            newSuggestions.push(newSuggestion);
            setVacationSuggestions([...newSuggestions]);

            // Remove from streaming once added to suggestions
            setStreamingVacations((prev) => {
              const updated = [...prev];
              updated[currentIndex] = "";
              return updated;
            });
          }
        } catch (parseError) {
          console.error("Failed to parse vacation:", parseError, buffer);
        }
      }
    } catch (error) {
      console.error("Error fetching vacations:", error);
      setVacationSuggestions([
        {
          destination: "Error",
          description:
            "Failed to fetch vacation destinations. Please try again.",
          activities: [],
        },
      ]);
    } finally {
      setIsLoading(false);
      setStreamingVacations([]);
    }
  };

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });
  // Geocode an address to get lat/lng
  const geocodeAddress = async (
    address: string
  ): Promise<google.maps.LatLngLiteral | null> => {
    if (!window.google?.maps) return null;

    const geocoder = new window.google.maps.Geocoder();
    return new Promise((resolve) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          const location = results[0].geometry.location;
          resolve({ lat: location.lat(), lng: location.lng() });
        } else {
          resolve(null);
        }
      });
    });
  };

  // Open directions in maps app
  const openDirections = (destination: string, provider: string) => {
    const encodedOrigin = encodeURIComponent(location);
    const encodedDestination = encodeURIComponent(destination);

    let mapsUrl = '';

    switch (provider) {
      case 'google':
        mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodedOrigin}&destination=${encodedDestination}`;
        break;
      case 'apple':
        mapsUrl = `http://maps.apple.com/?saddr=${encodedOrigin}&daddr=${encodedDestination}`;
        break;
      case 'waze':
        mapsUrl = `https://waze.com/ul?q=${encodedDestination}&navigate=yes`;
        break;
      case 'citymapper':
        mapsUrl = `https://citymapper.com/directions?endcoord=&endname=${encodedDestination}&startcoord=&startname=${encodedOrigin}`;
        break;
      default:
        mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodedOrigin}&destination=${encodedDestination}`;
    }

    window.open(mapsUrl, "_blank");
    setShowMapPicker(null);
  };

  // Effect to geocode starting location when first submitted
  useEffect(() => {
    if (!isLoaded || !isSubmitted || !location) return;

    const geocodeOrigin = async () => {
      const originCoords = await geocodeAddress(location);
      if (originCoords) {
        setMarkers([{
          position: originCoords,
          name: location,
          description: "Your starting location",
          isOrigin: true,
        }]);
        setMapCenter(originCoords);
        setIsMapReady(true);
      }
    };

    geocodeOrigin();
  }, [isLoaded, isSubmitted, location]);

  // Effect to geocode each vacation as it's added
  useEffect(() => {
    if (!isLoaded || !isSubmitted || vacationSuggestions.length === 0) return;

    const geocodeLatestVacation = async () => {
      const latestVacation = vacationSuggestions[vacationSuggestions.length - 1];
      const coords = await geocodeAddress(latestVacation.destination);

      if (coords) {
        setMarkers((prevMarkers) => [
          ...prevMarkers,
          {
            position: coords,
            name: latestVacation.destination,
            description: latestVacation.description,
            isOrigin: false,
          },
        ]);
      }
    };

    geocodeLatestVacation();
  }, [isLoaded, isSubmitted, vacationSuggestions]);

  // Auto-zoom map to fit all markers
  useEffect(() => {
    if (!mapRef.current || markers.length === 0) return;

    const bounds = new window.google.maps.LatLngBounds();
    markers.forEach((marker) => {
      bounds.extend(marker.position);
    });

    mapRef.current.fitBounds(bounds);

    // Add padding around the bounds
    const padding = { top: 50, right: 50, bottom: 50, left: 50 };
    mapRef.current.fitBounds(bounds, padding);
  }, [markers]);

  if (loadError) {
    return <div>Error loading Google Maps</div>;
  }

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Section: Form (left) and Map (right) */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Form Card */}
        <Card className="lg:w-full shadow-xl hover:shadow-2xl transition-shadow duration-300 border-0">
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
                          <SelectItem value="walk">Walk</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.transport && (
                        <p className="text-sm text-red-600">
                          {errors.transport}
                        </p>
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
            {isSubmitted && vacationSuggestions.length > 0 && (
              <p className="text-xs text-emerald-600 font-medium">
                {vacationSuggestions.length} vacation{" "}
                {vacationSuggestions.length === 1 ? "option" : "options"} found
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
                  Searching for 3 destinations...
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

        {/* Map Card */}
        {isSubmitted && markers.length > 0 && (
          <Card className="lg:w-1/2 shadow-xl border-0 animate-in fade-in duration-500">
            <CardHeader className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50">
              <CardTitle className="text-2xl text-emerald-700 flex items-center gap-2">
                <PalmTree className="h-6 w-6" />
                Vacation Destinations
              </CardTitle>
              <CardDescription className="text-base">
                Explore {vacationSuggestions.length} vacation options from{" "}
                {location}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {!isMapReady && (
                <div className="flex flex-col items-center justify-center w-full h-[500px] bg-gradient-to-br from-gray-50 to-gray-100">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
                  <p className="text-gray-600 font-medium">Loading map...</p>
                </div>
              )}
              {isMapReady && mapCenter && (
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
                    onLoad={(map) => {
                      mapRef.current = map;
                      // Fit bounds immediately after map loads
                      if (markers.length > 0) {
                        const bounds = new window.google.maps.LatLngBounds();
                        markers.forEach((marker) => {
                          bounds.extend(marker.position);
                        });
                        map.fitBounds(bounds);
                      }
                    }}
                  >
                    {markers.map((marker, index) => (
                      <Marker
                        key={`${marker.name}-${index}`}
                        position={marker.position}
                        title={marker.name}
                        icon={
                          marker.isOrigin
                            ? {
                                url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                              }
                            : {
                                url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
                              }
                        }
                        onClick={() => setSelectedMarker(marker)}
                        onMouseOver={() => setSelectedMarker(marker)}
                      />
                    ))}

                    {selectedMarker && (
                      <InfoWindow
                        position={selectedMarker.position}
                        onCloseClick={() => setSelectedMarker(null)}
                        options={{
                          pixelOffset: new window.google.maps.Size(0, -30),
                        }}
                      >
                        <div className="p-2 max-w-xs">
                          <h3 className="font-semibold text-base mb-1">
                            {selectedMarker.name}
                          </h3>
                          <p className="text-sm text-gray-700">
                            {selectedMarker.description}
                          </p>
                        </div>
                      </InfoWindow>
                    )}
                  </GoogleMap>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottom Section: Vacation Descriptions (Full Width) */}
      {isSubmitted && vacationSuggestions.length > 0 && (
        <Card className="shadow-xl border-0 animate-in fade-in duration-500">
          <CardHeader className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50">
            <CardTitle className="text-2xl text-emerald-700">
              Vacation Options
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {vacationSuggestions.length} destinations perfect for your trip
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Show streaming vacations */}
              {streamingVacations.map((streamText, index) => (
                streamText && (
                  <div
                    key={`streaming-${index}`}
                    className="p-6 border-2 border-emerald-300 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 animate-pulse"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                      <h3 className="font-bold text-lg text-emerald-700">
                        Loading destination {index + 1}...
                      </h3>
                    </div>
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                      {streamText}
                    </pre>
                  </div>
                )
              ))}

              {/* Show completed vacations */}
              {vacationSuggestions.map((vacation, index) => (
                <div
                  key={index}
                  className="group p-6 border-2 border-gray-100 rounded-xl bg-gradient-to-br from-white to-gray-50 hover:from-emerald-50 hover:to-teal-50 hover:border-emerald-200 transition-all duration-300 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="font-bold text-xl text-gray-900 group-hover:text-emerald-700 transition-colors flex items-center gap-2">
                      <PalmTree className="h-5 w-5" />
                      {vacation.destination}
                    </h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {vacation.description}
                  </p>
                  <div className="mb-4">
                    {showMapPicker === `vacation-${index}` ? (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Choose your maps app:</p>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            onClick={() => openDirections(vacation.destination, 'google')}
                            size="sm"
                            variant="outline"
                            className="border-emerald-600 text-emerald-600 hover:bg-emerald-100"
                          >
                            Google Maps
                          </Button>
                          <Button
                            onClick={() => openDirections(vacation.destination, 'apple')}
                            size="sm"
                            variant="outline"
                            className="border-emerald-600 text-emerald-600 hover:bg-emerald-100"
                          >
                            Apple Maps
                          </Button>
                          <Button
                            onClick={() => openDirections(vacation.destination, 'waze')}
                            size="sm"
                            variant="outline"
                            className="border-emerald-600 text-emerald-600 hover:bg-emerald-100"
                          >
                            Waze
                          </Button>
                          <Button
                            onClick={() => openDirections(vacation.destination, 'citymapper')}
                            size="sm"
                            variant="outline"
                            className="border-emerald-600 text-emerald-600 hover:bg-emerald-100"
                          >
                            Citymapper
                          </Button>
                          <Button
                            onClick={() => setShowMapPicker(null)}
                            size="sm"
                            variant="outline"
                            className="border-gray-400 text-gray-600 hover:bg-gray-100"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setShowMapPicker(`vacation-${index}`)}
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-300 flex-shrink-0"
                      >
                        <Navigation className="h-4 w-4 mr-1" />
                        Directions
                      </Button>
                    )}
                  </div>

                  {vacation.activities && vacation.activities.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="font-semibold text-sm text-gray-900 mb-3 uppercase tracking-wide">
                        Activities & Attractions
                      </h4>
                      <div className="space-y-3">
                        {vacation.activities.map((activity, actIndex) => (
                          <div
                            key={actIndex}
                            className="p-3 bg-white rounded-lg border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all duration-200"
                          >
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex-1 min-w-0">
                                <h5 className="font-semibold text-sm text-gray-900 mb-1">
                                  {activity.name}
                                </h5>
                                <p className="text-xs text-gray-600 mb-1">
                                  {activity.location}
                                </p>
                                <p className="text-sm text-gray-700">
                                  {activity.description}
                                </p>
                              </div>
                            </div>
                            {showMapPicker === `activity-${index}-${actIndex}` ? (
                              <div className="space-y-2">
                                <p className="text-xs font-semibold text-gray-700 mb-2">Choose your maps app:</p>
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    onClick={() => openDirections(activity.location, 'google')}
                                    size="sm"
                                    variant="outline"
                                    className="border-emerald-600 text-emerald-600 hover:bg-emerald-100 text-xs"
                                  >
                                    Google Maps
                                  </Button>
                                  <Button
                                    onClick={() => openDirections(activity.location, 'apple')}
                                    size="sm"
                                    variant="outline"
                                    className="border-emerald-600 text-emerald-600 hover:bg-emerald-100 text-xs"
                                  >
                                    Apple Maps
                                  </Button>
                                  <Button
                                    onClick={() => openDirections(activity.location, 'waze')}
                                    size="sm"
                                    variant="outline"
                                    className="border-emerald-600 text-emerald-600 hover:bg-emerald-100 text-xs"
                                  >
                                    Waze
                                  </Button>
                                  <Button
                                    onClick={() => openDirections(activity.location, 'citymapper')}
                                    size="sm"
                                    variant="outline"
                                    className="border-emerald-600 text-emerald-600 hover:bg-emerald-100 text-xs"
                                  >
                                    Citymapper
                                  </Button>
                                  <Button
                                    onClick={() => setShowMapPicker(null)}
                                    size="sm"
                                    variant="outline"
                                    className="border-gray-400 text-gray-600 hover:bg-gray-100 text-xs"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button
                                onClick={() => setShowMapPicker(`activity-${index}-${actIndex}`)}
                                size="sm"
                                variant="outline"
                                className="border-emerald-600 text-emerald-600 hover:bg-emerald-100 transition-all duration-200"
                              >
                                <Navigation className="h-3 w-3 mr-1" />
                                Directions
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50">
            <Button
              onClick={handleSubmit}
              variant="outline"
              className="border-emerald-600 text-emerald-600 hover:bg-emerald-100 transition-all duration-300"
            >
              Not a fan? Get 3 more!
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
