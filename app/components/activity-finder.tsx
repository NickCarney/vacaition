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
import { MapPin, ExternalLink, Search } from "lucide-react";

import { useLoadScript } from "@react-google-maps/api";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";

interface ActivityRecommendation {
  name: string;
  description: string;
  website?: string;
  location?: string;
}

interface MarkerData {
  position: google.maps.LatLngLiteral;
  name: string;
  description: string;
  website?: string;
  location?: string;
  isOrigin?: boolean;
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

  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral | null>(
    null
  );
  const [isMapReady, setIsMapReady] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);

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

  // Effect to geocode all activities and the starting location
  useEffect(() => {
    if (!isLoaded || !isSubmitted || recommendations.length === 0) return;

    const geocodeActivities = async () => {
      setIsMapReady(false);
      const newMarkers: MarkerData[] = [];

      // Geocode the starting location (destination)
      const originCoords = await geocodeAddress(destination);
      if (originCoords) {
        newMarkers.push({
          position: originCoords,
          name: destination,
          description: "Your starting location",
          isOrigin: true,
        });
        setMapCenter(originCoords);
      }

      // Geocode all activity locations
      for (const rec of recommendations) {
        if (rec.location) {
          const coords = await geocodeAddress(rec.location);
          if (coords) {
            newMarkers.push({
              position: coords,
              name: rec.name,
              description: rec.description,
              website: rec.website,
              location: rec.location,
              isOrigin: false,
            });
          }
        }
      }

      setMarkers(newMarkers);
      setIsMapReady(true);
    };

    geocodeActivities();
  }, [isLoaded, isSubmitted, recommendations, destination]);

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
    } catch {
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
    setMarkers([]);
    setSelectedMarker(null);
    setMapCenter(null);
    setIsMapReady(false);
    mapRef.current = null;
  };

  if (loadError) {
    return <div>Error loading Google Maps</div>;
  }

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300 border-0">
        <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 rounded-t-lg">
          <div className="flex items-center gap-2 justify-center">
            <MapPin className="h-7 w-7 text-blue-600" />
            <CardTitle className="text-3xl text-blue-700">
              Vac<span className="text-[#123456] font-serif">AI</span>tion
            </CardTitle>
          </div>
          <CardDescription className="text-center text-base mt-2">
            Discover what to do near you based on your location and interests
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 pb-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="destination"
                  className="text-sm font-semibold text-gray-700"
                >
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
                  className={`transition-all duration-200 ${
                    errors.destination
                      ? "border-red-500 focus-visible:ring-red-500"
                      : "focus-visible:ring-blue-500"
                  }`}
                />
                {errors.destination && (
                  <p className="text-sm text-red-600">{errors.destination}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="travelDistance"
                  className="text-sm font-semibold text-gray-700"
                >
                  How far are you willing to travel?
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="travelDistance"
                    type="number"
                    placeholder="Enter distance"
                    className={`flex-1 transition-all duration-200 ${
                      errors.travelDistance
                        ? "border-red-500 focus-visible:ring-red-500"
                        : "focus-visible:ring-blue-500"
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
                    <SelectTrigger className="w-[140px] transition-all duration-200 focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="miles">Miles</SelectItem>
                      <SelectItem value="kilometers">Kilometers</SelectItem>
                      <SelectItem value="minutes">Minutes</SelectItem>
                      <SelectItem value="hours">Hours</SelectItem>
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
                <Label
                  htmlFor="activities"
                  className="text-sm font-semibold text-gray-700"
                >
                  What activities are you interested in?
                </Label>
                <Textarea
                  id="activities"
                  placeholder="e.g., camping, swimming, hiking, restaurants, museums, nightlife, wine tasting..."
                  className={`min-h-[100px] transition-all duration-200 resize-none ${
                    errors.activities
                      ? "border-red-500 focus-visible:ring-red-500"
                      : "focus-visible:ring-blue-500"
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
          {/* Map Component */}
          {markers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-blue-700">
                  Activity Map
                </CardTitle>
                <CardDescription>
                  Locations of activities near {destination}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!isMapReady && (
                  <div className="flex items-center justify-center w-full h-[500px] bg-gray-100 rounded-lg">
                    <p className="text-gray-600">Loading map...</p>
                  </div>
                )}
                {isMapReady && mapCenter && (
                  <GoogleMap
                    center={mapCenter}
                    zoom={11}
                    mapContainerStyle={{ width: "100%", height: "500px" }}
                    options={{
                      draggable: true,
                      scrollwheel: true,
                      disableDefaultUI: false,
                    }}
                    onLoad={(map) => {
                      mapRef.current = map;
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
                                url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
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
                          <p className="text-sm text-gray-700 mb-1">
                            {selectedMarker.description}
                          </p>
                          {selectedMarker.location && (
                            <p className="text-xs text-gray-600 mb-1">
                              {selectedMarker.location}
                            </p>
                          )}
                          {selectedMarker.website && (
                            <a
                              href={selectedMarker.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              Visit Website
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </InfoWindow>
                    )}
                  </GoogleMap>
                )}
              </CardContent>
            </Card>
          )}
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
