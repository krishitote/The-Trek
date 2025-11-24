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
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
const [form, setForm] = useState({ username: "", password: "" });
const [loading, setLoading] = useState(false);
const { login } = useAuth();
const navigate = useNavigate();
const toast = useToast();

const handleChange = (e) =>
setForm({ ...form, [e.target.name]: e.target.value });

const handleSubmit = async (e) => {
e.preventDefault();
if (!form.username || !form.password) {
toast({
title: "Missing Fields",
description: "Please fill in all fields.",
status: "warning",
duration: 3000,
isClosable: true,
});
return;
}
try {
  setLoading(true);
  await login(form);
  navigate("/dashboard");
  toast({
    title: "Login Successful",
    status: "success",
    duration: 2000,
    isClosable: true,
  });
} catch (err) {
  console.error("Login failed:", err);
  toast({
    title: "Login Failed",
    description: err.message || "Invalid credentials.",
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
      Welcome Back, Trekker!
    </Heading>
    <Box fontSize="lg" opacity={0.9}>
      🏔️ Continue your fitness journey
    </Box>
  </Box>

  {/* Login Form */}
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
          <FormLabel fontWeight="bold" color="brand.500">Username</FormLabel>
          <Input
            name="username"
            placeholder="Enter your username"
            value={form.username}
            onChange={handleChange}
            size="lg"
            focusBorderColor="brand.500"
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel fontWeight="bold" color="brand.500">Password</FormLabel>
          <Input
            name="password"
            type="password"
            placeholder="Enter your password"
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
          borderRadius="full"
          _hover={{
            bgGradient: "linear(to-r, energy.600, energy.500)",
            transform: "scale(1.02)"
          }}
          isDisabled={loading}
        >
          {loading ? <Spinner size="sm" /> : "🚀 Login"}
        </Button>
      </VStack>
    </form>
  </Box>
</Box>
);
}