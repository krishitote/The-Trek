// src/App.jsx
import { Routes, Route, Link, Navigate } from "react-router-dom";
import {
  Box,
  Flex,
  Heading,
  Button,
  IconButton,
  Text,
  HStack,
  useColorMode,
} from "@chakra-ui/react";
import { SunIcon, MoonIcon } from "@chakra-ui/icons";

import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Communities from "./pages/Communities";
import Championship from "./pages/Championship";
import Badges from "./pages/Badges";
import Feed from "./pages/Feed";
import AdminDashboard from "./pages/AdminDashboard";
import InstallPWA from "./components/InstallPWA";
import { useAuth } from "./context/AuthContext";

function App() {
  const { user, logout } = useAuth();
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Box
      minH="100vh"
      bg={colorMode === "light" ? "green.50" : "gray.800"}
      transition="background-color 0.3s ease"
      p={6}
    >
      {/* HEADER */}
      <Flex
        as="header"
        direction={{ base: "column", md: "row" }}
        align="center"
        justify="space-between"
        gap={4}
        mb={10}
        p={4}
        bg={colorMode === "light" ? "white" : "gray.700"}
        borderRadius="2xl"
        boxShadow="md"
      >
        <Heading
          size="lg"
          color={colorMode === "light" ? "green.600" : "green.200"}
          _hover={{ color: "green.700" }}
          transition="color 0.2s"
        >
          <Link to="/" style={{ textDecoration: "none" }}>
            The Trek
          </Link>
        </Heading>

        <HStack spacing={3} flexWrap="wrap">
          <Button as={Link} to="/" colorScheme="green" size="sm">
            Home
          </Button>

          {user ? (
            <>
              <Button as={Link} to="/dashboard" colorScheme="gray" size="sm">
                Dashboard
              </Button>
              <Button as={Link} to="/feed" colorScheme="gray" size="sm">
                🌍 Feed
              </Button>
              <Button as={Link} to="/badges" colorScheme="gray" size="sm">
                🏆 Badges
              </Button>
              {user.is_admin && (
                <Button as={Link} to="/admin" colorScheme="red" size="sm">
                  🔒 Admin
                </Button>
              )}
              <Button as={Link} to="/profile" colorScheme="gray" variant="solid" size="sm">
                {user.username}
              </Button>
              <Button colorScheme="red" size="sm" onClick={logout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button as={Link} to="/login" colorScheme="blue" size="sm">
                Login
              </Button>
              <Button as={Link} to="/register" colorScheme="blue" variant="outline" size="sm">
                Register
              </Button>
            </>
          )}

          <InstallPWA variant="icon" size="sm" colorScheme="green" />
          <IconButton
            aria-label="Toggle color mode"
            icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
            onClick={toggleColorMode}
            variant="ghost"
            size="sm"
          />
        </HStack>
      </Flex>

      {/* MAIN CONTENT */}
      <Box maxW="6xl" mx="auto">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" replace />} />
          <Route path="/feed" element={user ? <Feed /> : <Navigate to="/login" replace />} />
          <Route path="/badges" element={user ? <Badges /> : <Navigate to="/login" replace />} />
          <Route path="/admin" element={user ? <AdminDashboard /> : <Navigate to="/login" replace />} />
          <Route path="/communities" element={user ? <Communities /> : <Navigate to="/login" replace />} />
          <Route path="/championship" element={user ? <Championship /> : <Navigate to="/login" replace />} />
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" replace />} />
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/" replace />} />
        </Routes>
      </Box>

      {/* FOOTER */}
      <Box as="footer" mt={12} textAlign="center" opacity={0.6}>
        <Text fontSize="sm">
          © {new Date().getFullYear()} The Trek. All rights reserved.
        </Text>
      </Box>
    </Box>
  );
}

export default App;
