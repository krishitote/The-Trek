import { extendTheme } from "@chakra-ui/react";

// Define your color palette and global styles
const theme = extendTheme({
config: {
initialColorMode: "light",
useSystemColorMode: false,
},

colors: {
brand: {
50: "#e3fcec",
100: "#c1f0d3",
200: "#9ce4b9",
300: "#75d89f",
400: "#50cc86",
500: "#36b26c", // main green
600: "#298955",
700: "#1d603e",
800: "#103727",
900: "#051e13",
},
},

fonts: {
heading: "'Poppins', sans-serif",
body: "'Inter', sans-serif",
},

components: {
Button: {
baseStyle: {
borderRadius: "xl",
fontWeight: "600",
},
variants: {
solid: (props) => ({
bg: props.colorMode === "light" ? "brand.500" : "brand.300",
color: "white",
_hover: {
bg: props.colorMode === "light" ? "brand.600" : "brand.400",
},
}),
},
},
},

styles: {
global: (props) => ({
body: {
bg: props.colorMode === "light" ? "gray.50" : "gray.900",
color: props.colorMode === "light" ? "gray.800" : "gray.100",
},
}),
},
});

export default theme;