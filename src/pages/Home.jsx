// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Text,
  VStack,
  HStack,
  Spinner,
  Button,
  Divider,
  Flex,
  Stack,
} from "@chakra-ui/react";
import { apiLeaderboards } from "../services/api";

/**
 * Home page: All-Time (top 5 with podium), Activity, Gender tabs.
 * - Fetches /api/leaderboards once and caches results.
 * - Uses client-side filtering for activity/gender lists (no reverting tabs).
 */

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [allTime, setAllTime] = useState([]); // array of { user_id, username, total_distance, ... }
  const [perActivityData, setPerActivityData] = useState([]); // array of { type, user_id, username, total_distance, ... }
  const [perGenderData, setPerGenderData] = useState([]); // array of { gender, user_id, username, total_distance, ... }

  const [activityTypes, setActivityTypes] = useState([]); // unique activity names
  const [genderTypes, setGenderTypes] = useState([]); // unique genders

  const [tabIndex, setTabIndex] = useState(0); // 0=All Time, 1=Activity, 2=Gender

  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedGender, setSelectedGender] = useState(null);

  const [displayedLeaders, setDisplayedLeaders] = useState([]); // leaders shown in the current panel

  // Fetch and cache everything once on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await apiLeaderboards();
        if (cancelled) return;

        const at = data.allTimeLeaders || [];
        const pa = data.perActivity || [];
        const pg = data.perGender || [];

        setAllTime(at);
        setPerActivityData(pa);
        setPerGenderData(pg);

        // extract unique activity and gender types
        setActivityTypes([...new Set(pa.map((r) => r.type).filter(Boolean))]);
        setGenderTypes([...new Set(pg.map((r) => r.gender).filter(Boolean))]);

        // default display: top 5 all-time
        setDisplayedLeaders(at.slice(0, 5));
      } catch (err) {
        console.error("Failed to load leaderboards", err);
        setError("Failed to load leaderboard data");
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // When tab changes, ensure sensible defaults and update displayedLeaders
  useEffect(() => {
    if (tabIndex === 0) {
      setDisplayedLeaders(allTime.slice(0, 5));
      return;
    }

    if (tabIndex === 1) {
      // Activity tab: default to first activity if none selected
      if (!selectedActivity && activityTypes.length > 0) {
        const first = activityTypes[0];
        setSelectedActivity(first);
        const list = perActivityData.filter((r) => r.type === first).slice(0, 10);
        setDisplayedLeaders(list);
      } else if (selectedActivity) {
        setDisplayedLeaders(perActivityData.filter((r) => r.type === selectedActivity).slice(0, 10));
      } else {
        setDisplayedLeaders([]);
      }
      return;
    }

    if (tabIndex === 2) {
      // Gender tab: default to first gender if none selected
      if (!selectedGender && genderTypes.length > 0) {
        const first = genderTypes[0];
        setSelectedGender(first);
        const list = perGenderData.filter((r) => r.gender === first).slice(0, 10);
        setDisplayedLeaders(list);
      } else if (selectedGender) {
        setDisplayedLeaders(perGenderData.filter((r) => r.gender === selectedGender).slice(0, 10));
      } else {
        setDisplayedLeaders([]);
      }
      return;
    }
  }, [
    tabIndex,
    allTime,
    perActivityData,
    perGenderData,
    activityTypes,
    genderTypes,
    selectedActivity,
    selectedGender,
  ]);

  // Handlers to select activity/gender (keeps tabIndex unchanged)
  function handleSelectActivity(type) {
    setSelectedActivity(type);
    const list = perActivityData.filter((r) => r.type === type).slice(0, 10);
    setDisplayedLeaders(list);
  }

  function handleSelectGender(g) {
    setSelectedGender(g);
    const list = perGenderData.filter((r) => r.gender === g).slice(0, 10);
    setDisplayedLeaders(list);
  }

  // Helpers to render lists / podium
  const renderPodium = (arr) => {
    // arr is allTime array; ensure at least empty placeholders
    const top5 = arr.slice(0, 5);
    const top3 = top5.slice(0, 3);

    // helper to get display values
    const name = (u) => u?.username || u?.name || "Anonymous";
    const pts = (u) => (u?.total_distance ?? u?.total ?? 0);

    return (
      <Box mb={6}>
        <Flex justify="center" align="flex-end" gap={6}>
          {/* Silver */}
          <Box textAlign="center">
            <Box borderTopRadius="md" bg="gray.200" px={3} py={2} fontWeight="bold">
              🥈
            </Box>
            <Box
              w="80px"
              h="120px"
              bg="gray.50"
              borderTop="6px solid"
              borderColor="gray.400"
              display="flex"
              flexDirection="column"
              justifyContent="center"
              alignItems="center"
              borderBottomRadius="md"
            >
              <Text fontWeight="semibold">{name(top3[1])}</Text>
              <Text fontSize="sm" color="gray.600">{pts(top3[1])}</Text>
            </Box>
          </Box>

          {/* Gold (center) */}
          <Box textAlign="center">
            <Box borderTopRadius="md" bg="yellow.300" px={4} py={2} fontWeight="bold">
              🥇
            </Box>
            <Box
              w="100px"
              h="160px"
              bg="yellow.50"
              borderTop="6px solid"
              borderColor="yellow.400"
              display="flex"
              flexDirection="column"
              justifyContent="center"
              alignItems="center"
              borderBottomRadius="md"
            >
              <Text fontWeight="semibold">{name(top3[0])}</Text>
              <Text fontSize="sm" color="gray.700">{pts(top3[0])}</Text>
            </Box>
          </Box>

          {/* Bronze */}
          <Box textAlign="center">
            <Box borderTopRadius="md" bg="orange.200" px={3} py={2} fontWeight="bold">
              🥉
            </Box>
            <Box
              w="80px"
              h="100px"
              bg="orange.50"
              borderTop="6px solid"
              borderColor="orange.400"
              display="flex"
              flexDirection="column"
              justifyContent="center"
              alignItems="center"
              borderBottomRadius="md"
            >
              <Text fontWeight="semibold">{name(top3[2])}</Text>
              <Text fontSize="sm" color="gray.600">{pts(top3[2])}</Text>
            </Box>
          </Box>
        </Flex>
      </Box>
    );
  };

  const renderList = (arr, limit = 10) => {
    if (!arr || arr.length === 0) {
      return <Text color="gray.500">No data available</Text>;
    }
    return (
      <VStack spacing={3} align="stretch" mt={4}>
        {arr.slice(0, limit).map((u, i) => (
          <Flex
            key={u.user_id ?? u.id ?? `${i}-${u.username ?? "u"}`}
            justify="space-between"
            align="center"
            p={3}
            bg={i < 3 ? "teal.50" : "white"}
            borderRadius="md"
            boxShadow="sm"
          >
            <Text fontWeight={i < 3 ? "semibold" : "normal"}>
              #{i + 1} {u.username ?? u.name ?? "Anonymous"}
            </Text>
            <Text color="teal.600" fontWeight="semibold">
              {(u.total_distance ?? u.total ?? 0).toFixed ? (Number(u.total_distance ?? u.total ?? 0)).toFixed(2) : (u.total_distance ?? u.total ?? 0)}
            </Text>
          </Flex>
        ))}
      </VStack>
    );
  };

  // UI
  if (loading) {
    return (
      <Box textAlign="center" mt={8}>
        <Spinner size="lg" color="teal.500" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" mt={8}>
        <Text color="red.500">{error}</Text>
      </Box>
    );
  }

  return (
    <Box maxW="900px" mx="auto" p={6}>
      <Heading textAlign="center" mb={6} color="teal.600">
        Leaderboards
      </Heading>

      <Tabs index={tabIndex} onChange={(i) => setTabIndex(i)} isFitted variant="enclosed-colored" colorScheme="teal">
        <TabList mb={4}>
          <Tab fontWeight="bold">All Time</Tab>
          <Tab fontWeight="bold">Activity</Tab>
          <Tab fontWeight="bold">Gender</Tab>
        </TabList>

        <TabPanels>
          {/* All Time */}
          <TabPanel>
            <Heading size="md" mb={3}>🏆 Top 5 — All Time</Heading>
            {renderPodium(allTime)}
            <Divider my={4} />
            {renderList(allTime.slice(0, 5), 5)}
          </TabPanel>

          {/* Activity */}
          <TabPanel>
            <Heading size="md" mb={3}>💪 Leaders by Activity</Heading>

            <HStack spacing={3} wrap="wrap" mb={4}>
              {activityTypes.length === 0 ? (
                <Text color="gray.500">No activity types available</Text>
              ) : (
                activityTypes.map((t) => (
                  <Button
                    key={t}
                    size="sm"
                    colorScheme={selectedActivity === t ? "teal" : "gray"}
                    variant={selectedActivity === t ? "solid" : "outline"}
                    onClick={() => handleSelectActivity(t)}
                  >
                    {t}
                  </Button>
                ))
              )}
            </HStack>

            <Divider mb={3} />
            <Text fontSize="sm" color="gray.600" mb={2}>
              {selectedActivity ? `${selectedActivity} leaders` : "Select an activity"}
            </Text>
            {renderList(displayedLeaders, 10)}
          </TabPanel>

          {/* Gender */}
          <TabPanel>
            <Heading size="md" mb={3}>🚹🚺 Leaders by Gender</Heading>

            <HStack spacing={3} mb={4}>
              {genderTypes.length === 0 ? (
                <Text color="gray.500">No gender data</Text>
              ) : (
                genderTypes.map((g) => (
                  <Button
                    key={g}
                    size="sm"
                    colorScheme={selectedGender === g ? "teal" : "gray"}
                    variant={selectedGender === g ? "solid" : "outline"}
                    onClick={() => handleSelectGender(g)}
                  >
                    {g}
                  </Button>
                ))
              )}
            </HStack>

            <Divider mb={3} />
            <Text fontSize="sm" color="gray.600" mb={2}>
              {selectedGender ? `${selectedGender} leaders` : "Select a gender"}
            </Text>
            {renderList(displayedLeaders, 10)}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}