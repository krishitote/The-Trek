// src/pages/Feed.jsx
import React, { useEffect, useState } from 'react';
import {
  Container,
  VStack,
  HStack,
  Box,
  Text,
  Avatar,
  Button,
  Input,
  IconButton,
  Heading,
  Badge,
  Spinner,
  useToast,
  Collapse,
  Divider,
} from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';
import {
  apiGetFeed,
  apiLikeActivity,
  apiUnlikeActivity,
  apiAddComment,
  apiDeleteComment,
  apiGetActivityComments,
} from '../services/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Feed() {
  const { user, session } = useAuth();
  const toast = useToast();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentTexts, setCommentTexts] = useState({});
  const [showComments, setShowComments] = useState({});
  const [comments, setComments] = useState({});

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    try {
      const data = await apiGetFeed(session.accessToken, 50, 0);
      setActivities(data);
    } catch (err) {
      toast({ title: 'Failed to load feed', status: 'error', duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (activityId, isLiked) => {
    try {
      if (isLiked) {
        await apiUnlikeActivity(session.accessToken, activityId);
      } else {
        await apiLikeActivity(session.accessToken, activityId);
      }
      // Update local state
      setActivities(activities.map(a =>
        a.id === activityId
          ? { ...a, like_count: isLiked ? a.like_count - 1 : a.like_count + 1, is_liked_by_me: !isLiked }
          : a
      ));
    } catch (err) {
      toast({ title: 'Failed to update like', status: 'error', duration: 2000 });
    }
  };

  const loadComments = async (activityId) => {
    try {
      const data = await apiGetActivityComments(activityId);
      setComments(prev => ({ ...prev, [activityId]: data }));
    } catch (err) {
      toast({ title: 'Failed to load comments', status: 'error', duration: 2000 });
    }
  };

  const toggleComments = async (activityId) => {
    const newState = !showComments[activityId];
    setShowComments(prev => ({ ...prev, [activityId]: newState }));
    if (newState && !comments[activityId]) {
      await loadComments(activityId);
    }
  };

  const handleAddComment = async (activityId) => {
    const text = commentTexts[activityId]?.trim();
    if (!text) return;

    try {
      const newComment = await apiAddComment(session.accessToken, activityId, text);
      setComments(prev => ({
        ...prev,
        [activityId]: [newComment, ...(prev[activityId] || [])]
      }));
      setCommentTexts(prev => ({ ...prev, [activityId]: '' }));
      setActivities(activities.map(a =>
        a.id === activityId ? { ...a, comment_count: a.comment_count + 1 } : a
      ));
    } catch (err) {
      toast({ title: 'Failed to add comment', status: 'error', duration: 2000 });
    }
  };

  const handleDeleteComment = async (activityId, commentId) => {
    try {
      await apiDeleteComment(session.accessToken, commentId);
      setComments(prev => ({
        ...prev,
        [activityId]: prev[activityId].filter(c => c.id !== commentId)
      }));
      setActivities(activities.map(a =>
        a.id === activityId ? { ...a, comment_count: a.comment_count - 1 } : a
      ));
    } catch (err) {
      toast({ title: 'Failed to delete comment', status: 'error', duration: 2000 });
    }
  };

  const getActivityIcon = (type) => {
    const icons = { Running: '🏃', Cycling: '🚴', Swimming: '🏊', Walking: '🚶', Hiking: '🥾' };
    return icons[type] || '🏃';
  };

  const getActivityColor = (type) => {
    const colors = { Running: 'green', Cycling: 'orange', Swimming: 'blue', Walking: 'gray', Hiking: 'brown' };
    return colors[type] || 'green';
  };

  if (loading) {
    return (
      <Container maxW="container.md" py={8}>
        <VStack spacing={4}>
          <Spinner size="xl" color="brand.500" />
          <Text>Loading your feed...</Text>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={6} align="stretch">
        <Heading size="xl" bgGradient="linear(to-r, brand.500, orange.500)" bgClip="text">
          🌍 Activity Feed
        </Heading>

        {activities.length === 0 ? (
          <Box textAlign="center" py={12} bg="white" borderRadius="2xl" boxShadow="md">
            <Text fontSize="6xl" mb={4}>👥</Text>
            <Text fontSize="xl" color="gray.600" mb={2}>
              No activities yet
            </Text>
            <Text color="gray.500">
              Follow other users to see their activities here!
            </Text>
          </Box>
        ) : (
          activities.map((activity) => (
            <Box
              key={activity.id}
              bg="white"
              borderRadius="2xl"
              boxShadow="md"
              p={6}
              transition="all 0.3s"
              _hover={{ boxShadow: 'lg' }}
            >
              {/* Header */}
              <HStack spacing={4} mb={4}>
                <Avatar
                  size="md"
                  name={activity.username}
                  src={activity.profile_image ? `${API_URL}${activity.profile_image}` : null}
                />
                <VStack align="start" spacing={0} flex={1}>
                  <Text fontWeight="bold" fontSize="lg">{activity.username}</Text>
                  <Text fontSize="sm" color="gray.600">
                    {new Date(activity.date).toLocaleDateString()} at{' '}
                    {new Date(activity.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </VStack>
                <Badge colorScheme={getActivityColor(activity.type)} fontSize="md" px={3} py={1}>
                  {getActivityIcon(activity.type)} {activity.type}
                </Badge>
              </HStack>

              {/* Activity Stats */}
              <HStack spacing={8} mb={4} p={4} bg="gray.50" borderRadius="xl">
                <VStack spacing={0}>
                  <Text fontSize="xs" color="gray.600">Distance</Text>
                  <Text fontWeight="bold" fontSize="2xl" color="brand.500">
                    {activity.distance_km} km
                  </Text>
                </VStack>
                <VStack spacing={0}>
                  <Text fontSize="xs" color="gray.600">Duration</Text>
                  <Text fontWeight="bold" fontSize="2xl" color="orange.500">
                    {activity.duration_min} min
                  </Text>
                </VStack>
                <VStack spacing={0}>
                  <Text fontSize="xs" color="gray.600">Pace</Text>
                  <Text fontWeight="bold" fontSize="2xl" color="blue.500">
                    {(activity.duration_min / activity.distance_km).toFixed(1)} min/km
                  </Text>
                </VStack>
              </HStack>

              {/* Actions */}
              <HStack spacing={4} mb={showComments[activity.id] ? 4 : 0}>
                <Button
                  size="sm"
                  variant={activity.is_liked_by_me ? 'solid' : 'outline'}
                  colorScheme="red"
                  leftIcon={<Text fontSize="lg">❤️</Text>}
                  onClick={() => handleLike(activity.id, activity.is_liked_by_me)}
                >
                  {activity.like_count || 0}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  colorScheme="blue"
                  leftIcon={<Text fontSize="lg">💬</Text>}
                  onClick={() => toggleComments(activity.id)}
                >
                  {activity.comment_count || 0}
                </Button>
              </HStack>

              {/* Comments Section */}
              <Collapse in={showComments[activity.id]} animateOpacity>
                <Divider mb={4} />
                
                {/* Add Comment */}
                <HStack mb={4}>
                  <Input
                    placeholder="Add a comment..."
                    value={commentTexts[activity.id] || ''}
                    onChange={(e) => setCommentTexts(prev => ({ ...prev, [activity.id]: e.target.value }))}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment(activity.id)}
                    size="sm"
                  />
                  <Button
                    size="sm"
                    colorScheme="blue"
                    onClick={() => handleAddComment(activity.id)}
                    isDisabled={!commentTexts[activity.id]?.trim()}
                  >
                    Post
                  </Button>
                </HStack>

                {/* Comments List */}
                <VStack align="stretch" spacing={3}>
                  {comments[activity.id]?.map((comment) => (
                    <HStack key={comment.id} align="start" p={3} bg="gray.50" borderRadius="lg">
                      <Avatar
                        size="sm"
                        name={comment.username}
                        src={comment.profile_image ? `${API_URL}${comment.profile_image}` : null}
                      />
                      <VStack align="start" spacing={1} flex={1}>
                        <HStack>
                          <Text fontWeight="bold" fontSize="sm">{comment.username}</Text>
                          <Text fontSize="xs" color="gray.500">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </Text>
                        </HStack>
                        <Text fontSize="sm">{comment.comment_text}</Text>
                      </VStack>
                      {comment.user_id === user.id && (
                        <IconButton
                          size="xs"
                          variant="ghost"
                          colorScheme="red"
                          icon={<Text>🗑️</Text>}
                          onClick={() => handleDeleteComment(activity.id, comment.id)}
                        />
                      )}
                    </HStack>
                  ))}
                </VStack>
              </Collapse>
            </Box>
          ))
        )}
      </VStack>
    </Container>
  );
}
