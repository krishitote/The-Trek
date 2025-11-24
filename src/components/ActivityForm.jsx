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

const ACTIVITY_TYPES = ["Running", "Walking", "Cycling", "Swimming", "Steps", "Other"];

export default function ActivityForm({ onActivityAdded }) {
  const { user, session } = useAuth();
  const [type, setType] = useState(ACTIVITY_TYPES[0]);
  const [customType, setCustomType] = useState("");
  const [distance, setDistance] = useState(5);
  const [duration, setDuration] = useState(30);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !session?.token) {
      toast({
        title: "Please log in to submit an activity.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (distance <= 0 || duration <= 0) {
      toast({
        title: "Distance and duration must be greater than zero.",
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
      await apiSubmitActivity(session.accessToken, {
        type: finalType,
        distance_km: distance,
        duration_min: duration,
        date,
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
      setDistance(5);
      setDuration(30);
      setDate(new Date().toISOString().slice(0, 16));

      onActivityAdded?.();
    } catch (err) {
      console.error("Activity submission failed:", err);
      toast({
        title: "Failed to submit activity.",
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
              step="0.01"
              value={distance}
              onChange={(e) => setDistance(Number(e.target.value))}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Duration (minutes)</FormLabel>
            <Input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Date & Time</FormLabel>
            <Input
              type="datetime-local"
              value={date}
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
