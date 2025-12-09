import React, { useState } from "react";
import {
  Box,
  Heading,
  Input,
  Button,
  VStack,
  FormControl,
  FormLabel,
  useToast,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.username || !form.email || !form.password) {
      toast({
        title: "Missing Fields",
        description: "Please fill all required fields.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoading(true);
      const success = await register(form);
      if (success) {
        toast({
          title: "Registration Successful",
          description: "Please complete your profile to unlock all features.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        navigate("/profile");
      }
    } catch (err) {
      console.error("Registration failed:", err);
      toast({
        title: "Registration Failed",
        description: err.message || "Please try again later.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {/* Hero Section */}
      <Box
        bgGradient="linear(to-br, brand.500, brand.600)"
        color="white"
        py={16}
        px={8}
        textAlign="center"
        mb={-8}
      >
        <Heading
          size="2xl"
          fontWeight="900"
          bgGradient="linear(to-r, energy.500, energy.600)"
          bgClip="text"
          mb={2}
        >
          Start Your Trek!
        </Heading>
        <Box fontSize="lg" opacity={0.9}>
          🌲 Join the community of fitness enthusiasts
        </Box>
      </Box>

      {/* Register Form */}
      <Box
        maxW="md"
        mx="auto"
        mt={-4}
        p={8}
        borderRadius="2xl"
        boxShadow="2xl"
        bg="white"
        border="3px solid"
        borderColor="energy.500"
      >
        <form onSubmit={handleSubmit}>
        <VStack spacing={5}>
          <FormControl isRequired>
            <FormLabel fontWeight="bold" color="brand.500" fontSize={{ base: "md", md: "lg" }}>Username</FormLabel>
            <Input 
              name="username" 
              placeholder="Choose a username" 
              value={form.username} 
              onChange={handleChange} 
              size="lg" 
              focusBorderColor="brand.500" 
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel fontWeight="bold" color="brand.500" fontSize={{ base: "md", md: "lg" }}>Email</FormLabel>
            <Input 
              name="email" 
              type="email" 
              placeholder="your@email.com" 
              value={form.email} 
              onChange={handleChange} 
              size="lg" 
              focusBorderColor="brand.500" 
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel fontWeight="bold" color="brand.500" fontSize={{ base: "md", md: "lg" }}>Password</FormLabel>
            <Input 
              name="password" 
              type="password" 
              placeholder="Min 8 chars (uppercase, lowercase, number)" 
              value={form.password} 
              onChange={handleChange} 
              size="lg" 
              focusBorderColor="brand.500" 
            />
          </FormControl>

          <Button
            type="submit"
            w="full"
            size="lg"
            bgGradient="linear(to-r, energy.500, energy.600)"
            color="white"
            fontWeight="bold"
            fontSize={{ base: "md", md: "lg" }}
            borderRadius="full"
            _hover={{
              bgGradient: "linear(to-r, energy.600, energy.500)",
              transform: "scale(1.02)"
            }}
            isDisabled={loading}
          >
            {loading ? <Spinner size="sm" /> : "🚀 Create Account"}
          </Button>
        </VStack>
      </form>
    </Box>
  </Box>
  );
}
