// src/pages/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardBody,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Input,
  HStack,
  VStack,
  Text,
  Badge,
  useToast,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  useDisclosure,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  apiGetAdminStats,
  apiGetUserGrowth,
  apiGetActivityTrends,
  apiGetTopUsers,
  apiGetAdminUsers,
  apiMakeUserAdmin,
  apiRemoveUserAdmin,
  apiDeleteUser,
  apiGetAdminChampionships,
  apiCreateChampionship,
  apiUpdateChampionship,
  apiDeleteChampionship,
} from '../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

export default function AdminDashboard() {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [userGrowth, setUserGrowth] = useState([]);
  const [activityTrends, setActivityTrends] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  
  // User Management
  const [users, setUsers] = useState([]);
  const [usersPagination, setUsersPagination] = useState({});
  const [usersSearch, setUsersSearch] = useState('');
  const [usersPage, setUsersPage] = useState(1);
  
  // Championships
  const [championships, setChampionships] = useState([]);
  const [championshipForm, setChampionshipForm] = useState({ name: '', description: '', start_date: '', end_date: '', is_active: true });
  const [editingChampionship, setEditingChampionship] = useState(null);
  const { isOpen: isChampModalOpen, onOpen: onChampModalOpen, onClose: onChampModalClose } = useDisclosure();

  useEffect(() => {
    // Check if user is admin
    if (!user || !user.is_admin) {
      toast({
        title: 'Access Denied',
        description: 'You do not have admin privileges',
        status: 'error',
        duration: 3000,
      });
      navigate('/');
      return;
    }

    loadAdminData();
  }, [user]);

  const loadAdminData = async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    try {
      const [statsData, growthData, trendsData, topUsersData] = await Promise.all([
        apiGetAdminStats(session.accessToken),
        apiGetUserGrowth(session.accessToken),
        apiGetActivityTrends(session.accessToken),
        apiGetTopUsers(session.accessToken, 10),
      ]);
      setStats(statsData);
      setUserGrowth(growthData);
      setActivityTrends(trendsData);
      setTopUsers(topUsersData);
    } catch (err) {
      console.error('Failed to load admin data:', err);
      toast({
        title: 'Error loading admin data',
        description: err.message,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async (page = 1) => {
    try {
      const data = await apiGetAdminUsers(session.accessToken, page, 20, usersSearch);
      setUsers(data.users);
      setUsersPagination(data.pagination);
      setUsersPage(page);
    } catch (err) {
      toast({ title: 'Error loading users', description: err.message, status: 'error', duration: 3000 });
    }
  };

  const handleMakeAdmin = async (userId) => {
    try {
      await apiMakeUserAdmin(session.accessToken, userId);
      toast({ title: 'User granted admin privileges', status: 'success', duration: 2000 });
      loadUsers(usersPage);
    } catch (err) {
      toast({ title: 'Error', description: err.message, status: 'error', duration: 3000 });
    }
  };

  const handleRemoveAdmin = async (userId) => {
    try {
      await apiRemoveUserAdmin(session.accessToken, userId);
      toast({ title: 'Admin privileges removed', status: 'success', duration: 2000 });
      loadUsers(usersPage);
    } catch (err) {
      toast({ title: 'Error', description: err.message, status: 'error', duration: 3000 });
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await apiDeleteUser(session.accessToken, userId);
      toast({ title: 'User deleted', status: 'success', duration: 2000 });
      loadUsers(usersPage);
    } catch (err) {
      toast({ title: 'Error', description: err.message, status: 'error', duration: 3000 });
    }
  };

  const loadChampionships = async () => {
    try {
      const data = await apiGetAdminChampionships(session.accessToken);
      setChampionships(data);
    } catch (err) {
      toast({ title: 'Error loading championships', description: err.message, status: 'error', duration: 3000 });
    }
  };

  const handleCreateChampionship = async () => {
    try {
      await apiCreateChampionship(session.accessToken, championshipForm);
      toast({ title: 'Championship created', status: 'success', duration: 2000 });
      setChampionshipForm({ name: '', description: '', start_date: '', end_date: '', is_active: true });
      onChampModalClose();
      loadChampionships();
    } catch (err) {
      toast({ title: 'Error', description: err.message, status: 'error', duration: 3000 });
    }
  };

  const handleUpdateChampionship = async () => {
    try {
      await apiUpdateChampionship(session.accessToken, editingChampionship.id, championshipForm);
      toast({ title: 'Championship updated', status: 'success', duration: 2000 });
      setEditingChampionship(null);
      setChampionshipForm({ name: '', description: '', start_date: '', end_date: '', is_active: true });
      onChampModalClose();
      loadChampionships();
    } catch (err) {
      toast({ title: 'Error', description: err.message, status: 'error', duration: 3000 });
    }
  };

  const handleDeleteChampionship = async (id) => {
    if (!window.confirm('Delete this championship?')) return;
    try {
      await apiDeleteChampionship(session.accessToken, id);
      toast({ title: 'Championship deleted', status: 'success', duration: 2000 });
      loadChampionships();
    } catch (err) {
      toast({ title: 'Error', description: err.message, status: 'error', duration: 3000 });
    }
  };

  const openEditChampionshipModal = (champ) => {
    setEditingChampionship(champ);
    setChampionshipForm({
      name: champ.name || champ.title,
      description: champ.description,
      start_date: champ.start_date,
      end_date: champ.end_date,
      is_active: champ.is_active,
    });
    onChampModalOpen();
  };

  const openCreateChampionshipModal = () => {
    setEditingChampionship(null);
    setChampionshipForm({ name: '', description: '', start_date: '', end_date: '', is_active: true });
    onChampModalOpen();
  };

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={4}>
          <Spinner size="xl" color="brand.500" />
          <Text>Loading admin dashboard...</Text>
        </VStack>
      </Container>
    );
  }

  // Chart Data
  const userGrowthChartData = {
    labels: userGrowth.map(d => new Date(d.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })),
    datasets: [
      {
        label: 'Total Users',
        data: userGrowth.map(d => d.cumulative_users),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
      },
      {
        label: 'New Users',
        data: userGrowth.map(d => d.new_users),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.4,
      },
    ],
  };

  const activityTrendsChartData = {
    labels: activityTrends.map(d => new Date(d.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Activities',
        data: activityTrends.map(d => d.activity_count),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
      },
    ],
  };

  return (
    <Container maxW="container.xl" py={8}>
      <Heading mb={6} bgGradient="linear(to-r, brand.500, energy.500)" bgClip="text">
        🔒 Admin Dashboard
      </Heading>

      <Tabs isLazy>
        <TabList>
          <Tab>📊 Overview</Tab>
          <Tab onClick={() => loadUsers(1)}>👥 Users</Tab>
          <Tab onClick={() => loadChampionships()}>🏆 Championships</Tab>
        </TabList>

        <TabPanels>
          {/* Overview Tab */}
          <TabPanel>
            {stats && (
              <>
                <Heading size="md" mb={4}>Platform Statistics</Heading>
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={8}>
                  <Card>
                    <CardBody>
                      <Stat>
                        <StatLabel>Total Users</StatLabel>
                        <StatNumber color="brand.500">{stats.total_users}</StatNumber>
                        <StatHelpText>+{stats.new_users_30d} this month</StatHelpText>
                      </Stat>
                    </CardBody>
                  </Card>
                  <Card>
                    <CardBody>
                      <Stat>
                        <StatLabel>Total Activities</StatLabel>
                        <StatNumber color="energy.500">{stats.total_activities}</StatNumber>
                        <StatHelpText>+{stats.activities_30d} this month</StatHelpText>
                      </Stat>
                    </CardBody>
                  </Card>
                  <Card>
                    <CardBody>
                      <Stat>
                        <StatLabel>Total Distance</StatLabel>
                        <StatNumber color="blue.500">{parseFloat(stats.total_distance).toFixed(0)} km</StatNumber>
                        <StatHelpText>+{parseFloat(stats.distance_30d).toFixed(0)} km this month</StatHelpText>
                      </Stat>
                    </CardBody>
                  </Card>
                  <Card>
                    <CardBody>
                      <Stat>
                        <StatLabel>Total Calories</StatLabel>
                        <StatNumber color="orange.500">{parseInt(stats.total_calories).toLocaleString()}</StatNumber>
                        <StatHelpText>+{parseInt(stats.calories_30d).toLocaleString()} this month</StatHelpText>
                      </Stat>
                    </CardBody>
                  </Card>
                </SimpleGrid>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={8}>
                  <Card>
                    <CardBody>
                      <Stat>
                        <StatLabel>Active Users (30d)</StatLabel>
                        <StatNumber>{stats.active_users_30d}</StatNumber>
                        <StatHelpText>7d: {stats.active_users_7d}</StatHelpText>
                      </Stat>
                    </CardBody>
                  </Card>
                  <Card>
                    <CardBody>
                      <Stat>
                        <StatLabel>Engagement</StatLabel>
                        <StatNumber>{stats.total_likes + stats.total_comments}</StatNumber>
                        <StatHelpText>{stats.total_likes} likes, {stats.total_comments} comments</StatHelpText>
                      </Stat>
                    </CardBody>
                  </Card>
                </SimpleGrid>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={8}>
                  <Card>
                    <CardBody>
                      <Heading size="sm" mb={4}>User Growth (12 months)</Heading>
                      <Line data={userGrowthChartData} />
                    </CardBody>
                  </Card>
                  <Card>
                    <CardBody>
                      <Heading size="sm" mb={4}>Activity Trends (30 days)</Heading>
                      <Bar data={activityTrendsChartData} />
                    </CardBody>
                  </Card>
                </SimpleGrid>

                <Card>
                  <CardBody>
                    <Heading size="sm" mb={4}>Top 10 Users</Heading>
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>User</Th>
                          <Th isNumeric>Activities</Th>
                          <Th isNumeric>Distance</Th>
                          <Th isNumeric>Calories</Th>
                          <Th isNumeric>Badges</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {topUsers.map(u => (
                          <Tr key={u.id}>
                            <Td>
                              {u.username}
                              {u.is_admin && <Badge ml={2} colorScheme="red">Admin</Badge>}
                            </Td>
                            <Td isNumeric>{u.activity_count}</Td>
                            <Td isNumeric>{parseFloat(u.total_distance).toFixed(1)} km</Td>
                            <Td isNumeric>{parseInt(u.total_calories).toLocaleString()}</Td>
                            <Td isNumeric>{u.badge_count}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </CardBody>
                </Card>
              </>
            )}
          </TabPanel>

          {/* Users Tab */}
          <TabPanel>
            <HStack mb={4} spacing={4}>
              <Input
                placeholder="Search users..."
                value={usersSearch}
                onChange={(e) => setUsersSearch(e.target.value)}
                maxW="400px"
              />
              <Button colorScheme="brand" onClick={() => loadUsers(1)}>Search</Button>
            </HStack>

            <Card>
              <CardBody>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Username</Th>
                      <Th>Email</Th>
                      <Th>Joined</Th>
                      <Th isNumeric>Activities</Th>
                      <Th>Status</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {users.map(u => (
                      <Tr key={u.id}>
                        <Td>
                          {u.first_name} {u.last_name} (@{u.username})
                        </Td>
                        <Td>{u.email}</Td>
                        <Td>{new Date(u.created_at).toLocaleDateString()}</Td>
                        <Td isNumeric>{u.activity_count}</Td>
                        <Td>
                          {u.is_admin && <Badge colorScheme="red">Admin</Badge>}
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            {!u.is_admin ? (
                              <Button size="xs" colorScheme="green" onClick={() => handleMakeAdmin(u.id)}>
                                Make Admin
                              </Button>
                            ) : (
                              u.id !== user.id && (
                                <Button size="xs" colorScheme="orange" onClick={() => handleRemoveAdmin(u.id)}>
                                  Remove Admin
                                </Button>
                              )
                            )}
                            {u.id !== user.id && (
                              <Button size="xs" colorScheme="red" onClick={() => handleDeleteUser(u.id)}>
                                Delete
                              </Button>
                            )}
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>

                {usersPagination.totalPages > 1 && (
                  <HStack mt={4} justify="center">
                    <Button
                      size="sm"
                      onClick={() => loadUsers(usersPage - 1)}
                      disabled={usersPage === 1}
                    >
                      Previous
                    </Button>
                    <Text>Page {usersPage} of {usersPagination.totalPages}</Text>
                    <Button
                      size="sm"
                      onClick={() => loadUsers(usersPage + 1)}
                      disabled={usersPage === usersPagination.totalPages}
                    >
                      Next
                    </Button>
                  </HStack>
                )}
              </CardBody>
            </Card>
          </TabPanel>

          {/* Championships Tab */}
          <TabPanel>
            <Button colorScheme="brand" mb={4} onClick={openCreateChampionshipModal}>
              + Create Championship
            </Button>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {championships.map(champ => (
                <Card key={champ.id}>
                  <CardBody>
                    <HStack justify="space-between" mb={2}>
                      <Heading size="sm">{champ.name || champ.title}</Heading>
                      <Badge colorScheme={champ.is_active ? 'green' : 'gray'}>
                        {champ.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </HStack>
                    <Text fontSize="sm" color="gray.600" mb={2}>{champ.description}</Text>
                    <Text fontSize="xs">
                      {new Date(champ.start_date).toLocaleDateString()} - {new Date(champ.end_date).toLocaleDateString()}
                    </Text>
                    <HStack mt={4} spacing={2}>
                      <Button size="sm" colorScheme="blue" onClick={() => openEditChampionshipModal(champ)}>
                        Edit
                      </Button>
                      <Button size="sm" colorScheme="red" onClick={() => handleDeleteChampionship(champ.id)}>
                        Delete
                      </Button>
                    </HStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Championship Modal */}
      <Modal isOpen={isChampModalOpen} onClose={onChampModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editingChampionship ? 'Edit' : 'Create'} Championship</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Name</FormLabel>
                <Input value={championshipForm.name} onChange={(e) => setChampionshipForm({...championshipForm, name: e.target.value})} />
              </FormControl>
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Input value={championshipForm.description} onChange={(e) => setChampionshipForm({...championshipForm, description: e.target.value})} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Start Date</FormLabel>
                <Input type="date" value={championshipForm.start_date} onChange={(e) => setChampionshipForm({...championshipForm, start_date: e.target.value})} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>End Date</FormLabel>
                <Input type="date" value={championshipForm.end_date} onChange={(e) => setChampionshipForm({...championshipForm, end_date: e.target.value})} />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onChampModalClose}>Cancel</Button>
            <Button colorScheme="brand" onClick={editingChampionship ? handleUpdateChampionship : handleCreateChampionship}>
              {editingChampionship ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
}
