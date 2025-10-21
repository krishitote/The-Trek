import React, { useState, useEffect } from "react";
import { ScrollView, View, Dimensions } from "react-native";
import { Text, Button, Card } from "react-native-paper";
import { LineChart } from "react-native-chart-kit";
import { apiGetActivities } from "../api";
import { useAuth } from "../context/AuthContext";

export default function DashboardScreen() {
  const { user, session } = useAuth();
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    (async () => {
      const data = await apiGetActivities(session.token);
      setActivities(data);
    })();
  }, []);

  return (
    <ScrollView style={{ padding: 16 }}>
      <Card style={{ marginBottom: 20 }}>
        <Card.Content>
          <Text variant="titleLarge">Welcome, {user?.username}</Text>
          <Text>Total Activities: {activities.length}</Text>
        </Card.Content>
      </Card>

      <LineChart
        data={{
          labels: activities.map((a) => a.date.slice(5, 10)),
          datasets: [{ data: activities.map((a) => a.distance_km) }],
        }}
        width={Dimensions.get("window").width - 32}
        height={220}
        chartConfig={{
          backgroundGradientFrom: "#fff",
          backgroundGradientTo: "#eee",
          color: () => `#3b82f6`,
        }}
        style={{ borderRadius: 12 }}
      />

      <Button mode="contained" style={{ marginTop: 20 }}>
        Add Activity
      </Button>
    </ScrollView>
  );
}
