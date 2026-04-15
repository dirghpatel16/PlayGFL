import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#090b10",
        card: "#111522",
        accent: "#6D5CFF",
        neon: "#2DE2E6",
        danger: "#ff4d77"
      },
      boxShadow: {
        glow: "0 0 40px rgba(109, 92, 255, 0.25)",
        neon: "0 0 25px rgba(45, 226, 230, 0.18)"
      }
    }
  },
  plugins: []
};

export default config;
