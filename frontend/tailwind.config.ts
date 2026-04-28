import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#6366f1", // Indigo 500
          dark: "#4f46e5",    // Indigo 600
          light: "#818cf8",   // Indigo 400
        },
        secondary: {
          DEFAULT: "#a855f7", // Purple 500
          dark: "#9333ea",    // Purple 600
          light: "#c084fc",   // Purple 400
        },
        background: "#0f172a", // Slate 900
        text: {
          DEFAULT: "#f8fafc", // Slate 50
          muted: "#94a3b8",   // Slate 400
        },
        surface: "#1e293b",    // Slate 800
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
      boxShadow: {
        "elevation-low": "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        "elevation-mid": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        "elevation-high": "0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1)",
      },
    },
  },
  plugins: [],
};
export default config;
