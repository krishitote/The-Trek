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
    <Box
      maxW="md"
      mx="auto"
      mt={16}
      p={8}
      borderRadius="xl"
      boxShadow="lg"
      bg="white"
      _dark={{ bg: "gray.700" }}
    >
      <Heading
        textAlign="center"
        mb={6}
        color="brand.600"
        _dark={{ color: "brand.300" }}
      >
        Register
      </Heading>

      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <FormControl isRequired>
            <FormLabel>First Name</FormLabel>
            <Input name="firstName" placeholder="Enter your first name" value={form.firstName} onChange={handleChange} />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Last Name</FormLabel>
            <Input name="lastName" placeholder="Enter your last name" value={form.lastName} onChange={handleChange} />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Username</FormLabel>
            <Input name="username" placeholder="Enter your username" value={form.username} onChange={handleChange} />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Email</FormLabel>
            <Input name="email" type="email" placeholder="Enter your email" value={form.email} onChange={handleChange} />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Password</FormLabel>
            <Input name="password" type="password" placeholder="Enter your password" value={form.password} onChange={handleChange} />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Date of Birth</FormLabel>
            <Input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} />
          </FormControl>

          <FormControl>
            <FormLabel>Gender</FormLabel>
            <Select name="gender" value={form.gender} onChange={handleChange}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel>Weight (kg)</FormLabel>
            <Input name="weight" type="number" placeholder="Enter your weight" value={form.weight} onChange={handleChange} />
          </FormControl>

          <FormControl>
            <FormLabel>Height (cm)</FormLabel>
            <Input name="height" type="number" placeholder="Enter your height" value={form.height} onChange={handleChange} />
          </FormControl>

          <Button type="submit" colorScheme="green" w="full" isDisabled={loading}>
            {loading ? <Spinner size="sm" /> : "Register"}
          </Button>
        </VStack>
      </form>
    </Box>
  );
}
