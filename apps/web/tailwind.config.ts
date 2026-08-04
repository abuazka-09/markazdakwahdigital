import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        ink: "#17211c",
        palm: "#1f6f5b",
        mint: "#dff4ea",
        saffron: "#c89b3c",
        clay: "#b25f4a",
        skysoft: "#e8f2fb"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(23, 33, 28, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
