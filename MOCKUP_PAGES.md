# Page Mockups - Nature + Energy Theme

## 1. HOME PAGE (Leaderboards) - Before & After

### Current Look:
- Plain tabs with no styling
- Simple list of names and distances
- Generic teal colors
- No visual hierarchy

### NEW DESIGN:

```jsx
// Hero Section at top
<Box
  bgGradient="linear(to-br, brand.forest, brand.pine)"
  color="white"
  py={16}
  px={8}
  textAlign="center"
  position="relative"
  overflow="hidden"
>
  <Heading
    size="2xl"
    fontWeight="900"
    bgGradient="linear(to-r, energy.sunrise, energy.amber)"
    bgClip="text"
    mb={4}
  >
    The Trek Leaderboard
  </Heading>
  <Text fontSize="xl" opacity={0.9}>
    🌲 Track. Compete. Conquer Nature. 🏔️
  </Text>
</Box>

// Top 3 Podium (All-Time Leaders)
<HStack spacing={8} justify="center" my={12}>
  {/* 2nd Place - Left */}
  <VStack>
    <Box
      bg="gray.100"
      w="80px"
      h="100px"
      borderRadius="lg"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Text fontSize="3xl">🥈</Text>
    </Box>
    <Avatar size="lg" src={user2.profile_image} />
    <Text fontWeight="bold">{user2.username}</Text>
    <Badge colorScheme="gray" fontSize="md">{user2.total_distance} km</Badge>
  </VStack>

  {/* 1st Place - Center (Elevated) */}
  <VStack>
    <Box
      bgGradient="linear(to-br, energy.sunrise, energy.amber)"
      w="100px"
      h="140px"
      borderRadius="lg"
      display="flex"
      alignItems="center"
      justifyContent="center"
      boxShadow="2xl"
    >
      <Text fontSize="4xl">🥇</Text>
    </Box>
    <Avatar size="2xl" src={user1.profile_image} border="4px solid" borderColor="energy.sunrise" />
    <Text fontWeight="black" fontSize="xl">{user1.username}</Text>
    <Badge colorScheme="orange" fontSize="lg">{user1.total_distance} km</Badge>
  </VStack>

  {/* 3rd Place - Right */}
  <VStack>
    <Box
      bg="orange.100"
      w="80px"
      h="80px"
      borderRadius="lg"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Text fontSize="3xl">🥉</Text>
    </Box>
    <Avatar size="lg" src={user3.profile_image} />
    <Text fontWeight="bold">{user3.username}</Text>
    <Badge colorScheme="orange" fontSize="md">{user3.total_distance} km</Badge>
  </VStack>
</HStack>

// Activity Type Cards (replacing tabs)
<SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mt={8}>
  <Box
    bg="white"
    p={6}
    borderRadius="2xl"
    boxShadow="md"
    cursor="pointer"
    transition="all 0.3s"
    _hover={{ transform: "translateY(-4px)", boxShadow: "xl" }}
    border="2px solid"
    borderColor="brand.forest"
  >
    <HStack mb={4}>
      <Text fontSize="3xl">🏃</Text>
      <Heading size="md" color="brand.forest">Running</Heading>
    </HStack>
    <VStack align="start" spacing={2}>
      {runningLeaders.map((user, idx) => (
        <HStack key={user.id} w="full" justify="space-between">
          <HStack>
            <Badge colorScheme="green" borderRadius="full" px={2}>#{idx + 1}</Badge>
            <Text fontWeight="medium">{user.username}</Text>
          </HStack>
          <Text fontWeight="bold" color="brand.forest">{user.total_distance} km</Text>
        </HStack>
      ))}
    </VStack>
  </Box>

  {/* Similar cards for Cycling 🚴 and Swimming 🏊 */}
</SimpleGrid>
```

**Visual Changes:**
- ✨ Gradient hero with motivational tagline
- 🏆 Olympic-style podium for top 3
- 🎯 Activity cards instead of tabs (more engaging)
- 🌈 Forest green borders, sunrise orange accents
- ⬆️ Hover lift animations on cards

---

## 2. DASHBOARD PAGE - Before & After

### Current Look:
- Generic green/purple/blue buttons
- Plain text showing stats
- No visual hierarchy
- Activities in simple list

### NEW DESIGN:

