// src/components/ActivityForm.jsx
import React, { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { useAuth } from "../context/AuthContext";
import { apiSubmitActivity } from "../services/api";

const ACTIVITY_TYPES = ["Running", "Walking", "Cycling", "Swimming", "Steps", "Hiking", "Other"];

const POPULAR_LOCATIONS = [
  "Ngong Hills",
  "Mt. Longonot",
  "Mt. Kenya",
  "Karura Forest",
  "Aberdare Ranges",
  "Hell's Gate",
  "City Park",
  "Uhuru Park",
  "Other"
];

// datetime-local needs local wall-clock time; toISOString() alone would be UTC.
function localDateTimeValue() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

function parseNumber(value) {
  return value === "" ? NaN : Number(value);
}

// Limits mirror validateActivity on the server.
function getNumberError(distanceKm, durationMin, elevation) {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0 || distanceKm > 1000) {
    return "Enter a distance between 0.01 and 1000 km.";
  }
  if (!Number.isInteger(durationMin) || durationMin <= 0 || durationMin > 1440) {
    return "Enter whole minutes between 1 and 1440.";
  }
  if (!Number.isInteger(elevation) || elevation < 0 || elevation > 100000) {
    return "Elevation gain must be whole meters, 0 or more.";
  }
  return null;
}

function serverErrorDetail(err) {
  try {
    return JSON.parse(err.message).details;
  } catch {
    return undefined;
  }
}

export default function ActivityForm({ onActivityAdded }) {
  const { user, session } = useAuth();
  const [type, setType] = useState(ACTIVITY_TYPES[0]);
  const [customType, setCustomType] = useState("");
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [date, setDate] = useState(localDateTimeValue());
  const [location, setLocation] = useState("");
  const [customLocation, setCustomLocation] = useState("");
  const [elevationGain, setElevationGain] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !session?.accessToken) {
      toast({
        title: "Please log in to submit an activity.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const activityDate = new Date(date);
    if (Number.isNaN(activityDate.getTime()) || activityDate.getTime() > Date.now() + 60 * 1000) {
      toast({
        title: "Choose a date and time that is not in the future.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const distanceKm = parseNumber(distance);
    const durationMin = parseNumber(duration);
    const elevation = elevationGain === "" ? 0 : parseNumber(elevationGain);
    const numberError = getNumberError(distanceKm, durationMin, elevation);

    if (numberError) {
      toast({
        title: numberError,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const finalType = type === "Other" ? customType.trim() : type;
    if (!finalType) {
      toast({
        title: "Please enter a custom activity name.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);

    try {
      const finalLocation = location === "Other" ? customLocation.trim() : location;
      
      await apiSubmitActivity(session.accessToken, {
        type: finalType,
        distance_km: distanceKm,
        duration_min: durationMin,
        date: activityDate.toISOString(),
        location: finalLocation || null,
        elevation_gain: elevation,
      });

      toast({
        title: "Activity submitted successfully!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Reset form
      setType(ACTIVITY_TYPES[0]);
      setCustomType("");
      setDistance("");
      setDuration("");
      setLocation("");
      setCustomLocation("");
      setElevationGain("");
      setDate(localDateTimeValue());

      onActivityAdded?.();
    } catch (err) {
      console.error("Activity submission failed:", err);
      toast({
        title: "Failed to submit activity.",
        description: serverErrorDetail(err),
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={4} mb={4} borderWidth="1px" borderRadius="lg" shadow="sm" bg="gray.50" maxW="md" mx="auto">
      <form onSubmit={handleSubmit}>
        <VStack spacing={3} align="stretch">
          <FormControl>
            <FormLabel>Activity Type</FormLabel>
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              {ACTIVITY_TYPES.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </Select>
          </FormControl>

          {type === "Other" && (
            <FormControl>
              <FormLabel>Custom Activity</FormLabel>
              <Input
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                placeholder="Enter custom activity"
              />
            </FormControl>
          )}

          <FormControl>
            <FormLabel>Distance (km)</FormLabel>
            <Input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              max="1000"
              placeholder="e.g. 5.2"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Duration (minutes)</FormLabel>
            <Input
              type="number"
              inputMode="numeric"
              step="1"
              min="1"
              max="1440"
              placeholder="e.g. 30"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Location (Optional)</FormLabel>
            <Select value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Select location">
              {POPULAR_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </Select>
          </FormControl>

          {location === "Other" && (
            <FormControl>
              <FormLabel>Custom Location</FormLabel>
              <Input
                type="text"
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                placeholder="Enter location name"
              />
            </FormControl>
          )}

          {(type === "Hiking" || location.includes("Mt")) && (
            <FormControl>
              <FormLabel>Elevation Gain (meters) - Optional</FormLabel>
              <Input
                type="number"
                inputMode="numeric"
                value={elevationGain}
                onChange={(e) => setElevationGain(e.target.value)}
                min="0"
                max="100000"
                step="1"
                placeholder="0"
              />
            </FormControl>
          )}

          <FormControl>
            <FormLabel>Date & Time</FormLabel>
            <Input
              type="datetime-local"
              value={date}
              max={localDateTimeValue()}
              onChange={(e) => setDate(e.target.value)}
            />
          </FormControl>

          <Button type="submit" colorScheme="green" isLoading={loading}>
            Submit Activity
          </Button>
        </VStack>
      </form>
    </Box>
  );
}
