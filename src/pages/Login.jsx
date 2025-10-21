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
<Heading textAlign="center" mb={6} color="brand.600" _dark={{ color: "brand.300" }}>
Login
</Heading>
<form onSubmit={handleSubmit}>
<VStack spacing={4}>
<FormControl isRequired>
<FormLabel>Username</FormLabel>
<Input name="username" placeholder="Enter your username" value={form.username} onChange={handleChange} />
</FormControl>
      <FormControl isRequired>
        <FormLabel>Password</FormLabel>
        <Input
          name="password"
          type="password"
          placeholder="Enter your password"
          value={form.password}
          onChange={handleChange}
        />
      </FormControl>

      <Button
        type="submit"
        colorScheme="green"
        w="full"
        isDisabled={loading}
      >
        {loading ? <Spinner size="sm" /> : "Login"}
      </Button>
    </VStack>
  </form>
</Box>
);
}