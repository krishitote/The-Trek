import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  useToast,
  Badge,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';
import {
  apiGetCurrentChampionship,
  apiGetChampionshipQualifiers,
  apiGetMyChampionshipStatus,
  apiRegisterForChampionship,
  apiContributeToChampionship,
} from '../services/api';

export default function Championship() {
  const { session, user } = useAuth();
  const [championship, setChampionship] = useState(null);
  const [qualifiers, setQualifiers] = useState({ male: [], female: [] });
  const [myStatus, setMyStatus] = useState(null);
  const [contributionAmount, setContributionAmount] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    fetchData();
  }, [session]);

  const fetchData = async () => {
    try {
      const [champData, qualifierData, statusData] = await Promise.all([
        apiGetCurrentChampionship(),
        apiGetChampionshipQualifiers(),
        session?.accessToken ? apiGetMyChampionshipStatus(session.accessToken) : null,
      ]);
      setChampionship(champData);
      setQualifiers(qualifierData);
      setMyStatus(statusData);
    } catch (error) {
      console.error('Error loading championship data:', error);
    }
  };

  const handleRegister = async () => {
    try {
      await apiRegisterForChampionship(session.accessToken);
      toast({
        title: 'Registered for Grand Finale!',
        description: 'Payment of Ksh 500 will be processed. See you at the event!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      fetchData();
    } catch (error) {
      toast({
        title: 'Registration failed',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleContribute = async () => {
    try {
      const amount = parseFloat(contributionAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount');
      }
      await apiContributeToChampionship(session.accessToken, amount);
      toast({
        title: 'Thank you!',
        description: `Contributed Ksh ${amount} to the prize pool`,
        status: 'success',
        duration: 3000,
      });
      setContributionAmount('');
      onClose();
      fetchData();
    } catch (error) {
      toast({
        title: 'Contribution failed',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-KE', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box textAlign="center">
          <Heading size="xl" className="text-forest-green" mb={2}>
            🏆 Grand Finale Championship {championship?.year}
          </Heading>
          <Text fontSize="lg" color="gray.600">
            Top 10 athletes per gender compete physically for the ultimate glory!
          </Text>
        </Box>

        {/* Championship Info */}
        {championship && (
          <Card bg="gradient-to-r from-green-50 to-blue-50">
            <CardBody>
              <VStack spacing={4}>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} w="full">
                  <Stat>
                    <StatLabel>Prize Pool</StatLabel>
                    <StatNumber className="text-sunrise-orange">
                      Ksh {championship.total_prize_pool?.toLocaleString() || '0'}
                    </StatNumber>
                    <StatHelpText>From registrations + contributions</StatHelpText>
                  </Stat>
                  <Stat>
                    <StatLabel>Event Date</StatLabel>
                    <StatNumber fontSize="lg">
                      {championship.event_date ? formatDate(championship.event_date) : 'TBA'}
                    </StatNumber>
                    <StatHelpText>Mark your calendar!</StatHelpText>
                  </Stat>
                  <Stat>
                    <StatLabel>Registration Fee</StatLabel>
                    <StatNumber>Ksh {championship.registration_fee || 500}</StatNumber>
                    <StatHelpText>For qualified participants</StatHelpText>
                  </Stat>
                </SimpleGrid>
                
                <Divider />
                
                <HStack spacing={4}>
                  <Button colorScheme="orange" onClick={onOpen}>
                    Contribute to Prize Pool
                  </Button>
                  <Text fontSize="sm" color="gray.600">
                    {championship.contributor_count || 0} supporters so far
                  </Text>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* User Status */}
        {myStatus && (
          <Alert 
            status={myStatus.is_qualified ? 'success' : 'info'} 
            variant="left-accent"
          >
            <AlertIcon />
            <Box>
              <AlertTitle>Your Status</AlertTitle>
              <AlertDescription>
                {myStatus.is_qualified ? (
                  <>
                    🎉 You're in the top 10 for {myStatus.gender === 'male' ? 'Men' : 'Women'}! 
                    Current rank: <strong>#{myStatus.current_rank}</strong> with <strong>{myStatus.total_distance_km} km</strong>.
                    {!myStatus.is_registered && (
                      <Button size="sm" colorScheme="green" ml={4} onClick={handleRegister}>
                        Register Now (Ksh {championship?.registration_fee || 500})
                      </Button>
                    )}
                    {myStatus.is_registered && <Badge ml={2} colorScheme="green">Registered ✓</Badge>}
                  </>
                ) : (
                  <>
                    Keep pushing! You're currently ranked <strong>#{myStatus.current_rank}</strong> with <strong>{myStatus.total_distance_km} km</strong>.
                    {myStatus.distance_to_top_10 && ` You need ${myStatus.distance_to_top_10} km more to reach top 10.`}
                  </>
                )}
              </AlertDescription>
            </Box>
          </Alert>
        )}

        {/* Qualifiers - Men */}
        <Box>
          <Heading size="md" mb={4} className="text-sky-blue">👨 Top 10 Men</Heading>
          <Card>
            <CardBody>
              {qualifiers.male && qualifiers.male.length > 0 ? (
                <VStack align="stretch" spacing={2}>
                  {qualifiers.male.map((athlete, idx) => (
                    <HStack 
                      key={athlete.user_id} 
                      justify="space-between" 
                      p={3} 
                      bg={idx === 0 ? 'yellow.100' : idx < 3 ? 'green.50' : 'gray.50'}
                      borderRadius="md"
                      borderWidth={idx === 0 ? '2px' : '1px'}
                      borderColor={idx === 0 ? 'yellow.400' : 'gray.200'}
                    >
                      <HStack spacing={4}>
                        <Text fontWeight="bold" fontSize="xl" minW="40px">
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                        </Text>
                        <Box>
                          <Text fontWeight="medium" fontSize="lg">{athlete.username}</Text>
                          {athlete.is_registered && <Badge colorScheme="green" size="sm">Registered</Badge>}
                        </Box>
                      </HStack>
                      <VStack align="end" spacing={0}>
                        <Text fontWeight="bold" fontSize="lg" className="text-forest-green">
                          {athlete.total_distance_km.toFixed(1)} km
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          {athlete.activity_count} activities
                        </Text>
                      </VStack>
                    </HStack>
                  ))}
                </VStack>
              ) : (
                <Text color="gray.500">No qualifiers yet. Start logging activities!</Text>
              )}
            </CardBody>
          </Card>
        </Box>

        {/* Qualifiers - Women */}
        <Box>
          <Heading size="md" mb={4} className="text-pink-500">👩 Top 10 Women</Heading>
          <Card>
            <CardBody>
              {qualifiers.female && qualifiers.female.length > 0 ? (
                <VStack align="stretch" spacing={2}>
                  {qualifiers.female.map((athlete, idx) => (
                    <HStack 
                      key={athlete.user_id} 
                      justify="space-between" 
                      p={3} 
                      bg={idx === 0 ? 'yellow.100' : idx < 3 ? 'pink.50' : 'gray.50'}
                      borderRadius="md"
                      borderWidth={idx === 0 ? '2px' : '1px'}
                      borderColor={idx === 0 ? 'yellow.400' : 'gray.200'}
                    >
                      <HStack spacing={4}>
                        <Text fontWeight="bold" fontSize="xl" minW="40px">
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                        </Text>
                        <Box>
                          <Text fontWeight="medium" fontSize="lg">{athlete.username}</Text>
                          {athlete.is_registered && <Badge colorScheme="green" size="sm">Registered</Badge>}
                        </Box>
                      </HStack>
                      <VStack align="end" spacing={0}>
                        <Text fontWeight="bold" fontSize="lg" className="text-forest-green">
                          {athlete.total_distance_km.toFixed(1)} km
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          {athlete.activity_count} activities
                        </Text>
                      </VStack>
                    </HStack>
                  ))}
                </VStack>
              ) : (
                <Text color="gray.500">No qualifiers yet. Start logging activities!</Text>
              )}
            </CardBody>
          </Card>
        </Box>

        {/* Event Details */}
        <Card>
          <CardHeader>
            <Heading size="md">How It Works</Heading>
          </CardHeader>
          <CardBody>
            <VStack align="stretch" spacing={3}>
              <Text>
                <strong>1. Qualify:</strong> Be in the top 10 all-time distance leaders for your gender by December 31st.
              </Text>
              <Text>
                <strong>2. Register:</strong> Pay Ksh {championship?.registration_fee || 500} to confirm your spot at the Grand Finale.
              </Text>
              <Text>
                <strong>3. Compete:</strong> Face off physically with other top athletes in an epic challenge.
              </Text>
              <Text>
                <strong>4. Win:</strong> Take home your share of the prize pool - winner takes the largest portion!
              </Text>
              <Divider />
              <Text fontSize="sm" color="gray.600">
                💡 Even if you're not competing, you can support the event by contributing to the prize pool!
              </Text>
            </VStack>
          </CardBody>
        </Card>
      </VStack>

      {/* Contribution Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Contribute to Prize Pool</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <Text>Support the Grand Finale and help grow the prize pool for our champions!</Text>
              <FormControl isRequired>
                <FormLabel>Amount (Ksh)</FormLabel>
                <Input
                  type="number"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="1"
                />
              </FormControl>
              <Button colorScheme="orange" w="full" onClick={handleContribute}>
                Contribute
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  );
}
