import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
import { useAuth } from "../context/AuthContext";
import { apiSubmitActivity } from "../api";

export default function ActivityForm() {
  const { user, session } = useAuth();
  const [type, setType] = useState("Running");
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");

  const handleSubmit = async () => {
    if (!user || !session) return Alert.alert("Please log in first.");
    try {
      await apiSubmitActivity(session.token, {
        type,
        distance_km: parseFloat(distance),
        duration_min: parseFloat(duration),
        date: new Date().toISOString(),
      });
      Alert.alert("Activity submitted!");
      setDistance("");
      setDuration("");
    } catch {
      Alert.alert("Error", "Failed to submit activity");
    }
  };

  return (
    <View style={{ marginTop: 20 }}>
      <Text>Type</Text>
      <TextInput value={type} onChangeText={setType} style={{ borderWidth: 1, marginBottom: 8, padding: 8 }} />
      <Text>Distance (km)</Text>
      <TextInput keyboardType="numeric" value={distance} onChangeText={setDistance} style={{ borderWidth: 1, marginBottom: 8, padding: 8 }} />
      <Text>Duration (min)</Text>
      <TextInput keyboardType="numeric" value={duration} onChangeText={setDuration} style={{ borderWidth: 1, marginBottom: 8, padding: 8 }} />
      <Button title="Submit" onPress={handleSubmit} />
    </View>
  );
}
