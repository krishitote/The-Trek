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
  SimpleGrid,
  Container,
  Badge,
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
        apiActivities(session.accessToken, user.id),
        apiUsers(),
      ]);
      setActivities(userActs);
      setAllUsers(users);

      // Compute ranking
      const leaderboard = await Promise.all(
        users.map(async (u) => {
          const acts = await apiActivities(session.accessToken, u.id);
          const totalDistance = acts.reduce((sum, a) => sum + Number(a.distance_km || 0), 0);
          return { ...u, totalDistance };
        })
      );
      leaderboard.sort((a, b) => b.totalDistance - a.totalDistance);
      const rank = leaderboard.findIndex((u) => u.id === user.id) + 1;
      setUserRank({
        rank,
        totalUsers: leaderboard.length,
        totalDistance:
          leaderboard.find((u) => u.id === user.id)?.totalDistance || 0,
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
        <Box mb={6}>
          <ActivityForm onActivityAdded={fetchData} />
        </Box>
      </Collapse>

      <Collapse in={showChart} animateOpacity>
        <Box mb={6} bg="white" p={6} borderRadius="2xl" boxShadow="md">
          <ProgressChart activities={activities} />
        </Box>
      </Collapse>

      <Collapse in={showUserActivities} animateOpacity>
        <Box mb={6}>
          <Heading size="md" mb={4} color="brand.forest">
            📋 Your Activity Timeline
          </Heading>
          {activities.length === 0 ? (
            <Box bg="white" p={8} borderRadius="2xl" boxShadow="md" textAlign="center">
              <Text fontSize="3xl" mb={2}>🏃‍♂️</Text>
              <Text color="gray.500">No activities yet. Start your trek!</Text>
            </Box>
          ) : (
            <VStack spacing={4} align="stretch">
              {activities
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((activity) => (
                  <Box
                    key={activity.id}
                    bg="white"
                    p={5}
                    borderRadius="xl"
                    boxShadow="md"
                    borderLeft="4px solid"
                    borderLeftColor={getActivityColor(activity.type)}
                    transition="all 0.2s"
                    _hover={{ boxShadow: "lg", transform: "translateX(4px)" }}
                  >
                    <HStack justify="space-between" flexWrap="wrap">
                      <HStack spacing={4}>
                        <Text fontSize="3xl">{getActivityIcon(activity.type)}</Text>
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="bold" fontSize="lg">{activity.type}</Text>
                          <Text fontSize="sm" color="gray.600">
                            {new Date(activity.date).toLocaleDateString()} at{" "}
                            {new Date(activity.date).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Text>
                        </VStack>
                      </HStack>

                      <HStack spacing={6}>
                        <VStack spacing={0}>
                          <Text fontSize="xs" color="gray.600">Distance</Text>
                          <Badge
                            colorScheme="green"
                            fontSize="lg"
                            px={3}
                            borderRadius="full"
                            fontWeight="bold"
                          >
                            {activity.distance_km} km
                          </Badge>
                        </VStack>
                        <VStack spacing={0}>
                          <Text fontSize="xs" color="gray.600">Duration</Text>
                          <Badge
                            colorScheme="orange"
                            fontSize="lg"
                            px={3}
                            borderRadius="full"
                            fontWeight="bold"
                          >
                            {activity.duration_min} min
                          </Badge>
                        </VStack>
                      </HStack>
                    </HStack>
                  </Box>
                ))}
            </VStack>
          )}
        </Box>
      </Collapse>
    </Container>
  );
}