```jsx
// Stats Cards Row at Top
<SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
  {/* Total Distance Card */}
  <Box
    bgGradient="linear(to-br, brand.forest, brand.pine)"
    color="white"
    p={6}
    borderRadius="2xl"
    boxShadow="lg"
  >
    <HStack justify="space-between" mb={2}>
      <Text fontSize="sm" opacity={0.9}>Total Distance</Text>
      <Text fontSize="3xl">🏃</Text>
    </HStack>
    <Heading size="2xl" fontWeight="black">{userRank?.totalDistance || 0}</Heading>
    <Text fontSize="sm" opacity={0.8}>kilometers trekked</Text>
  </Box>

  {/* Global Rank Card */}
  <Box
    bgGradient="linear(to-br, energy.sunrise, energy.amber)"
    color="white"
    p={6}
    borderRadius="2xl"
    boxShadow="lg"
  >
    <HStack justify="space-between" mb={2}>
      <Text fontSize="sm" opacity={0.9}>Global Rank</Text>
      <Text fontSize="3xl">🏆</Text>
    </HStack>
    <Heading size="2xl" fontWeight="black">#{userRank?.rank || "-"}</Heading>
    <Text fontSize="sm" opacity={0.8}>out of {userRank?.totalUsers || 0} trekkers</Text>
  </Box>

  {/* Activities Count Card */}
  <Box
    bgGradient="linear(to-br, sky.azure, sky.cerulean)"
    color="white"
    p={6}
    borderRadius="2xl"
    boxShadow="lg"
  >
    <HStack justify="space-between" mb={2}>
      <Text fontSize="sm" opacity={0.9}>Total Activities</Text>
      <Text fontSize="3xl">📊</Text>
    </HStack>
    <Heading size="2xl" fontWeight="black">{activities.length}</Heading>
    <Text fontSize="sm" opacity={0.8}>logged this month</Text>
  </Box>
</SimpleGrid>

// Energy-Themed Action Buttons
<HStack spacing={4} mb={6}>
  <Button
    size="lg"
    bgGradient="linear(to-r, energy.sunrise, energy.amber)"
    color="white"
    fontWeight="bold"
    borderRadius="full"
    px={8}
    _hover={{
      bgGradient: "linear(to-r, energy.amber, energy.sunrise)",
      transform: "scale(1.05)"
    }}
    leftIcon={<Text fontSize="xl">⚡</Text>}
    onClick={() => setShowSubmitForm(!showSubmitForm)}
  >
    {showSubmitForm ? "Hide" : "Log Activity"}
  </Button>

  <Button
    size="lg"
    variant="outline"
    borderColor="brand.forest"
    color="brand.forest"
    borderRadius="full"
    px={8}
    _hover={{ bg: "brand.forest", color: "white" }}
    leftIcon={<Text fontSize="xl">📈</Text>}
    onClick={() => setShowChart(!showChart)}
  >
    Progress Chart
  </Button>
</HStack>

// Activity Cards (instead of plain list)
<VStack spacing={4} align="stretch">
  {activities.map((activity) => (
    <Box
      key={activity.id}
      bg="white"
      p={5}
      borderRadius="xl"
      boxShadow="md"
      borderLeft="4px solid"
      borderLeftColor={
        activity.type === "Running" ? "brand.forest" :
        activity.type === "Cycling" ? "energy.sunrise" : "sky.azure"
      }
      transition="all 0.2s"
      _hover={{ boxShadow: "lg", transform: "translateX(4px)" }}
    >
      <HStack justify="space-between">
        <HStack spacing={4}>
          <Text fontSize="2xl">
            {activity.type === "Running" ? "🏃" :
             activity.type === "Cycling" ? "🚴" : "🏊"}
          </Text>
          <VStack align="start" spacing={0}>
            <Text fontWeight="bold" fontSize="lg">{activity.type}</Text>
            <Text fontSize="sm" color="gray.600">
              {new Date(activity.date).toLocaleDateString()}
            </Text>
          </VStack>
        </HStack>
        
        <HStack spacing={6}>
          <VStack spacing={0}>
            <Text fontSize="sm" color="gray.600">Distance</Text>
            <Text fontWeight="bold" fontSize="xl" color="brand.forest">
              {activity.distance_km} km
            </Text>
          </VStack>
          <VStack spacing={0}>
            <Text fontSize="sm" color="gray.600">Duration</Text>
            <Text fontWeight="bold" fontSize="xl" color="energy.sunrise">
              {activity.duration_min} min
            </Text>
          </VStack>
        </HStack>
      </HStack>
    </Box>
  ))}
</VStack>
```

**Visual Changes:**
- 📊 Gradient stat cards with icons (replaces plain text)
- ⚡ Energy gradient "Log Activity" button (eye-catching CTA)
- 🎨 Color-coded activity cards by type
- 🖼️ Left border accent on each activity
- ✨ Smooth hover transitions

---

## 3. PROFILE PAGE - Before & After

### Current Look:
- Uses Tailwind classes (inconsistent with Chakra)
- Plain BMI number
- Basic edit form
- No visual feedback

### NEW DESIGN:

