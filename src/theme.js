import { extendTheme } from "@chakra-ui/react";

// Nature + Energy Theme: Forest meets Sunrise
// Inspired by: Mountain trails at dawn, forest energy, vibrant movement
const theme = extendTheme({
  config: {
    initialColorMode: "light",
    useSystemColorMode: false,
  },

  colors: {
    // Primary: Deep Forest Green (grounding, nature)
    brand: {
      50: "#e8f5e9",   // Misty morning
      100: "#c8e6c9",  // Light moss
      200: "#a5d6a7",  // Fresh leaf
      300: "#81c784",  // Spring green
      400: "#66bb6a",  // Vibrant grass
      500: "#2e7d32",  // Deep forest (main)
      600: "#1b5e20",  // Pine tree
      700: "#1b4d1d",  // Dark forest
      800: "#0f3714",  // Night forest
      900: "#051f0a",  // Deep woods
    },
    
    // Secondary: Sunrise Orange (energy, vitality)
    energy: {
      50: "#fff3e0",   // Dawn sky
      100: "#ffe0b2",  // Morning light
      200: "#ffcc80",  // Sunrise glow
      300: "#ffb74d",  // Golden hour
      400: "#ffa726",  // Bright sun
      500: "#ff6f00",  // Intense energy (main)
      600: "#f57c00",  // Fire
      700: "#e65100",  // Ember
      800: "#d84315",  // Burning
      900: "#bf360c",  // Hot coal
    },
    
    // Accent: Sky Blue (freedom, movement)
    sky: {
      50: "#e3f2fd",
      100: "#bbdefb",
      200: "#90caf9",
      300: "#64b5f6",
      400: "#42a5f5",
      500: "#2196f3",  // Clear sky
      600: "#1e88e5",
      700: "#1976d2",
      800: "#1565c0",
      900: "#0d47a1",
    },
    
    // Earth tones (supporting)
    earth: {
      50: "#fafaf8",
      100: "#f5f5f3",
      200: "#e8e8e4",
      300: "#d1d1ca",
      400: "#a8a89e",
      500: "#78786d",  // Stone
      600: "#5a5a50",
      700: "#3d3d35",
      800: "#26261f",
      900: "#141410",
    },
  },

  fonts: {
    heading: "'Exo 2', 'Righteous', 'Russo One', -apple-system, BlinkMacSystemFont, sans-serif",  // Bold, impactful, sporty
    body: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",        // Clean, readable, professional
    mono: "'Fira Code', 'Courier New', monospace",
    accent: "'Bebas Neue', 'Teko', sans-serif",  // For numbers, stats, and impact text
  },

  fontSizes: {
    xs: "0.75rem",
    sm: "0.875rem",
    md: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem",
    "5xl": "3rem",
    "6xl": "3.75rem",
    "7xl": "4.5rem",
    "8xl": "6rem",
  },

  fontWeights: {
    hairline: 100,
    thin: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },

  letterSpacings: {
    tighter: "-0.05em",
    tight: "-0.025em",
    normal: "0",
    wide: "0.025em",
    wider: "0.05em",
    widest: "0.1em",
  },

  components: {
    Button: {
      baseStyle: {
        borderRadius: "full",     // Pill-shaped (organic)
        fontWeight: "600",
        letterSpacing: "0.025em",
        transition: "all 0.3s ease",
        fontFamily: "'Poppins', sans-serif",
        _hover: {
          transform: "translateY(-2px)",
          boxShadow: "lg",
        },
        _active: {
          transform: "translateY(0)",
        },
      },
      variants: {
        solid: (props) => ({
          bg: props.colorScheme === "energy" ? "energy.500" : "brand.500",
          color: "white",
          _hover: {
            bg: props.colorScheme === "energy" ? "energy.600" : "brand.600",
            transform: "translateY(-2px)",
            boxShadow: "lg",
          },
          _active: {
            transform: "translateY(0)",
          },
        }),
        outline: {
          borderWidth: "2px",
          borderColor: "brand.500",
          color: "brand.600",
          _hover: {
            bg: "brand.50",
            transform: "translateY(-1px)",
          },
        },
        ghost: {
          color: "brand.600",
          _hover: {
            bg: "brand.50",
          },
        },
        energy: {
          bg: "linear-gradient(135deg, #ff6f00 0%, #f57c00 100%)",
          color: "white",
          _hover: {
            bg: "linear-gradient(135deg, #f57c00 0%, #e65100 100%)",
            transform: "translateY(-2px)",
            boxShadow: "0 8px 20px rgba(255, 111, 0, 0.4)",
          },
        },
      },
      sizes: {
        lg: {
          h: "56px",
          px: "32px",
          fontSize: "lg",
        },
      },
    },
    
    Card: {
      baseStyle: {
        container: {
          borderRadius: "2xl",
          overflow: "hidden",
          transition: "all 0.3s ease",
          _hover: {
            transform: "translateY(-4px)",
            boxShadow: "xl",
          },
        },
      },
    },
    
    Heading: {
      baseStyle: {
        fontWeight: "800",
        letterSpacing: "-0.5px",
      },
    },
    
    Badge: {
      baseStyle: {
        borderRadius: "full",
        px: 3,
        py: 1,
        fontWeight: "700",
        textTransform: "uppercase",
        fontSize: "xs",
        letterSpacing: "0.5px",
      },
      variants: {
        nature: {
          bg: "brand.100",
          color: "brand.700",
        },
        energy: {
          bg: "energy.100",
          color: "energy.700",
        },
      },
    },
  },

  styles: {
    global: (props) => ({
      body: {
        bg: props.colorMode === "light" 
          ? "linear-gradient(to bottom, #fafaf8 0%, #f5f5f3 100%)"  // Soft earth gradient
          : "gray.900",
        color: props.colorMode === "light" ? "earth.800" : "gray.100",
      },
      // Smooth scrolling
      html: {
        scrollBehavior: "smooth",
      },
    }),
  },

  shadows: {
    outline: "0 0 0 3px rgba(46, 125, 50, 0.3)",  // Green focus
    brand: "0 4px 12px rgba(46, 125, 50, 0.2)",
    energy: "0 4px 12px rgba(255, 111, 0, 0.3)",
  },

  radii: {
    none: "0",
    sm: "0.25rem",
    base: "0.5rem",
    md: "0.75rem",
    lg: "1rem",
    xl: "1.5rem",
    "2xl": "2rem",
    "3xl": "3rem",
    full: "9999px",
  },
});

export default theme;