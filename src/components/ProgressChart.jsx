// src/components/ProgressChart.jsx
import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Box, Text, useColorModeValue } from "@chakra-ui/react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function ProgressChart({ activities }) {
  if (!activities || activities.length === 0) {
    return (
      <Text textAlign="center" color="gray.500" mt={4}>
        No activity data to display.
      </Text>
    );
  }

  const sorted = [...activities].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );
  const labels = sorted.map((a) =>
    new Date(a.date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    })
  );
  const data = sorted.map((a) => a.distance_km);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Distance (km)",
        data,
        borderColor: useColorModeValue("rgb(56, 161, 105)", "rgb(154, 230, 180)"),
        backgroundColor: useColorModeValue("rgba(72, 187, 120, 0.3)", "rgba(154, 230, 180, 0.3)"),
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Progress Over Time" },
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 } },
    },
  };

  return (
    <Box
      maxW="2xl"
      mx="auto"
      p={5}
      mt={6}
      borderWidth="1px"
      borderRadius="xl"
      boxShadow="md"
      bg={useColorModeValue("white", "gray.700")}
      minH="350px"
    >
      <Line data={chartData} options={options} />
    </Box>
  );
}