```jsx
// Profile Header with Photo
<Box
  bgGradient="linear(to-br, brand.forest, brand.pine)"
  color="white"
  py={12}
  px={8}
  borderRadius="2xl"
  mb={8}
>
  <VStack spacing={4}>
    <Box position="relative">
      <Avatar
        size="2xl"
        src={user.profile_image || "/default-avatar.png"}
        border="6px solid"
        borderColor="energy.sunrise"
        boxShadow="xl"
      />
      <Badge
        position="absolute"
        bottom={0}
        right={0}
        colorScheme="orange"
        fontSize="lg"
        borderRadius="full"
        px={3}
      >
        🏆 Trek Master
      </Badge>
    </Box>
    <Heading size="xl" fontWeight="black">{user.username}</Heading>
    <Text opacity={0.9}>{user.email}</Text>
  </VStack>
</Box>

// Stats Cards with BMI Gauge
<SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
  {/* Weight Card */}
  <Box
    bg="white"
    p={6}
    borderRadius="xl"
    boxShadow="md"
    borderTop="4px solid"
    borderTopColor="brand.forest"
  >
    <VStack spacing={2}>
      <Text fontSize="3xl">⚖️</Text>
      <Text fontSize="sm" color="gray.600">Weight</Text>
      <Heading size="lg" color="brand.forest">{weight || "-"} kg</Heading>
    </VStack>
  </Box>

  {/* Height Card */}
  <Box
    bg="white"
    p={6}
    borderRadius="xl"
    boxShadow="md"
    borderTop="4px solid"
    borderTopColor="energy.sunrise"
  >
    <VStack spacing={2}>
      <Text fontSize="3xl">📏</Text>
      <Text fontSize="sm" color="gray.600">Height</Text>
      <Heading size="lg" color="energy.sunrise">{height || "-"} cm</Heading>
    </VStack>
  </Box>

  {/* BMI Card with Color-Coded Badge */}
  <Box
    bg="white"
    p={6}
    borderRadius="xl"
    boxShadow="md"
    borderTop="4px solid"
    borderTopColor={
      bmi < 18.5 ? "blue.400" :
      bmi < 25 ? "green.400" :
      bmi < 30 ? "orange.400" : "red.400"
    }
  >
    <VStack spacing={2}>
      <Text fontSize="3xl">💪</Text>
      <Text fontSize="sm" color="gray.600">BMI</Text>
      <Heading size="lg">{bmi || "-"}</Heading>
      {bmi && (
        <Badge
          colorScheme={
            bmi < 18.5 ? "blue" :
            bmi < 25 ? "green" :
            bmi < 30 ? "orange" : "red"
          }
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

// Google Fit Integration Card
<Box
  bg="white"
  p={6}
  borderRadius="xl"
  boxShadow="md"
  borderLeft="4px solid"
  borderLeftColor="energy.sunrise"
  mb={8}
>
  <HStack justify="space-between">
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

// Edit Button
{!editing && (
  <Button
    size="lg"
    bgGradient="linear(to-r, energy.sunrise, energy.amber)"
    color="white"
    fontWeight="bold"
    borderRadius="full"
    px={8}
    _hover={{
      bgGradient: "linear(to-r, energy.amber, energy.sunrise)",
      transform: "scale(1.05)"
    }}
    leftIcon={<Text fontSize="xl">✏️</Text>}
    onClick={() => setEditing(true)}
  >
    Edit Profile
  </Button>
)}
```

**Visual Changes:**
- 🌟 Gradient profile header with bordered avatar
- 📊 Color-coded BMI badge (green=healthy, orange=overweight, etc)
- 🎴 Icon-rich stat cards
- 🔗 Google Fit integration card (prominent placement)
- ⚡ Energy gradient edit button
- ✅ Fully Chakra UI (removed all Tailwind)

---

## 4. VISUAL COMPARISON SUMMARY

| Page | Before | After |
|------|--------|-------|
| **Home** | Plain tabs, simple list | Hero section, podium, activity cards with hover |
| **Dashboard** | Generic buttons, text stats | Gradient stat cards, energy CTA, color-coded activities |
| **Profile** | Tailwind styling, plain BMI | Gradient header, BMI gauge, icon cards, Chakra UI |
| **Colors** | Teal/blue/green (generic) | Forest green + Sunrise orange (nature + energy) |
| **Typography** | Default weights | Bold headers (800-900), clear hierarchy |
| **Interactions** | Static | Hover lifts, gradient shifts, smooth transitions |

---

## 🎨 Color Palette Reference

```jsx
// From src/theme.js
brand: {
  forest: "#2e7d32",  // Primary (buttons, headers)
  pine: "#1b5e20",    // Darker variant
}

energy: {
  sunrise: "#ff6f00", // CTAs, accents
  amber: "#ff8f00",   // Hover states
}

sky: {
  azure: "#2196f3",   // Info, swimming activities
  cerulean: "#1976d2" // Darker blue
}

earth: {
  stone: "#9e9e9e",   // Neutral text
  sand: "#d7ccc8",    // Backgrounds
}
```

---

## 🚀 Next Steps

**Review the mockups above and let me know:**
1. ✅ Looks great - implement all pages
2. 🔧 Adjust specific elements (which ones?)
3. 📝 Start with one page first (which page?)
4. 🎨 Change specific colors/layouts

I'm ready to implement when you give the green light! 🌲⚡
