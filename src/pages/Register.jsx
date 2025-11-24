import React, { useState } from "react";
import {
  Box,
  Heading,
  Input,
  Button,
  VStack,
  FormControl,
  FormLabel,
  Select,
  useToast,
  Spinner,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    dateOfBirth: "",
    gender: "Male",
    weight: "",
    height: "",
  });

  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const calculateAge = (dob) => {
    const birthDate = new Date(dob);
    const diffMs = Date.now() - birthDate.getTime();
    const ageDt = new Date(diffMs);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.firstName ||
      !form.lastName ||
      !form.username ||
      !form.email ||
      !form.password ||
      !form.dateOfBirth
    ) {
      toast({
        title: "Missing Fields",
        description: "Please fill all required fields.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const payload = {
      firstName: form.firstName,
      lastName: form.lastName,
      username: form.username,
      email: form.email,
      password: form.password,
      gender: form.gender,
      age: calculateAge(form.dateOfBirth),
      weight: form.weight ? Number(form.weight) : null,
      height: form.height ? Number(form.height) : null,
    };

    try {
      setLoading(true);
      const success = await register(payload);
      if (success) {
        toast({
          title: "Registration Successful",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
        navigate("/dashboard");
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
        bgGradient="linear(to-br, brand.forest, brand.pine)"
        color="white"
        py={16}
        px={8}
        textAlign="center"
        mb={-8}
      >
        <Heading
          size="2xl"
          fontWeight="900"
          bgGradient="linear(to-r, energy.sunrise, energy.amber)"
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
        borderColor="energy.sunrise"
      >
        <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <FormControl isRequired>
            <FormLabel fontWeight="bold" color="brand.forest">First Name</FormLabel>
            <Input name="firstName" placeholder="Enter your first name" value={form.firstName} onChange={handleChange} size="lg" focusBorderColor="brand.forest" />
          </FormControl>

          <FormControl isRequired>
            <FormLabel fontWeight="bold" color="brand.forest">Last Name</FormLabel>
            <Input name="lastName" placeholder="Enter your last name" value={form.lastName} onChange={handleChange} size="lg" focusBorderColor="brand.forest" />
          </FormControl>

          <FormControl isRequired>
            <FormLabel fontWeight="bold" color="brand.forest">Username</FormLabel>
            <Input name="username" placeholder="Enter your username" value={form.username} onChange={handleChange} size="lg" focusBorderColor="brand.forest" />
          </FormControl>

          <FormControl isRequired>
            <FormLabel fontWeight="bold" color="brand.forest">Email</FormLabel>
            <Input name="email" type="email" placeholder="Enter your email" value={form.email} onChange={handleChange} size="lg" focusBorderColor="brand.forest" />
          </FormControl>

          <FormControl isRequired>
            <FormLabel fontWeight="bold" color="brand.forest">Password</FormLabel>
            <Input name="password" type="password" placeholder="Enter your password" value={form.password} onChange={handleChange} size="lg" focusBorderColor="brand.forest" />
          </FormControl>

          <FormControl isRequired>
            <FormLabel fontWeight="bold" color="brand.forest">Date of Birth</FormLabel>
            <Input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} size="lg" focusBorderColor="brand.forest" />
          </FormControl>

          <FormControl>
            <FormLabel fontWeight="bold" color="brand.forest">Gender</FormLabel>
            <Select name="gender" value={form.gender} onChange={handleChange} size="lg" focusBorderColor="brand.forest">
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel fontWeight="bold" color="brand.forest">Weight (kg)</FormLabel>
            <Input name="weight" type="number" placeholder="Enter your weight" value={form.weight} onChange={handleChange} size="lg" focusBorderColor="brand.forest" />
          </FormControl>

          <FormControl>
            <FormLabel fontWeight="bold" color="brand.forest">Height (cm)</FormLabel>
            <Input name="height" type="number" placeholder="Enter your height" value={form.height} onChange={handleChange} size="lg" focusBorderColor="brand.forest" />
          </FormControl>

          <Button
            type="submit"
            w="full"
            size="lg"
            bgGradient="linear(to-r, energy.sunrise, energy.amber)"
            color="white"
            fontWeight="bold"
            borderRadius="full"
            _hover={{
              bgGradient: "linear(to-r, energy.amber, energy.sunrise)",
              transform: "scale(1.02)"
            }}
            isDisabled={loading}
          >
            {loading ? <Spinner size="sm" /> : "🚀 Register"}
          </Button>
        </VStack>
      </form>
    </Box>
  </Box>
  );
}
