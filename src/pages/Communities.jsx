import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Container,
  Heading,
  Input,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Textarea,
  Badge,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
} from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';
import {
  apiGetCommunities,
  apiCreateCommunity,
  apiJoinCommunity,
  apiLeaveCommunity,
  apiGetCommunityLeaderboard,
} from '../services/api';

export default function Communities() {
  const { session, user } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [myCommunities, setMyCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [inviteCode, setInviteCode] = useState('');
  const [newCommunity, setNewCommunity] = useState({ name: '', description: '', is_private: false });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    if (session?.accessToken) {
      fetchCommunities();
    }
  }, [session]);

  const fetchCommunities = async () => {
    try {
      const data = await apiGetCommunities(session.accessToken);
      // Separate user's communities from all communities
      const userCommunityIds = data.filter(c => c.is_member).map(c => c.id);
      setMyCommunities(data.filter(c => c.is_member));
      setCommunities(data);
    } catch (error) {
      toast({
        title: 'Error loading communities',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleCreateCommunity = async () => {
    try {
      const result = await apiCreateCommunity(session.accessToken, newCommunity);
      toast({
        title: 'Community created!',
        description: `Invite code: ${result.invite_code}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setNewCommunity({ name: '', description: '', is_private: false });
      onClose();
      fetchCommunities();
    } catch (error) {
      toast({
        title: 'Error creating community',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleJoinCommunity = async () => {
    try {
      await apiJoinCommunity(session.accessToken, inviteCode);
      toast({
        title: 'Joined community!',
        status: 'success',
        duration: 3000,
      });
      setInviteCode('');
      fetchCommunities();
    } catch (error) {
      toast({
        title: 'Error joining community',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleLeaveCommunity = async (communityId) => {
    try {
      await apiLeaveCommunity(session.accessToken, communityId);
      toast({
        title: 'Left community',
        status: 'info',
        duration: 3000,
      });
      if (selectedCommunity?.id === communityId) {
        setSelectedCommunity(null);
        setLeaderboard([]);
      }
      fetchCommunities();
    } catch (error) {
      toast({
        title: 'Error leaving community',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleViewLeaderboard = async (community) => {
    try {
      setSelectedCommunity(community);
      const data = await apiGetCommunityLeaderboard(community.id);
      setLeaderboard(data);
    } catch (error) {
      toast({
        title: 'Error loading leaderboard',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" className="text-forest-green">Communities & Groups</Heading>
          <Text color="gray.600">Join exclusive communities to compete with groups and climb leaderboards!</Text>
          <Text fontSize="sm" color="orange.600" mt={2}>
            💡 Communities are curated and require registration. Contact admin to register your organization.
          </Text>
        </Box>

        {/* Join with Invite Code */}
        <HStack spacing={4}>
          <Input
            placeholder="Enter invite code to join a community"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            maxW="400px"
          />
          <Button colorScheme="blue" onClick={handleJoinCommunity} isDisabled={!inviteCode}>
            Join with Code
          </Button>
        </HStack>

        {/* My Communities */}
        {myCommunities.length > 0 && (
          <Box>
            <Heading size="md" mb={4}>My Communities</Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {myCommunities.map((community) => (
                <Card key={community.id} borderWidth="2px" borderColor="green.500">
                  <CardHeader pb={2}>
                    <HStack justify="space-between">
                      <Heading size="sm">{community.name}</Heading>
                      {community.is_private && <Badge colorScheme="purple">Private</Badge>}
                    </HStack>
                  </CardHeader>
                  <CardBody pt={0}>
                    <VStack align="stretch" spacing={2}>
                      <Text fontSize="sm" color="gray.600">{community.description}</Text>
                      <StatGroup>
                        <Stat size="sm">
                          <StatLabel>Members</StatLabel>
                          <StatNumber>{community.member_count || 0}</StatNumber>
                        </Stat>
                        <Stat size="sm">
                          <StatLabel>Activities</StatLabel>
                          <StatNumber>{community.activity_count || 0}</StatNumber>
                        </Stat>
                      </StatGroup>
                      {community.is_private && (
                        <Text fontSize="xs" color="blue.600">
                          Code: <strong>{community.invite_code}</strong>
                        </Text>
                      )}
                      <HStack spacing={2} mt={2}>
                        <Button size="sm" colorScheme="blue" onClick={() => handleViewLeaderboard(community)}>
                          Leaderboard
                        </Button>
                        <Button size="sm" colorScheme="red" variant="outline" onClick={() => handleLeaveCommunity(community.id)}>
                          Leave
                        </Button>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </Box>
        )}

        {/* All Public Communities */}
        <Box>
          <Heading size="md" mb={4}>Public Communities</Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {communities.filter(c => !c.is_private && !c.is_member).map((community) => (
              <Card key={community.id}>
                <CardHeader pb={2}>
                  <Heading size="sm">{community.name}</Heading>
                </CardHeader>
                <CardBody pt={0}>
                  <VStack align="stretch" spacing={2}>
                    <Text fontSize="sm" color="gray.600">{community.description}</Text>
                    <StatGroup>
                      <Stat size="sm">
                        <StatLabel>Members</StatLabel>
                        <StatNumber>{community.member_count || 0}</StatNumber>
                      </Stat>
                      <Stat size="sm">
                        <StatLabel>Activities</StatLabel>
                        <StatNumber>{community.activity_count || 0}</StatNumber>
                      </Stat>
                    </StatGroup>
                    <HStack spacing={2} mt={2}>
                      <Button size="sm" colorScheme="blue" onClick={() => handleViewLeaderboard(community)}>
                        View
                      </Button>
                      <Button size="sm" colorScheme="green" onClick={() => apiJoinCommunity(session.accessToken, community.invite_code).then(fetchCommunities)}>
                        Join
                      </Button>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        </Box>

        {/* Community Leaderboard */}
        {selectedCommunity && (
          <Box>
            <Divider my={4} />
            <Heading size="md" mb={4}>{selectedCommunity.name} Leaderboard</Heading>
            <Card>
              <CardBody>
                {leaderboard.length > 0 ? (
                  <VStack align="stretch" spacing={2}>
                    {leaderboard.map((entry, idx) => (
                      <HStack key={entry.user_id} justify="space-between" p={2} bg={idx < 3 ? 'green.50' : 'transparent'} borderRadius="md">
                        <HStack>
                          <Text fontWeight="bold" fontSize="lg" color="gray.500" minW="30px">#{idx + 1}</Text>
                          <Text fontWeight="medium">{entry.username}</Text>
                        </HStack>
                        <HStack spacing={4}>
                          <Stat size="sm" textAlign="center">
                            <StatLabel fontSize="xs">Distance</StatLabel>
                            <StatNumber fontSize="md">{entry.total_distance_km.toFixed(1)} km</StatNumber>
                          </Stat>
                          <Stat size="sm" textAlign="center">
                            <StatLabel fontSize="xs">Activities</StatLabel>
                            <StatNumber fontSize="md">{entry.activity_count}</StatNumber>
                          </Stat>
                        </HStack>
                      </HStack>
                    ))}
                  </VStack>
                ) : (
                  <Text color="gray.500">No activities yet in this community.</Text>
                )}
              </CardBody>
            </Card>
          </Box>
        )}
      </VStack>

      {/* Create Community Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Community</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Community Name</FormLabel>
                <Input
                  value={newCommunity.name}
                  onChange={(e) => setNewCommunity({ ...newCommunity, name: e.target.value })}
                  placeholder="e.g., Ngong Hills Hikers"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={newCommunity.description}
                  onChange={(e) => setNewCommunity({ ...newCommunity, description: e.target.value })}
                  placeholder="Tell others about your community..."
                />
              </FormControl>
              <FormControl display="flex" alignItems="center">
                <input
                  type="checkbox"
                  checked={newCommunity.is_private}
                  onChange={(e) => setNewCommunity({ ...newCommunity, is_private: e.target.checked })}
                  className="mr-2"
                />
                <FormLabel mb={0}>Make Private (invite-only)</FormLabel>
              </FormControl>
              <Button colorScheme="green" w="full" onClick={handleCreateCommunity}>
                Create Community
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  );
}
