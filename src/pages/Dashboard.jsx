// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import ActivityForm from "../components/ActivityForm";
import ProgressChart from "../components/ProgressChart";
import { apiActivities, apiUsers } from "../services/api";
import {
  Box,
  Heading,
  Spinner,
  Button,
  Text,
  VStack,
  HStack,
  Collapse,
} from "@chakra-ui/react";

export default function Dashboard() {
  const { user, session } = useAuth();
  const [activities, setActivities] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showChart, setShowChart] = useState(false);
  const [userRank, setUserRank] = useState(null);

  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [showUserActivities, setShowUserActivities] = useState(false);

  const fetchData = async () => {
    if (!session?.token || !user) return;
    setLoading(true);
    try {
      const [userActs, users] = await Promise.all([
        apiActivities(session.token, user.user_id),
        apiUsers(),
      ]);
      setActivities(userActs);
      setAllUsers(users);

      // Compute ranking
      const leaderboard = await Promise.all(
        users.map(async (u) => {
          const acts = await apiActivities(session.token, u.user_id);
          const totalDistance = acts.reduce((sum, a) => sum + (a.distance_km || 0), 0);
          return { ...u, totalDistance };
        })
      );
      leaderboard.sort((a, b) => b.totalDistance - a.totalDistance);
      const rank = leaderboard.findIndex((u) => u.user_id === user.user_id) + 1;
      setUserRank({
        rank,
        totalUsers: leaderboard.length,
        totalDistance:
          leaderboard.find((u) => u.user_id === user.user_id)?.totalDistance || 0,
      });
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && session?.token) fetchData();
  }, [user, session?.token]);

  return (
    <Box maxW="4xl" mx="auto" p={4}>
      <Heading size="lg" mb={4} color="teal.600">
        🏃 My Dashboard
      </Heading>

      {/* Buttons Row */}
      <HStack spacing={3} mb={4}>
        <Button
          colorScheme="green"
          onClick={() => setShowSubmitForm(!showSubmitForm)}
        >
          {showSubmitForm ? "Hide Submit Activity" : "Submit Activity"}
        </Button>

        <Button
          colorScheme="purple"
          onClick={() => setShowUserActivities(!showUserActivities)}
        >
          {showUserActivities ? "Hide My Activities" : "My Activities"}
        </Button>

        <Button
          colorScheme="blue"
          onClick={() => setShowChart(!showChart)}
        >
          {showChart ? "Hide My Progress Chart" : "My Progress Chart"}
        </Button>
      </HStack>

      {/* Collapsible Sections */}
      <Collapse in={showSubmitForm} animateOpacity>
        <Box mb={4}>
          <ActivityForm onActivityAdded={fetchData} />
        </Box>
      </Collapse>

      <Collapse in={showChart} animateOpacity>
        <Box mb={4}>
          <ProgressChart activities={activities} />
        </Box>
      </Collapse>

      {/* User Ranking */}
      {userRank && (
        <Box mb={4} p={3} borderWidth="1px" borderRadius="md" bg="teal.50">
          <Text fontWeight="bold">
            Your Rank: #{userRank.rank} / {userRank.totalUsers}
          </Text>
          <Text>Total Distance: {Number(userRank.totalDistance || 0).toFixed(1)} km</Text>
        </Box>
      )}

      <Collapse in={showUserActivities} animateOpacity>
        {loading ? (
          <Spinner size="xl" color="teal.500" />
        ) : activities.length === 0 ? (
          <Text color="gray.500">You have no activities yet.</Text>
        ) : (
          <VStack spacing={2} align="stretch" mb={4}>
            {activities
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map((a) => (
                <Box
                  key={a.id}
                  p={2}
                  borderWidth="1px"
                  borderRadius="md"
                  shadow="sm"
                  bg="white"
                >
                  <HStack justify="space-between">
                    <Text>
                      <strong>{a.type}</strong> — {a.distance_km} km in {a.duration_min} min
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      {new Date(a.date).toLocaleDateString()}{" "}
                      {new Date(a.date).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </HStack>
                </Box>
              ))}
          </VStack>
        )}
      </Collapse>
    </Box>
  );
}
