# 🌲 The Trek - Nature + Energy Design System

**Theme Philosophy**: Where Forest Meets Sunrise  
**Keywords**: Organic, Vibrant, Movement, Grounding, Energetic

---

## 🎨 Color Palette

### Primary: Deep Forest Green 🌲
**Use for**: Main branding, primary actions, navigation
```
brand.500: #2e7d32 (Deep Forest)
- Grounding
- Connection to nature
- Reliability
- Growth

Light shades: Misty morning → Fresh leaf
Dark shades: Pine tree → Deep woods
```

### Secondary: Sunrise Orange 🔥
**Use for**: CTAs, achievements, energy indicators, activity highlights
```
energy.500: #ff6f00 (Intense Energy)
- Vitality
- Movement
- Achievement
- Motivation

From dawn (#fff3e0) to burning ember (#bf360c)
```

### Accent: Sky Blue ☁️
**Use for**: Links, info, calm sections
```
sky.500: #2196f3 (Clear Sky)
- Freedom
- Clarity
- Progress
- Openness
```

### Supporting: Earth Tones 🏔️
**Use for**: Backgrounds, subtle elements, text
```
earth.500: #78786d (Stone)
- Natural
- Balanced
- Professional
```

---

## 🖼️ Visual Style Guide

### 1. **Hero Section** (Homepage)
```jsx
// Example implementation
<Box
  h="100vh"
  bgGradient="linear(to-br, brand.600, brand.800)"
  position="relative"
  overflow="hidden"
>
  {/* Animated particles or subtle forest background */}
  <Box
    position="absolute"
    top="0"
    left="0"
    right="0"
    bottom="0"
    bgImage="url('/forest-texture.svg')"
    opacity="0.1"
    backgroundSize="cover"
  />
  
  <VStack spacing={6} pt="20vh" px={8}>
    <Heading 
      fontSize="6xl" 
      color="white"
      fontWeight="900"
      textShadow="0 4px 20px rgba(0,0,0,0.3)"
    >
      Your Fitness Journey,{' '}
      <Text as="span" color="energy.300">Elevated</Text>
    </Heading>
    
    <Text fontSize="xl" color="whiteAlpha.900" maxW="600px" textAlign="center">
      Track your adventures. Compete with friends. Connect with nature.
    </Text>
    
    <Button 
      size="lg" 
      variant="energy"
      rightIcon={<Icon as={FiArrowRight} />}
      mt={4}
    >
      Start Your Trek
    </Button>
  </VStack>
</Box>
```

### 2. **Dashboard Cards** (Activity Stats)
```jsx
<Card
  bg="white"
  borderTop="4px solid"
  borderTopColor="energy.500"
  boxShadow="brand"
  _hover={{
    transform: "translateY(-8px)",
    boxShadow: "energy",
  }}
>
  <CardBody>
    <HStack spacing={4}>
      {/* Icon with gradient background */}
      <Box
        p={3}
        borderRadius="full"
        bgGradient="linear(135deg, energy.400, energy.600)"
      >
        <Icon as={FiActivity} color="white" boxSize={6} />
      </Box>
      
      <VStack align="start" spacing={0}>
        <Text fontSize="3xl" fontWeight="900" color="brand.700">
          127.5
        </Text>
        <Text fontSize="sm" color="earth.500">
          Total KM This Week
        </Text>
      </VStack>
    </HStack>
  </CardBody>
</Card>
```

### 3. **Activity Buttons**
```jsx
// Primary action (Submit Activity)
<Button
  colorScheme="energy"
  variant="energy"  // Custom gradient variant
  size="lg"
  leftIcon={<Icon as={FiPlus} />}
>
  Log Activity
</Button>

// Secondary action
<Button
  colorScheme="brand"
  variant="outline"
  size="lg"
>
  View History
</Button>
```

