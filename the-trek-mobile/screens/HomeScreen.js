import React, { useEffect, useState } from "react";
import { View, Text, Button, FlatList } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchActivities } from "../api";

export default function HomeScreen({ navigation }) {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const loadActivities = async () => {
      const token = await AsyncStorage.getItem("token");
      const data = await fetchActivities(token);
      setActivities(data);
    };
    loadActivities();
  }, []);

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Button title="Profile" onPress={() => navigation.navigate("Profile")} />
      <Text style={{ fontSize: 20, marginVertical: 10 }}>Your Activities</Text>
      <FlatList
        data={activities}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Text>{`${item.type}: ${item.distance_km} km`}</Text>
        )}
      />
    </View>
  );
}
