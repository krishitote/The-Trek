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
  SimpleGrid,
  Container,
  Button,
  Card,
  CardBody,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Select,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { apiLeaderboards, apiGetCurrentChampionship } from "../services/api";
import { useAuth } from "../context/AuthContext";

/**
 * Home page: Leaderboards with hero section, podium, and activity/gender cards
 */

export default function Home() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [championship, setChampionship] = useState(null);

  const [allTime, setAllTime] = useState([]);
  const [perActivityData, setPerActivityData] = useState([]);
  const [perGenderData, setPerGenderData] = useState([]);

  const [activityTypes, setActivityTypes] = useState([]);
  const [genderTypes, setGenderTypes] = useState([]);
  
  const [selectedActivity, setSelectedActivity] = useState("");
  const [selectedGender, setSelectedGender] = useState("");

  // Fetch and cache everything once on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [leaderboardData, champData] = await Promise.all([
          apiLeaderboards(),
          apiGetCurrentChampionship().catch(() => null),
        ]);
        if (cancelled) return;

        setAllTime(leaderboardData.allTimeLeaders || []);
        setPerActivityData(leaderboardData.perActivity || []);
        setPerGenderData(leaderboardData.perGender || []);
        setChampionship(champData);

        const uniqueGenders = [...new Set((leaderboardData.perGender || []).map((r) => r.gender).filter(Boolean))];
        console.log("Gender data:", leaderboardData.perGender);
        console.log("Unique genders:", uniqueGenders);
        setActivityTypes([...new Set((leaderboardData.perActivity || []).map((r) => r.type).filter(Boolean))]);
        setGenderTypes(uniqueGenders);
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
    <Box bg="gray.50" minH="100vh">
      {/* Hero Section - Dynamic Black Gradient with Pattern */}
      <Box
        position="relative"
        bgGradient="linear(135deg, #1a1a1a 0%, #2d2d2d 25%, #0f0f0f 75%, #000000 100%)"
        color="white"
        py={{ base: 16, md: 24 }}
        px={8}
        textAlign="center"
        overflow="hidden"
        _before={{
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          opacity: 0.4,
        }}
        _after={{
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgGradient: "linear(to-b, transparent 0%, rgba(255,111,0,0.15) 100%)",
        }}
      >
        <Container maxW="container.lg" position="relative" zIndex={1}>
          <Heading
            size="2xl"
            fontWeight="900"
            mb={2}
            textShadow="0 3px 20px rgba(255,111,0,0.5), 0 0 40px rgba(255,111,0,0.3)"
            letterSpacing="tight"
            fontFamily="heading"
            textTransform="uppercase"
            bgGradient="linear(to-r, #ffffff, #ff6f00)"
            bgClip="text"
          >
            Trek Fit
          </Heading>
          <Text fontSize={{ base: "md", md: "lg" }} fontWeight="500" opacity={0.9} letterSpacing="wide">
            Your Ultimate Fitness Tracking Platform
          </Text>
        </Container>
      </Box>

      <Container maxW="container.xl" py={10}>
        <VStack spacing={8} align="stretch">
          {/* Feature Banners - Side by Side */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            {/* Grand Finale Banner */}
            {championship && (
              <Card 
                bg="linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)" 
                color="white"
                boxShadow="lg"
                _hover={{ transform: 'translateY(-2px)', transition: '0.2s' }}
                transition="0.2s"
              >
                <CardBody p={5}>
                  <VStack spacing={2} align="start">
                    <Badge colorScheme="yellow" fontSize="xs" px={2} py={0.5}>
                      {championship.registration_open ? "OPEN NOW" : "COMING SOON"}
                    </Badge>
                    <Heading size="md">🏆 Grand Finale {championship.year}</Heading>
                    <Text fontSize="xs" opacity={0.9}>
                      Top 10 compete. Spectators welcome!
                    </Text>
                    <Divider borderColor="whiteAlpha.400" />
                    <VStack align="start" spacing={0.5} fontSize="xs">
                      <Text>💰 Spectators: Ksh 5,000</Text>
                      <Text>🏃 Participants: Ksh 10,000</Text>
                      <Text>⭐ Top 10: FREE</Text>
                    </VStack>
                    <Button 
                      as={Link} 
                      to={user ? "/championship" : "/register"} 
                      colorScheme="whiteAlpha"
                      variant="solid"
                      size="sm"
                      w="full"
                      mt={1}
                    >
                      {championship.registration_open ? "Register" : "Learn More"}
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            )}

            {/* Communities Banner */}
            <Card 
              bg="linear-gradient(135deg, #2D6A4F 0%, #40916C 100%)" 
              color="white"
              boxShadow="lg"
              _hover={{ transform: 'translateY(-2px)', transition: '0.2s' }}
              transition="0.2s"
            >
              <CardBody p={5}>
                <VStack spacing={2} align="start">
                  <Badge colorScheme="teal" fontSize="xs" px={2} py={0.5}>EXCLUSIVE</Badge>
                  <Heading size="md">👥 Join a Community</Heading>
                  <Text fontSize="xs" opacity={0.9}>
                    Compete with your group together.
                  </Text>
                  <Divider borderColor="whiteAlpha.400" />
                  <VStack align="start" spacing={0.5} fontSize="xs">
                    <Text>✓ Curated groups only</Text>
                    <Text>✓ Group leaderboards</Text>
                    <Text>✓ Private or public</Text>
                  </VStack>
                  <Button 
                    as={Link} 
                    to={user ? "/communities" : "/register"} 
                    colorScheme="whiteAlpha"
                    variant="solid"
                    size="sm"
                    w="full"
                    mt={1}
                  >
                    {user ? "Browse" : "Get Started"}
                  </Button>
                  <Text fontSize="2xs" opacity={0.7} textAlign="center" w="full">
                    Contact admin to register your org
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* CTA for non-logged in users */}
          {!user && (
            <Card bg="white" boxShadow="md">
              <CardBody p={6}>
                <HStack justify="space-between" flexWrap="wrap" spacing={4}>
                  <VStack align="start" spacing={1}>
                    <Heading size="md" color="green.700">Start Your Journey</Heading>
                    <Text color="gray.600">Track activities, join communities, compete for glory</Text>
                  </VStack>
                  <HStack spacing={3}>
                    <Button as={Link} to="/register" colorScheme="green" size="lg">
                      Sign Up Free
                    </Button>
                    <Button as={Link} to="/login" variant="outline" colorScheme="green" size="lg">
                      Login
                    </Button>
                  </HStack>
                </HStack>
              </CardBody>
            </Card>
          )}

          <Divider />

          {/* Leaderboards Section */}
          <VStack spacing={6} align="stretch">
            <Heading size="lg" textAlign="center" color="green.700">
              🏆 Top Champions
            </Heading>
            
            {/* Top 3 - Compact Cards */}
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              {allTime.slice(0, 3).map((leader, idx) => (
                <Card 
                  key={leader.user_id}
                  bg={idx === 0 ? "gradient-to-br from-yellow-50 to-orange-50" : "white"}
                  borderWidth={idx === 0 ? "2px" : "1px"}
                  borderColor={idx === 0 ? "orange.300" : "gray.200"}
                  boxShadow={idx === 0 ? "lg" : "sm"}
                >
                  <CardBody>
                    <HStack justify="space-between">
                      <HStack spacing={3}>
                        <Text fontSize="3xl">{idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}</Text>
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="bold" fontSize="lg">{leader.username}</Text>
                          <Text fontSize="sm" color="gray.600">
                            {leader.activity_count} activities
                          </Text>
                        </VStack>
                      </HStack>
                      <Badge 
                        colorScheme={idx === 0 ? "orange" : "gray"} 
                        fontSize="md" 
                        px={3} 
                        py={1}
                        borderRadius="full"
                      >
                        {Number(leader.total_distance || 0).toFixed(1)} km
                      </Badge>
                    </HStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>

            {/* Rest of Top 10 - Compact List */}
            {allTime.length > 3 && (
              <Card>
                <CardBody>
                  <VStack align="stretch" spacing={2}>
                    {allTime.slice(3, 10).map((leader, idx) => (
                      <HStack 
                        key={leader.user_id} 
                        justify="space-between"
                        p={3}
                        borderRadius="md"
                        _hover={{ bg: "gray.50" }}
                      >
                        <HStack spacing={3}>
                          <Text fontWeight="bold" color="gray.500" minW="30px">
                            #{idx + 4}
                          </Text>
                          <Text fontWeight="medium">{leader.username}</Text>
                        </HStack>
                        <Text color="gray.600" fontWeight="medium">
                          {Number(leader.total_distance || 0).toFixed(1)} km
                        </Text>
                      </HStack>
                    ))}
                  </VStack>
                </CardBody>
              </Card>
            )}
          </VStack>

          <Divider my={4} />

          {/* Leaders by Activity - Collapsible with Dropdown */}
          <Accordion allowToggle>
            <AccordionItem border="1px" borderColor="green.200" borderRadius="md">
              <AccordionButton _hover={{ bg: "green.50" }} p={4}>
                <Box flex="1" textAlign="left">
                  <Heading size="md" color="green.700">
                    🏃 Leaders by Activity
                  </Heading>
                </Box>
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel pb={4}>
                <VStack spacing={4} align="stretch">
                  <Select
                    placeholder="Select an activity"
                    value={selectedActivity}
                    onChange={(e) => setSelectedActivity(e.target.value)}
                    size="md"
                    borderColor="green.300"
                    _focus={{ borderColor: "green.500", boxShadow: "0 0 0 1px var(--chakra-colors-green-500)" }}
                  >
                    {activityTypes.map((type) => (
                      <option key={type} value={type}>
                        {getActivityIcon(type)} {type}
                      </option>
                    ))}
                  </Select>

                  {selectedActivity && (
                    <Card borderWidth="1px" borderColor="green.200">
                      <CardBody>
                        <Heading size="sm" mb={4} color="green.700">
                          Top 10 - {selectedActivity}
                        </Heading>
                        <VStack spacing={2} align="stretch">
                          {perActivityData
                            .filter((r) => r.type === selectedActivity)
                            .slice(0, 10)
                            .map((user, idx) => (
                              <HStack
                                key={user.user_id}
                                justify="space-between"
                                p={3}
                                bg={idx < 3 ? "green.50" : "gray.50"}
                                borderRadius="md"
                                borderLeft={idx < 3 ? "4px solid" : "none"}
                                borderLeftColor={idx < 3 ? "green.500" : "transparent"}
                              >
                                <HStack spacing={3}>
                                  <Text
                                    fontSize="lg"
                                    fontWeight="bold"
                                    color={idx < 3 ? "green.600" : "gray.600"}
                                    minW="40px"
                                  >
                                    #{idx + 1}
                                  </Text>
                                  <Text fontSize="md" fontWeight={idx < 3 ? "bold" : "normal"}>
                                    {user.username}
                                  </Text>
                                </HStack>
                                <VStack align="end" spacing={0}>
                                  <Text fontSize="md" fontWeight="bold" color="green.600">
                                    {Number(user.total_distance || 0).toFixed(1)} km
                                  </Text>
                                  <Text fontSize="xs" color="gray.500">
                                    {user.activity_count} activities
                                  </Text>
                                </VStack>
                              </HStack>
                            ))}
                          {perActivityData.filter((r) => r.type === selectedActivity).length === 0 && (
                            <Text textAlign="center" color="gray.500" py={4}>
                              No {selectedActivity.toLowerCase()} activities yet. Be the first!
                            </Text>
                          )}
                        </VStack>
                      </CardBody>
                    </Card>
                  )}
                </VStack>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>

          <Divider my={4} />

          {/* Leaders by Gender - Collapsible with Dropdown */}
          <Accordion allowToggle>
            <AccordionItem border="1px" borderColor="blue.200" borderRadius="md">
              <AccordionButton _hover={{ bg: "blue.50" }} p={4}>
                <Box flex="1" textAlign="left">
                  <Heading size="md" color="blue.700">
                    🚹🚺 Leaders by Gender
                  </Heading>
                </Box>
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel pb={4}>
                <VStack spacing={4} align="stretch">
                  <Select
                    placeholder="Select a gender"
                    value={selectedGender}
                    onChange={(e) => setSelectedGender(e.target.value)}
                    size="md"
                    borderColor="blue.300"
                    _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)" }}
                  >
                    {genderTypes.map((gender) => (
                      <option key={gender} value={gender}>
                        {gender === "male" ? "🚹 Male" : "🚺 Female"}
                      </option>
                    ))}
                  </Select>

                  {selectedGender && (
                    <Card borderWidth="1px" borderColor={selectedGender === "male" ? "blue.200" : "pink.200"}>
                      <CardBody>
                        <Heading size="sm" mb={4} color={selectedGender === "male" ? "blue.700" : "pink.700"}>
                          Top 10 - {selectedGender === "male" ? "Male" : "Female"} Athletes
                        </Heading>
                        <VStack spacing={2} align="stretch">
                          {perGenderData
                            .filter((r) => r.gender === selectedGender)
                            .slice(0, 10)
                            .map((user, idx) => (
                              <HStack
                                key={user.user_id}
                                justify="space-between"
                                p={3}
                                bg={idx < 3 ? (selectedGender === "male" ? "blue.50" : "pink.50") : "gray.50"}
                                borderRadius="md"
                                borderLeft={idx < 3 ? "4px solid" : "none"}
                                borderLeftColor={
                                  idx < 3 ? (selectedGender === "male" ? "blue.500" : "pink.500") : "transparent"
                                }
                              >
                                <HStack spacing={3}>
                                  <Text
                                    fontSize="lg"
                                    fontWeight="bold"
                                    color={idx < 3 ? (selectedGender === "male" ? "blue.600" : "pink.600") : "gray.600"}
                                    minW="40px"
                                  >
                                    #{idx + 1}
                                  </Text>
                                  <Text fontSize="md" fontWeight={idx < 3 ? "bold" : "normal"}>
                                    {user.username}
                                  </Text>
                                </HStack>
                                <VStack align="end" spacing={0}>
                                  <Text
                                    fontSize="md"
                                    fontWeight="bold"
                                    color={selectedGender === "male" ? "blue.600" : "pink.600"}
                                  >
                                    {Number(user.total_distance || 0).toFixed(1)} km
                                  </Text>
                                  <Text fontSize="xs" color="gray.500">
                                    {user.activity_count} activities
                                  </Text>
                                </VStack>
                              </HStack>
                            ))}
                          {perGenderData.filter((r) => r.gender === selectedGender).length === 0 && (
                            <Text textAlign="center" color="gray.500" py={4}>
                              No {selectedGender} athletes yet. Be the first!
                            </Text>
                          )}
                        </VStack>
                      </CardBody>
                    </Card>
                  )}
                </VStack>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        </VStack>
      </Container>
    </Box>
  );
}