### 4. **Leaderboard** (Nature-themed)
```jsx
<VStack spacing={4} align="stretch">
  {/* Top 3 get special treatment */}
  <Box
    p={6}
    bg="linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)"  // Gold
    borderRadius="2xl"
    position="relative"
    overflow="hidden"
  >
    {/* Mountain peak icon in background */}
    <Icon 
      as={FiMountain} 
      position="absolute"
      right="-20px"
      top="-20px"
      boxSize="120px"
      color="whiteAlpha.200"
    />
    
    <HStack justify="space-between">
      <HStack spacing={4}>
        <Badge colorScheme="yellow" fontSize="xl" p={2}>🏆 #1</Badge>
        <Avatar name="John Doe" size="lg" />
        <VStack align="start" spacing={0}>
          <Text fontWeight="900" fontSize="xl">John Doe</Text>
          <Text fontSize="sm" color="whiteAlpha.800">285.4 km</Text>
        </VStack>
      </HStack>
    </HStack>
  </Box>
  
  {/* Regular entries */}
  <Box
    p={4}
    bg="white"
    borderRadius="xl"
    borderLeft="4px solid"
    borderLeftColor="brand.400"
  >
    {/* ... */}
  </Box>
</VStack>
```

### 5. **Progress Charts** (Nature colors)
```jsx
// Chart.js configuration
const chartOptions = {
  backgroundColor: [
    'rgba(46, 125, 50, 0.8)',   // Forest green
    'rgba(255, 111, 0, 0.8)',   // Energy orange
    'rgba(33, 150, 243, 0.8)',  // Sky blue
    'rgba(120, 120, 109, 0.6)', // Earth
  ],
  borderColor: [
    '#2e7d32',
    '#ff6f00',
    '#2196f3',
    '#78786d',
  ],
  // Gradient fill
  plugins: {
    filler: {
      propagate: true,
    }
  }
};
```

---

## 🎭 Component Examples

### Activity Type Badges
```jsx
const activityColors = {
  Running: { bg: 'energy.100', color: 'energy.700', icon: FiActivity },
  Cycling: { bg: 'sky.100', color: 'sky.700', icon: FiBike },
  Swimming: { bg: 'blue.100', color: 'blue.700', icon: FiDroplet },
  Walking: { bg: 'brand.100', color: 'brand.700', icon: FiFootsteps },
};

<Badge variant="nature" leftIcon={<Icon as={activityColors[type].icon} />}>
  {type}
</Badge>
```

### Energy Progress Bar
```jsx
<Box position="relative" h="20px" bg="gray.100" borderRadius="full" overflow="hidden">
  <Box
    h="100%"
    w={`${progress}%`}
    bgGradient="linear(to-r, energy.400, energy.600)"
    borderRadius="full"
    transition="width 0.5s ease"
    position="relative"
  >
    {/* Animated shimmer effect */}
    <Box
      position="absolute"
      top="0"
      left="-100%"
      right="0"
      bottom="0"
      bgGradient="linear(to-r, transparent, whiteAlpha.400, transparent)"
      animation="shimmer 2s infinite"
    />
  </Box>
</Box>
```

---

## 🖌️ Typography

### Headings (Montserrat - Bold, Energetic)
```
H1: 48-60px, Weight: 900, Letter spacing: -0.5px
H2: 36-42px, Weight: 800
H3: 28-32px, Weight: 700
H4: 20-24px, Weight: 700
```

### Body Text (Inter - Clean, Readable)
```
Large: 18px
Regular: 16px
Small: 14px
Tiny: 12px
```

### Special Text Effects
```jsx
// Gradient text for hero
<Text
  bgGradient="linear(to-r, energy.400, energy.600)"
  bgClip="text"
  fontSize="6xl"
  fontWeight="900"
>
  Push Your Limits
</Text>

// Emphasis with brand color
<Text as="span" color="brand.600" fontWeight="700">
  500+ Active Users
</Text>
```

---

## 🎬 Animations & Interactions

### Button Hover Effects
```css
/* Lift on hover */
_hover: {
  transform: "translateY(-2px)",
  boxShadow: "0 8px 20px rgba(46, 125, 50, 0.3)",
}

/* Pulse for CTAs */
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
```

### Card Entry Animations
```jsx
<MotionBox
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, delay: index * 0.1 }}
>
  {/* Card content */}
</MotionBox>
```

