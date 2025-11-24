// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Spinner,
  Badge,
  Avatar,
  SimpleGrid,
  Container,
} from "@chakra-ui/react";
import { apiLeaderboards } from "../services/api";

/**
 * Home page: Leaderboards with hero section, podium, and activity/gender cards
 */

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [allTime, setAllTime] = useState([]);
  const [perActivityData, setPerActivityData] = useState([]);
  const [perGenderData, setPerGenderData] = useState([]);

  const [activityTypes, setActivityTypes] = useState([]);
  const [genderTypes, setGenderTypes] = useState([]);

  // Fetch and cache everything once on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await apiLeaderboards();
        if (cancelled) return;

        setAllTime(data.allTimeLeaders || []);
        setPerActivityData(data.perActivity || []);
        setPerGenderData(data.perGender || []);

        setActivityTypes([...new Set((data.perActivity || []).map((r) => r.type).filter(Boolean))]);
        setGenderTypes([...new Set((data.perGender || []).map((r) => r.gender).filter(Boolean))]);
      } catch (err) {
        console.error("Failed to load leaderboards", err);
        setError("Failed to load leaderboard data");
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // UI
  if (loading) {
    return (
      <Box textAlign="center" mt={8}>
        <Spinner size="xl" color="brand.500" thickness="4px" />
        <Text mt={4} color="gray.600">Loading leaderboards...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" mt={8} p={8}>
        <Text color="red.500" fontSize="xl">{error}</Text>
      </Box>
    );
  }

  // Get activity icon
  const getActivityIcon = (type) => {
    const icons = {
      Running: "🏃",
      Cycling: "🚴",
      Swimming: "🏊",
      Walking: "🚶",
      Hiking: "🥾"
    };
    return icons[type] || "🏃";
  };

  // Get activity color
  const getActivityColor = (type) => {
    const colors = {
      Running: "brand.500",
      Cycling: "energy.500",
      Swimming: "sky.500",
      Walking: "brand.600",
      Hiking: "earth.500"
    };
    return colors[type] || "brand.500";
  };

  return (
    <Box>
      {/* Hero Section */}
      <Box
        bgGradient="linear(to-br, brand.500, brand.600)"
        color="white"
        py={{ base: 12, md: 20 }}
        px={8}
        textAlign="center"
        position="relative"
        overflow="hidden"
      >
        <Container maxW="container.xl">
          <Heading
            size="2xl"
            fontWeight="900"
            bgGradient="linear(to-r, energy.500, energy.600)"
            bgClip="text"
            mb={4}
          >
            The Trek Leaderboard
          </Heading>
          <Text fontSize={{ base: "lg", md: "xl" }} opacity={0.9}>
            🌲 Track. Compete. Conquer Nature. 🏔️
          </Text>
        </Container>
      </Box>

      <Container maxW="container.xl" py={12}>
        {/* Top 3 Podium */}
        <Heading size="lg" textAlign="center" mb={8} color="brand.500">
          🏆 Top 3 Champions
        </Heading>
        
        <HStack spacing={{ base: 4, md: 8 }} justify="center" mb={16} flexWrap="wrap">
          {/* 2nd Place */}
          {allTime[1] && (
            <VStack spacing={3}>
              <Box
                bg="gray.100"
                w="80px"
                h="100px"
                borderRadius="xl"
                display="flex"
                alignItems="center"
                justifyContent="center"
                boxShadow="md"
              >
                <Text fontSize="4xl">🥈</Text>
              </Box>
              <Avatar 
                size="lg" 
                name={allTime[1].username}
                src={allTime[1].profile_image ? `${import.meta.env.VITE_API_URL}${allTime[1].profile_image}` : undefined}
              />
              <Text fontWeight="bold" fontSize="md">{allTime[1].username}</Text>
              <Badge colorScheme="gray" fontSize="md" px={3} borderRadius="full">
                {Number(allTime[1].total_distance || 0).toFixed(1)} km
              </Badge>
            </VStack>
          )}

          {/* 1st Place - Elevated */}
          {allTime[0] && (
            <VStack spacing={3}>
              <Box
                bgGradient="linear(to-br, energy.500, energy.600)"
                w="100px"
                h="140px"
                borderRadius="xl"
                display="flex"
                alignItems="center"
                justifyContent="center"
                boxShadow="2xl"
              >
                <Text fontSize="5xl">🥇</Text>
              </Box>
              <Avatar 
                size="2xl" 
                name={allTime[0].username}
                src={allTime[0].profile_image ? `${import.meta.env.VITE_API_URL}${allTime[0].profile_image}` : undefined}
                border="4px solid"
                borderColor="energy.500"
              />
              <Text fontWeight="black" fontSize="xl">{allTime[0].username}</Text>
              <Badge colorScheme="orange" fontSize="lg" px={4} borderRadius="full">
                {Number(allTime[0].total_distance || 0).toFixed(1)} km
              </Badge>
            </VStack>
          )}

          {/* 3rd Place */}
          {allTime[2] && (
            <VStack spacing={3}>
              <Box
                bg="orange.100"
                w="80px"
                h="80px"
                borderRadius="xl"
                display="flex"
                alignItems="center"
                justifyContent="center"
                boxShadow="md"
              >
                <Text fontSize="4xl">🥉</Text>
              </Box>
              <Avatar 
                size="lg" 
                name={allTime[2].username}
                src={allTime[2].profile_image ? `${import.meta.env.VITE_API_URL}${allTime[2].profile_image}` : undefined}
              />
              <Text fontWeight="bold" fontSize="md">{allTime[2].username}</Text>
              <Badge colorScheme="orange" fontSize="md" px={3} borderRadius="full">
                {Number(allTime[2].total_distance || 0).toFixed(1)} km
              </Badge>
            </VStack>
          )}
        </HStack>

        {/* Activity Type Leaders */}
        <Heading size="lg" textAlign="center" mb={8} color="brand.500">
          🏃 Leaders by Activity
        </Heading>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} mb={16}>
          {activityTypes.map((type) => {
            const leaders = perActivityData.filter(r => r.type === type).slice(0, 5);
            return (
              <Box
                key={type}
                bg="white"
                p={6}
                borderRadius="2xl"
                boxShadow="md"
                cursor="pointer"
                transition="all 0.3s"
                _hover={{ transform: "translateY(-4px)", boxShadow: "xl" }}
                border="2px solid"
                borderColor={getActivityColor(type)}
              >
                <HStack mb={4}>
                  <Text fontSize="3xl">{getActivityIcon(type)}</Text>
                  <Heading size="md" color={getActivityColor(type)}>{type}</Heading>
                </HStack>
                <VStack align="stretch" spacing={3}>
                  {leaders.map((user, idx) => (
                    <HStack key={user.user_id} justify="space-between">
                      <HStack>
                        <Badge 
                          colorScheme={idx === 0 ? "orange" : "green"} 
                          borderRadius="full" 
                          px={2}
                        >
                          #{idx + 1}
                        </Badge>
                        <Text fontWeight="medium" fontSize="sm">{user.username}</Text>
                      </HStack>
                      <Text fontWeight="bold" color={getActivityColor(type)} fontSize="sm">
                        {Number(user.total_distance || 0).toFixed(1)} km
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              </Box>
            );
          })}
        </SimpleGrid>

        {/* Gender Leaders */}
        <Heading size="lg" textAlign="center" mb={8} color="brand.500">
          🚹🚺 Leaders by Gender
        </Heading>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          {genderTypes.map((gender) => {
            const leaders = perGenderData.filter(r => r.gender === gender).slice(0, 10);
            return (
              <Box
                key={gender}
                bg="white"
                p={6}
                borderRadius="2xl"
                boxShadow="md"
                border="2px solid"
                borderColor="sky.500"
              >
                <Heading size="md" mb={4} color="sky.500">
                  {gender === "Male" ? "🚹 Male" : "🚺 Female"} Leaders
                </Heading>
                <VStack align="stretch" spacing={2}>
                  {leaders.map((user, idx) => (
                    <HStack key={user.user_id} justify="space-between" p={2} borderRadius="md" bg={idx < 3 ? "sky.50" : "transparent"}>
                      <HStack>
                        <Badge 
                          colorScheme={idx === 0 ? "orange" : idx < 3 ? "blue" : "gray"} 
                          borderRadius="full" 
                          px={2}
                        >
                          #{idx + 1}
                        </Badge>
                        <Text fontWeight={idx < 3 ? "bold" : "medium"} fontSize="sm">
                          {user.username}
                        </Text>
                      </HStack>
                      <Text fontWeight="bold" color="sky.500" fontSize="sm">
                        {Number(user.total_distance || 0).toFixed(1)} km
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              </Box>
            );
          })}
        </SimpleGrid>
      </Container>
    </Box>
  );
}