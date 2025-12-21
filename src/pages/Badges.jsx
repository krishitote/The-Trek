// src/pages/Badges.jsx
import React, { useEffect, useState } from 'react';
import {
  Container,
  Heading,
  VStack,
  SimpleGrid,
  Box,
  Text,
  Badge,
  Progress,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
  Spinner,
  HStack,
  Icon,
} from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';
import ShareButton from '../components/ShareButton';
import { apiGetBadgeProgress } from '../services/api';

export default function Badges() {
  const { session } = useAuth();
  const toast = useToast();
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    try {
      const data = await apiGetBadgeProgress(session.accessToken);
      setBadges(data);
    } catch (err) {
      toast({
        title: 'Failed to load badges',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={4}>
          <Spinner size="xl" color="brand.500" />
          <Text>Loading badges...</Text>
        </VStack>
      </Container>
    );
  }

  const earnedBadges = badges.filter(b => b.earned);
  const inProgressBadges = badges.filter(b => !b.earned && b.progress > 0);
  const lockedBadges = badges.filter(b => !b.earned && b.progress === 0);

  const categoryColors = {
    milestones: 'purple',
    distance: 'green',
    streaks: 'orange',
    performance: 'red',
    variety: 'blue',
    special: 'pink',
  };

  const BadgeCard = ({ badge }) => (
    <Box
      bg={badge.earned ? 'gradient-to-br from-yellow-50 to-orange-50' : 'white'}
      borderWidth="2px"
      borderColor={badge.earned ? 'orange.300' : 'gray.200'}
      borderRadius="2xl"
      p={6}
      position="relative"
      opacity={badge.earned ? 1 : 0.7}
      transition="all 0.3s"
      _hover={{ transform: 'translateY(-4px)', boxShadow: 'xl' }}
    >
      {/* Badge Icon */}
      <VStack spacing={3} align="center">
        <Box
          fontSize="6xl"
          filter={badge.earned ? 'none' : 'grayscale(100%)'}
          transition="all 0.3s"
        >
          {badge.icon}
        </Box>

        {/* Badge Name */}
        <Heading size="md" textAlign="center" color={badge.earned ? 'orange.600' : 'gray.700'}>
          {badge.name}
        </Heading>

        {/* Category Badge */}
        <Badge colorScheme={categoryColors[badge.category]} fontSize="xs" textTransform="uppercase">
          {badge.category}
        </Badge>

        {/* Description */}
        <Text fontSize="sm" color="gray.600" textAlign="center">
          {badge.description}
        </Text>

        {/* Progress Bar (for not earned) */}
        {!badge.earned && (
          <VStack spacing={2} width="100%">
            <Progress
              value={badge.progress}
              colorScheme="orange"
              size="sm"
              borderRadius="full"
              width="100%"
            />
            <HStack justify="space-between" width="100%" fontSize="xs" color="gray.600">
              <Text>Progress: {badge.progress}%</Text>
              {badge.target && (
                <Text>
                  {badge.current} / {badge.target}
                </Text>
              )}
            </HStack>
          </VStack>
        )}

        {/* Earned Date */}
        {badge.earned && badge.earned_at && (
          <VStack spacing={2} width="100%">
            <Text fontSize="xs" color="gray.500">
              🏆 Earned {new Date(badge.earned_at).toLocaleDateString()}
            </Text>
            <ShareButton 
              type="badge" 
              data={badge} 
              variant="button" 
              size="sm" 
              colorScheme="orange" 
            />
          </VStack>
        )}
      </VStack>

      {/* Earned Badge Glow Effect */}
      {badge.earned && (
        <Box
          position="absolute"
          top="-2px"
          right="-2px"
          bg="orange.500"
          color="white"
          borderRadius="full"
          px={3}
          py={1}
          fontSize="xs"
          fontWeight="bold"
          boxShadow="0 0 20px rgba(255, 111, 0, 0.6)"
        >
          ✓ EARNED
        </Box>
      )}
    </Box>
  );

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box textAlign="center">
          <Heading size="2xl" bgGradient="linear(to-r, orange.400, orange.600)" bgClip="text" mb={2}>
            🏆 Achievement Badges
          </Heading>
          <Text color="gray.600" fontSize="lg">
            Earn badges by completing challenges and milestones
          </Text>
          <HStack justify="center" spacing={8} mt={4}>
            <Box>
              <Text fontSize="4xl" fontWeight="bold" color="orange.500">
                {earnedBadges.length}
              </Text>
              <Text fontSize="sm" color="gray.600">
                Earned
              </Text>
            </Box>
            <Box>
              <Text fontSize="4xl" fontWeight="bold" color="blue.500">
                {inProgressBadges.length}
              </Text>
              <Text fontSize="sm" color="gray.600">
                In Progress
              </Text>
            </Box>
            <Box>
              <Text fontSize="4xl" fontWeight="bold" color="gray.400">
                {lockedBadges.length}
              </Text>
              <Text fontSize="sm" color="gray.600">
                Locked
              </Text>
            </Box>
          </HStack>
        </Box>

        {/* Tabs */}
        <Tabs variant="soft-rounded" colorScheme="orange" size="lg">
          <TabList justifyContent="center" mb={8}>
            <Tab>Earned ({earnedBadges.length})</Tab>
            <Tab>In Progress ({inProgressBadges.length})</Tab>
            <Tab>All Badges ({badges.length})</Tab>
          </TabList>

          <TabPanels>
            {/* Earned Badges */}
            <TabPanel>
              {earnedBadges.length === 0 ? (
                <Box textAlign="center" py={12}>
                  <Text fontSize="6xl" mb={4}>
                    🎯
                  </Text>
                  <Text fontSize="xl" color="gray.600">
                    No badges earned yet. Start your journey!
                  </Text>
                </Box>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6}>
                  {earnedBadges.map(badge => (
                    <BadgeCard key={badge.id} badge={badge} />
                  ))}
                </SimpleGrid>
              )}
            </TabPanel>

            {/* In Progress Badges */}
            <TabPanel>
              {inProgressBadges.length === 0 ? (
                <Box textAlign="center" py={12}>
                  <Text fontSize="6xl" mb={4}>
                    💪
                  </Text>
                  <Text fontSize="xl" color="gray.600">
                    Log activities to start earning badges!
                  </Text>
                </Box>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6}>
                  {inProgressBadges.map(badge => (
                    <BadgeCard key={badge.id} badge={badge} />
                  ))}
                </SimpleGrid>
              )}
            </TabPanel>

            {/* All Badges */}
            <TabPanel>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6}>
                {badges.map(badge => (
                  <BadgeCard key={badge.id} badge={badge} />
                ))}
              </SimpleGrid>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Container>
  );
}
