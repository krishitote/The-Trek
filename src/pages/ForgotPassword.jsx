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
  Link as ChakraLink,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ForgotPassword() {
  const [form, setForm] = useState({ username: "", email: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.username || !form.email || !form.newPassword || !form.confirmPassword) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all fields.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please ensure both passwords are identical.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (form.newPassword.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.newPassword)) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters with uppercase, lowercase, and number.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          newPassword: form.newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      setSuccess(true);
      toast({
        title: "Password Reset Successful",
        description: "You can now login with your new password.",
        status: "success",
        duration: 4000,
        isClosable: true,
      });

      // Redirect to login after 3 seconds
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      console.error("Password reset failed:", err);
      toast({
        title: "Reset Failed",
        description: err.message || "Could not reset password. Please check your details.",
        status: "error",
        duration: 4000,
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
          Reset Password
        </Heading>
        <Box fontSize="lg" opacity={0.9}>
          🔒 Secure your account
        </Box>
      </Box>

      {/* Reset Form */}
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
        {success ? (
          <Alert
            status="success"
            variant="subtle"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            borderRadius="lg"
            py={8}
          >
            <AlertIcon boxSize="40px" mr={0} />
            <AlertTitle mt={4} mb={1} fontSize="lg">
              Password Reset Successfully!
            </AlertTitle>
            <AlertDescription maxWidth="sm">
              Redirecting to login page...
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit}>
            <VStack spacing={5}>
              <Text fontSize="sm" color="gray.600" textAlign="center">
                Enter your username and email to reset your password. No email will be sent.
              </Text>

              <FormControl isRequired>
                <FormLabel fontWeight="bold" color="brand.500">Username</FormLabel>
                <Input
                  name="username"
                  placeholder="Your username"
                  value={form.username}
                  onChange={handleChange}
                  size="lg"
                  focusBorderColor="brand.500"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontWeight="bold" color="brand.500">Email</FormLabel>
                <Input
                  name="email"
                  type="email"
                  placeholder="Your email address"
                  value={form.email}
                  onChange={handleChange}
                  size="lg"
                  focusBorderColor="brand.500"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontWeight="bold" color="brand.500">New Password</FormLabel>
                <Input
                  name="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  value={form.newPassword}
                  onChange={handleChange}
                  size="lg"
                  focusBorderColor="brand.500"
                />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Min 8 characters, with uppercase, lowercase, and number
                </Text>
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontWeight="bold" color="brand.500">Confirm Password</FormLabel>
                <Input
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={form.confirmPassword}
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
                  transform: "scale(1.02)",
                }}
                isDisabled={loading}
              >
                {loading ? <Spinner size="sm" /> : "🔒 Reset Password"}
              </Button>

              <Text fontSize="sm" color="gray.600">
                Remember your password?{" "}
                <ChakraLink as={Link} to="/login" color="brand.500" fontWeight="bold">
                  Back to Login
                </ChakraLink>
              </Text>
            </VStack>
          </form>
        )}
      </Box>
    </Box>
  );
}
