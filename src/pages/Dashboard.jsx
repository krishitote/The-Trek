// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import ActivityForm from "../components/ActivityForm";
import ProgressChart from "../components/ProgressChart";
import EnhancedStats from "../components/EnhancedStats";
import { apiActivities, apiQuickLeaderboard } from "../services/api";
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

// Helper functions for activity styling
const getActivityIcon = (type) => {
  if (type === "Running") return "🏃";
  if (type === "Cycling") return "🚴";
  if (type === "Swimming") return "🏊";
  return "🏃";
};

const getActivityColor = (type) => {
  if (type === "Running") return "brand.500";
  if (type === "Cycling") return "energy.500";
  if (type === "Swimming") return "sky.500";
  return "brand.500";
};

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
    if (!session?.accessToken || !user) return;
    setLoading(true);
    try {
      const [userActs, leaderboard] = await Promise.all([
        apiActivities(session.accessToken, user.id),
        apiQuickLeaderboard(),
      ]);
      setActivities(userActs);
      setAllUsers(leaderboard);

      // Find user's rank from pre-computed leaderboard
      const rank = leaderboard.findIndex((u) => u.id === user.id) + 1;
      const userStats = leaderboard.find((u) => u.id === user.id);
      
      setUserRank({
        rank,
        totalUsers: leaderboard.length,
        totalDistance: userStats?.total_distance || 0,
      });
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && session?.accessToken) fetchData();
  }, [user, session?.accessToken]);

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={4}>
          <Spinner size="xl" color="brand.500" thickness="4px" />
          <Text color="gray.600">Loading your trek data...</Text>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Heading size="xl" mb={8} color="brand.500" fontWeight="black">
        🏃 My Dashboard
      </Heading>

      {/* Stats Cards Row */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
        {/* Total Distance Card */}
        <Box
          bgGradient="linear(to-br, brand.400, brand.600)"
          color="white"
          p={6}
          borderRadius="2xl"
          boxShadow="lg"
        >
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" opacity={0.9}>Total Distance</Text>
            <Text fontSize="3xl">🏃</Text>
          </HStack>
          <Heading size="2xl" fontWeight="black">{userRank?.totalDistance || 0}</Heading>
          <Text fontSize="sm" opacity={0.8}>kilometers trekked</Text>
        </Box>

        {/* Global Rank Card */}
        <Box
          bgGradient="linear(to-br, energy.400, energy.600)"
          color="white"
          p={6}
          borderRadius="2xl"
          boxShadow="lg"
        >
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" opacity={0.9}>Global Rank</Text>
            <Text fontSize="3xl">🏆</Text>
          </HStack>
          <Heading size="2xl" fontWeight="black">#{userRank?.rank || "-"}</Heading>
          <Text fontSize="sm" opacity={0.8}>out of {userRank?.totalUsers || 0} trekkers</Text>
        </Box>

        {/* Activities Count Card */}
        <Box
          bgGradient="linear(to-br, sky.400, sky.600)"
          color="white"
          p={6}
          borderRadius="2xl"
          boxShadow="lg"
        >
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" opacity={0.9}>Total Activities</Text>
            <Text fontSize="3xl">📊</Text>
          </HStack>
          <Heading size="2xl" fontWeight="black">{activities.length}</Heading>
          <Text fontSize="sm" opacity={0.8}>logged this month</Text>
        </Box>
      </SimpleGrid>

      {/* Energy-Themed Action Buttons */}
      <HStack spacing={4} mb={6} flexWrap="wrap">
        <Button
          size="lg"
          bgGradient="linear(to-r, energy.400, energy.600)"
          color="white"
          fontWeight="bold"
          borderRadius="full"
          px={8}
          _hover={{
            bgGradient: "linear(to-r, energy.600, energy.400)",
            transform: "scale(1.05)"
          }}
          leftIcon={<Text fontSize="xl">⚡</Text>}
          onClick={() => setShowSubmitForm(!showSubmitForm)}
        >
          {showSubmitForm ? "Hide" : "Log Activity"}
        </Button>

        <Button
          size="lg"
          variant="outline"
          borderColor="brand.500"
          color="brand.500"
          borderRadius="full"
          px={8}
          _hover={{ bg: "brand.500", color: "white" }}
          leftIcon={<Text fontSize="xl">📈</Text>}
          onClick={() => setShowChart(!showChart)}
        >
          Old Progress Chart
        </Button>

        <Button
          size="lg"
          variant="outline"
          borderColor="sky.500"
          color="sky.500"
          borderRadius="full"
          px={8}
          _hover={{ bg: "sky.500", color: "white" }}
          leftIcon={<Text fontSize="xl">📋</Text>}
          onClick={() => setShowUserActivities(!showUserActivities)}
        >
          {showUserActivities ? "Hide" : "View"} Activities
        </Button>
      </HStack>

      {/* Enhanced Stats Dashboard */}
      <Box mb={8}>
        <EnhancedStats />
      </Box>

      {/* Collapsible Sections */}
      <Collapse in={showSubmitForm} animateOpacity>
        <Box mb={6} bg="white" p={6} borderRadius="2xl" boxShadow="lg">
          <Heading size="md" mb={4} color="brand.500">⚡ Log New Activity</Heading>
          <ActivityForm onActivityAdded={fetchData} />
        </Box>
      </Collapse>

      <Collapse in={showChart} animateOpacity>
        <Box mb={6} bg="white" p={6} borderRadius="2xl" boxShadow="lg">
          <Heading size="md" mb={4} color="brand.500">📈 Your Progress Over Time</Heading>
          <ProgressChart activities={activities} />
        </Box>
      </Collapse>

      <Collapse in={showUserActivities} animateOpacity>
        <Box mb={6}>
          <Heading size="md" mb={4} color="brand.500">
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
                          <Text fontWeight="bold" fontSize="xl" color="brand.500">
                            {activity.distance_km} km
                          </Text>
                        </VStack>
                        <VStack spacing={0}>
                          <Text fontSize="xs" color="gray.600">Duration</Text>
                          <Text fontWeight="bold" fontSize="xl" color="energy.500">
                            {activity.duration_min} min
                          </Text>
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