### Activity Success Animation
```jsx
// When activity is logged
<Box
  position="fixed"
  top="50%"
  left="50%"
  transform="translate(-50%, -50%)"
  zIndex="9999"
>
  <VStack spacing={4}>
    <Icon 
      as={FiCheckCircle} 
      boxSize="80px" 
      color="energy.500"
      animation="scale-in 0.5s ease"
    />
    <Text fontSize="2xl" fontWeight="900" color="brand.700">
      Activity Logged! 🎉
    </Text>
  </VStack>
</Box>
```

---

## 📱 Responsive Breakpoints

```javascript
const breakpoints = {
  sm: "30em",    // 480px - Mobile
  md: "48em",    // 768px - Tablet
  lg: "62em",    // 992px - Small Desktop
  xl: "80em",    // 1280px - Desktop
  "2xl": "96em", // 1536px - Large Desktop
};
```

---

## 🖼️ Image & Icon Guidelines

### Icons
- **Primary**: Feather Icons (react-icons/fi) - Clean, minimal
- **Activity**: FiActivity, FiTrendingUp, FiAward
- **Nature**: FiMountain, FiSun, FiCloud
- **Social**: FiUsers, FiHeart, FiShare2

### Images
- **Hero backgrounds**: Forest landscapes, mountain trails at sunrise
- **Overlays**: Subtle texture (10-20% opacity)
- **Profile photos**: Circular with brand color border
- **Activity photos**: Rounded corners (16px), subtle shadow

### Gradients
```css
/* Sunrise gradient */
background: linear-gradient(135deg, #ff6f00 0%, #f57c00 100%);

/* Forest gradient */
background: linear-gradient(to bottom, #2e7d32 0%, #1b5e20 100%);

/* Sky gradient */
background: linear-gradient(to top, #2196f3 0%, #64b5f6 100%);

/* Subtle earth gradient (backgrounds) */
background: linear-gradient(to bottom, #fafaf8 0%, #f5f5f3 100%);
```

---

## 🚀 Quick Implementation Checklist

### Phase 1: Update Existing Components (1-2 hours)
- [ ] Replace all `colorScheme="green"` with `colorScheme="brand"`
- [ ] Add `colorScheme="energy"` to primary CTAs (Submit Activity, etc.)
- [ ] Update button variants to use `variant="energy"` for main actions
- [ ] Add gradient backgrounds to hero sections
- [ ] Update badge colors (Running → energy, Walking → brand)

### Phase 2: Enhance Visual Elements (2-3 hours)
- [ ] Add card hover effects (`_hover` prop)
- [ ] Implement progress bars with gradient fills
- [ ] Add activity type icons with colored backgrounds
- [ ] Update leaderboard with ranking badges (gold, silver, bronze)
- [ ] Add subtle texture overlays to backgrounds

### Phase 3: Polish & Animations (1-2 hours)
- [ ] Add entry animations to dashboard cards
- [ ] Implement button lift effects
- [ ] Add success toast/modal animations
- [ ] Smooth scroll transitions
- [ ] Loading states with nature-themed spinners

---

## 🎨 Example Color Usage

| Element | Color | Reasoning |
|---------|-------|-----------|
| Primary Nav | brand.600 | Grounding, always present |
| Submit Activity | energy.500 | High energy, main action |
| View Stats | brand.500 | Secondary action |
| Running Badge | energy.100/700 | High intensity |
| Walking Badge | brand.100/700 | Moderate pace |
| Cycling Badge | sky.100/700 | Speed, freedom |
| Success Messages | brand.500 | Positive confirmation |
| Warnings | energy.600 | Attention needed |
| Links | sky.600 | Clickable, informational |
| Text | earth.800 | Readable, neutral |

---

**Design Inspiration Sources:**
- 🏔️ National Park posters (bold, adventurous)
- 🌅 Sunrise photography (warm, energetic)
- 🌲 Forest trails (natural, grounding)
- 🏃 Athletic brands (Nike, Patagonia)

**Implementation Files:**
- `src/theme.js` - Updated with full color palette ✅
- Apply to components individually or create example screens

Let me know if you want me to update specific pages (Home, Dashboard, Profile) with these new design patterns!
