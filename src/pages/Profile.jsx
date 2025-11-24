// src/pages/Profile.jsx
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import GoogleFitConnect from "../components/GoogleFitConnect";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Input,
  Avatar,
  Badge,
  SimpleGrid,
  Container,
  useToast,
} from "@chakra-ui/react";

export default function Profile() {
  const { user, session, setUser } = useAuth();
  const toast = useToast();
  const [weight, setWeight] = useState(user?.weight || "");
  const [height, setHeight] = useState(user?.height || "");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);

  // Calculate BMI
  const calculateBMI = (w, h) => {
    if (!w || !h) return null;
    const heightM = h / 100;
    return (w / (heightM * heightM)).toFixed(1);
  };

  const getBMICategory = (bmi) => {
    if (!bmi) return null;
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal";
    if (bmi < 30) return "Overweight";
    return "Obese";
  };

  const getBMIColor = (bmi) => {
    if (!bmi) return "gray";
    if (bmi < 18.5) return "blue";
    if (bmi < 25) return "green";
    if (bmi < 30) return "orange";
    return "red";
  };

  const handleSave = async () => {
    if (!weight || !height) {
      toast({
        title: "Missing information",
        description: "Please enter both weight and height.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/users/${user.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.accessToken}`,
          },
          body: JSON.stringify({ weight: Number(weight), height: Number(height) }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");
      setUser(data);
      localStorage.setItem("user", JSON.stringify(data));
      toast({
        title: "Success!",
        description: "Profile updated successfully!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setEditing(false);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: err.message || "Failed to update profile",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append("photo", selectedFile);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.accessToken}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        const updatedUser = { ...user, profile_image: data.profile_image };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setSelectedFile(null);
        setPreview(null);
        toast({
          title: "Success!",
          description: "Photo uploaded successfully!",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to upload photo",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Error uploading photo",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (!user) {
    return (
      <Box textAlign="center" mt={10}>
        <Text color="gray.500">Loading profile...</Text>
      </Box>
    );
  }

  const bmi = calculateBMI(weight, height);

  return (
    <Box>
      {/* Profile Header with Gradient Background */}
      <Box
        bgGradient="linear(to-br, brand.500, brand.600)"
        color="white"
        py={12}
        px={8}
        mb={8}
      >
        <Container maxW="container.xl">
          <VStack spacing={4}>
            <Box position="relative">
              <Avatar
                size="2xl"
                name={user.username}
                src={preview || (user.profile_image ? `${import.meta.env.VITE_API_URL}${user.profile_image}` : undefined)}
                border="6px solid"
                borderColor="energy.500"
                boxShadow="xl"
              />
              <Badge
                position="absolute"
                bottom={0}
                right={0}
                colorScheme="orange"
                fontSize="md"
                borderRadius="full"
                px={3}
              >
                🏆 Trekker
              </Badge>
            </Box>
            <Heading size="xl" fontWeight="black">{user.username}</Heading>
            <Text opacity={0.9}>{user.email}</Text>
            
            {/* Photo Upload */}
            <VStack spacing={2}>
              <Input
                type="file"
                accept="image/*"
                id="photo-upload"
                display="none"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  setSelectedFile(file);
                  setPreview(URL.createObjectURL(file));
                }}
              />
              <Button
                as="label"
                htmlFor="photo-upload"
                size="sm"
                variant="outline"
                borderColor="white"
                color="white"
                _hover={{ bg: "whiteAlpha.200" }}
                cursor="pointer"
              >
                📷 Choose Photo
              </Button>
              {selectedFile && (
                <Button
                  size="sm"
                  bgGradient="linear(to-r, energy.500, energy.600)"
                  color="white"
                  _hover={{
                    bgGradient: "linear(to-r, energy.600, energy.500)",
                  }}
                  onClick={handlePhotoUpload}
                >
                  Upload Photo
                </Button>
              )}
            </VStack>
          </VStack>
        </Container>
      </Box>

      <Container maxW="container.xl" pb={12}>
        {/* Stats Cards with Health Metrics */}
        <Heading size="lg" mb={6} color="brand.500">
          📊 Health Stats
        </Heading>
        
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
          {/* Weight Card */}
          <Box
            bg="white"
            p={6}
            borderRadius="xl"
            boxShadow="md"
            borderTop="4px solid"
            borderTopColor="brand.500"
          >
            <VStack spacing={3}>
              <Text fontSize="4xl">⚖️</Text>
              <Text fontSize="sm" color="gray.600" fontWeight="medium">Weight</Text>
              {editing ? (
                <Input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  size="lg"
                  textAlign="center"
                  fontWeight="bold"
                  color="brand.500"
                />
              ) : (
                <Heading size="lg" color="brand.500">
                  {weight || "N/A"} {weight && "kg"}
                </Heading>
              )}
            </VStack>
          </Box>

          {/* Height Card */}
          <Box
            bg="white"
            p={6}
            borderRadius="xl"
            boxShadow="md"
            borderTop="4px solid"
            borderTopColor="energy.500"
          >
            <VStack spacing={3}>
              <Text fontSize="4xl">📏</Text>
              <Text fontSize="sm" color="gray.600" fontWeight="medium">Height</Text>
              {editing ? (
                <Input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  size="lg"
                  textAlign="center"
                  fontWeight="bold"
                  color="energy.500"
                />
              ) : (
                <Heading size="lg" color="energy.500">
                  {height || "N/A"} {height && "cm"}
                </Heading>
              )}
            </VStack>
          </Box>

          {/* BMI Card with Color-Coded Status */}
          <Box
            bg="white"
            p={6}
            borderRadius="xl"
            boxShadow="md"
            borderTop="4px solid"
            borderTopColor={`${getBMIColor(bmi)}.400`}
          >
            <VStack spacing={3}>
              <Text fontSize="4xl">💪</Text>
              <Text fontSize="sm" color="gray.600" fontWeight="medium">BMI</Text>
              <Heading size="lg" color={`${getBMIColor(bmi)}.600`}>
                {bmi || "N/A"}
              </Heading>
              {bmi && (
                <Badge
                  colorScheme={getBMIColor(bmi)}
                  fontSize="sm"
                  px={3}
                  borderRadius="full"
                >
                  {getBMICategory(bmi)}
                </Badge>
              )}
            </VStack>
          </Box>
        </SimpleGrid>

        {/* User Info Section */}
        <Box
          bg="white"
          p={6}
          borderRadius="xl"
          boxShadow="md"
          mb={6}
        >
          <Heading size="md" mb={4} color="brand.500">
            👤 Personal Information
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <Box>
              <Text fontSize="sm" color="gray.600">Full Name</Text>
              <Text fontWeight="bold">
                {user.first_name} {user.last_name}
              </Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="gray.600">Username</Text>
              <Text fontWeight="bold">{user.username}</Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="gray.600">Email</Text>
              <Text fontWeight="bold">{user.email}</Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="gray.600">Age</Text>
              <Text fontWeight="bold">{user.age || "N/A"} years</Text>
            </Box>
          </SimpleGrid>
        </Box>

        {/* Google Fit Integration */}
        <Box
          bg="white"
          p={6}
          borderRadius="xl"
          boxShadow="md"
          borderLeft="4px solid"
          borderLeftColor="energy.500"
          mb={8}
        >
          <HStack justify="space-between" flexWrap="wrap">
            <HStack spacing={4}>
              <Text fontSize="3xl">📱</Text>
              <VStack align="start" spacing={0}>
                <Text fontWeight="bold" fontSize="lg">Google Fit Sync</Text>
                <Text fontSize="sm" color="gray.600">
                  Automatically sync your activities
                </Text>
              </VStack>
            </HStack>
            <GoogleFitConnect />
          </HStack>
        </Box>

        {/* Action Buttons */}
        <HStack spacing={4} justify="center" flexWrap="wrap">
          {editing ? (
            <>
              <Button
                size="lg"
                bgGradient="linear(to-r, brand.500, brand.600)"
                color="white"
                fontWeight="bold"
                borderRadius="full"
                px={8}
                _hover={{
                  bgGradient: "linear(to-r, brand.600, brand.500)",
                }}
                onClick={handleSave}
                isLoading={loading}
                leftIcon={<Text fontSize="xl">✅</Text>}
              >
                Save Changes
              </Button>
              <Button
                size="lg"
                variant="outline"
                borderColor="gray.400"
                color="gray.700"
                borderRadius="full"
                px={8}
                _hover={{ bg: "gray.100" }}
                onClick={() => setEditing(false)}
                leftIcon={<Text fontSize="xl">❌</Text>}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              size="lg"
              bgGradient="linear(to-r, energy.500, energy.600)"
              color="white"
              fontWeight="bold"
              borderRadius="full"
              px={8}
              _hover={{
                bgGradient: "linear(to-r, energy.600, energy.500)",
                transform: "scale(1.05)"
              }}
              leftIcon={<Text fontSize="xl">✏️</Text>}
              onClick={() => setEditing(true)}
            >
              Edit Profile
            </Button>
          )}
        </HStack>
      </Container>
    </Box>
  );
}