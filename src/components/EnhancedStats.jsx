// src/components/EnhancedStats.jsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardBody,
  Heading,
  Text,
  VStack,
  HStack,
  Progress,
  Badge,
  Button,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  useToast,
  Spinner,
  Divider,
} from '@chakra-ui/react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  apiGetPersonalRecords,
  apiGetWeeklyProgress,
  apiGetMonthlyProgress,
  apiGetActivityBreakdown,
  apiGetWeeklyGoal,
  apiSetWeeklyGoal,
} from '../services/api';
import { useAuth } from '../context/AuthContext';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function EnhancedStats() {
  const { session } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState(null);
  const [weeklyProgress, setWeeklyProgress] = useState([]);
  const [monthlyProgress, setMonthlyProgress] = useState([]);
  const [activityBreakdown, setActivityBreakdown] = useState([]);
  const [weeklyGoal, setWeeklyGoal] = useState(null);
  const [newGoal, setNewGoal] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    try {
      const [recordsData, weeklyData, monthlyData, breakdownData, goalData] = await Promise.all([
        apiGetPersonalRecords(session.accessToken),
        apiGetWeeklyProgress(session.accessToken),
        apiGetMonthlyProgress(session.accessToken),
        apiGetActivityBreakdown(session.accessToken),
        apiGetWeeklyGoal(session.accessToken),
      ]);
      setRecords(recordsData);
      setWeeklyProgress(weeklyData);
      setMonthlyProgress(monthlyData);
      setActivityBreakdown(breakdownData);
      setWeeklyGoal(goalData);
    } catch (err) {
      console.error('Failed to load stats:', err);
      toast({
        title: 'Error loading stats',
        description: err.message,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetGoal = async () => {
    const goal = parseFloat(newGoal);
    if (isNaN(goal) || goal <= 0) {
      toast({ title: 'Invalid goal', status: 'error', duration: 2000 });
      return;
    }
    try {
      await apiSetWeeklyGoal(session.accessToken, goal);
      await loadData();
      onClose();
      toast({ title: 'Goal set successfully!', status: 'success', duration: 2000 });
    } catch (err) {
      toast({ title: 'Failed to set goal', status: 'error', duration: 2000 });
    }
  };

  if (loading) {
    return (
      <VStack py={8}>
        <Spinner size="xl" color="brand.500" />
        <Text>Loading your stats...</Text>
      </VStack>
    );
  }

  // Weekly progress chart
  const weeklyChartData = {
    labels: weeklyProgress.map((w) => new Date(w.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Distance (km)',
        data: weeklyProgress.map((w) => parseFloat(w.total_distance) || 0),
        borderColor: 'rgb(46, 125, 50)',
        backgroundColor: 'rgba(46, 125, 50, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Monthly progress chart
  const monthlyChartData = {
    labels: monthlyProgress.map((m) => new Date(m.month_start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })),
    datasets: [
      {
        label: 'Distance (km)',
        data: monthlyProgress.map((m) => parseFloat(m.total_distance) || 0),
        backgroundColor: 'rgba(255, 111, 0, 0.8)',
      },
    ],
  };

  // Activity breakdown doughnut
  const activityColors = {
    Running: 'rgba(46, 125, 50, 0.8)',
    Cycling: 'rgba(255, 111, 0, 0.8)',
    Swimming: 'rgba(33, 150, 243, 0.8)',
    Walking: 'rgba(120, 120, 109, 0.8)',
    Hiking: 'rgba(139, 69, 19, 0.8)',
  };

  const breakdownChartData = {
    labels: activityBreakdown.map((a) => a.type),
    datasets: [
      {
        data: activityBreakdown.map((a) => parseFloat(a.total_distance) || 0),
        backgroundColor: activityBreakdown.map((a) => activityColors[a.type] || 'rgba(200, 200, 200, 0.8)'),
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'bottom' },
    },
  };

  return (
    <VStack spacing={6} align="stretch">
      {/* Weekly Goal Card */}
      {weeklyGoal && (
        <Card bg="gradient-to-br from-orange-50 to-orange-100" borderWidth="2px" borderColor="orange.300">
          <CardBody>
            <HStack justify="space-between" mb={3}>
              <VStack align="start" spacing={0}>
                <Heading size="sm" color="orange.700">
                  🎯 Weekly Goal
                </Heading>
                <Text fontSize="xs" color="gray.600">
                  {weeklyGoal.activity_count} activities this week
                </Text>
              </VStack>
              <Button size="sm" colorScheme="orange" onClick={onOpen}>
                Update
              </Button>
            </HStack>
            <Progress
              value={parseFloat(weeklyGoal.percentage) || 0}
              colorScheme="orange"
              size="lg"
              borderRadius="full"
              mb={2}
            />
            <HStack justify="space-between">
              <Text fontSize="lg" fontWeight="bold" color="orange.700">
                {parseFloat(weeklyGoal.current || 0).toFixed(1)} / {parseFloat(weeklyGoal.goal || 0).toFixed(1)} km
              </Text>
              <Badge colorScheme="orange" fontSize="md" px={3} py={1} borderRadius="full">
                {parseFloat(weeklyGoal.percentage || 0).toFixed(0)}%
              </Badge>
            </HStack>
            {weeklyGoal.remaining > 0 && (
              <Text fontSize="sm" color="gray.600" mt={2}>
                💪 {parseFloat(weeklyGoal.remaining).toFixed(1)} km to go!
              </Text>
            )}
          </CardBody>
        </Card>
      )}

      {/* Personal Records */}
      {records && (
        <Card>
          <CardBody>
            <Heading size="md" mb={4} color="brand.600">
              🏆 Personal Records
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <Stat>
                <StatLabel>Longest Distance</StatLabel>
                <StatNumber color="green.600">{parseFloat(records.longest_distance || 0).toFixed(2)} km</StatNumber>
                <StatHelpText>
                  {records.longest_distance_type} • {records.longest_distance_date ? new Date(records.longest_distance_date).toLocaleDateString() : 'N/A'}
                </StatHelpText>
              </Stat>
              <Stat>
                <StatLabel>Fastest Pace</StatLabel>
                <StatNumber color="orange.600">{parseFloat(records.fastest_pace || 0).toFixed(2)} min/km</StatNumber>
                <StatHelpText>
                  {records.fastest_pace_date ? new Date(records.fastest_pace_date).toLocaleDateString() : 'N/A'}
                </StatHelpText>
              </Stat>
              <Stat>
                <StatLabel>Longest Duration</StatLabel>
                <StatNumber color="blue.600">{parseFloat(records.longest_duration || 0).toFixed(0)} min</StatNumber>
                <StatHelpText>
                  {records.longest_duration_date ? new Date(records.longest_duration_date).toLocaleDateString() : 'N/A'}
                </StatHelpText>
              </Stat>
            </SimpleGrid>
            <Divider my={4} />
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <Stat>
                <StatLabel>Total Distance</StatLabel>
                <StatNumber>{parseFloat(records.total_distance || 0).toFixed(1)} km</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Total Activities</StatLabel>
                <StatNumber>{parseInt(records.total_activities || 0)}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Total Time</StatLabel>
                <StatNumber>{(parseFloat(records.total_duration || 0) / 60).toFixed(1)} hrs</StatNumber>
              </Stat>
            </SimpleGrid>
          </CardBody>
        </Card>
      )}

      {/* Charts Grid */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        {/* Weekly Progress Line Chart */}
        <Card>
          <CardBody>
            <Heading size="sm" mb={4} color="brand.600">
              📈 Weekly Progress (Last 8 Weeks)
            </Heading>
            <Box height="250px">
              <Line data={weeklyChartData} options={chartOptions} />
            </Box>
          </CardBody>
        </Card>

        {/* Monthly Progress Bar Chart */}
        <Card>
          <CardBody>
            <Heading size="sm" mb={4} color="orange.600">
              📊 Monthly Progress (Last 6 Months)
            </Heading>
            <Box height="250px">
              <Bar data={monthlyChartData} options={chartOptions} />
            </Box>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Activity Breakdown */}
      {activityBreakdown.length > 0 && (
        <Card>
          <CardBody>
            <Heading size="sm" mb={4} color="blue.600">
              🎯 Activity Breakdown
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              <Box height="250px">
                <Doughnut data={breakdownChartData} options={chartOptions} />
              </Box>
              <VStack align="stretch" spacing={3}>
                {activityBreakdown.map((activity) => (
                  <HStack key={activity.type} justify="space-between" p={3} bg="gray.50" borderRadius="md">
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="bold">{activity.type}</Text>
                      <Text fontSize="sm" color="gray.600">
                        {parseInt(activity.count)} activities
                      </Text>
                    </VStack>
                    <VStack align="end" spacing={0}>
                      <Text fontWeight="bold" color="brand.600">
                        {parseFloat(activity.total_distance || 0).toFixed(1)} km
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        Avg: {parseFloat(activity.avg_distance || 0).toFixed(1)} km
                      </Text>
                    </VStack>
                  </HStack>
                ))}
              </VStack>
            </SimpleGrid>
          </CardBody>
        </Card>
      )}

      {/* Goal Setting Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Set Weekly Distance Goal</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <Text fontSize="sm" color="gray.600">
                Set your weekly distance target in kilometers
              </Text>
              <Input
                type="number"
                placeholder="Enter goal (km)"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                size="lg"
              />
              <Button colorScheme="orange" width="full" onClick={handleSetGoal}>
                Set Goal
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </VStack>
  );
}
