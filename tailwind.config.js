/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "var(--border)",
        input: "var(--border)",
        ring: "var(--primary)",
        background: "var(--background)",
        foreground: "var(--foreground)",

        primary: {
          DEFAULT: "var(--primary)",
          foreground: "#ffffff",
          light: "var(--primary-light)",
          dark: "var(--primary-dark)",
          5: "rgba(var(--primary-rgb), 0.05)",
          10: "rgba(var(--primary-rgb), 0.1)",
          20: "rgba(var(--primary-rgb), 0.2)",
        },
        success: {
          DEFAULT: "var(--success)", // hoặc '#16A34A'
          foreground: "#ffffff",
          5: "rgba(22, 163, 74, 0.05)",
          10: "rgba(22, 163, 74, 0.1)",
          20: "rgba(22, 163, 74, 0.2)",
        },
        warning: {
          DEFAULT: "var(--warning)", // hoặc '#F59E0B'
          foreground: "#ffffff",
          5: "rgba(245, 158, 11, 0.05)", // Bổ sung cho bg-warning-5
          10: "rgba(245, 158, 11, 0.1)",
          20: "rgba(245, 158, 11, 0.2)", // Bổ sung cho border-warning-20
        },
        destructive: {
          DEFAULT: "var(--danger)",
          foreground: "#ffffff",
          5: "rgba(239, 68, 68, 0.05)", // Bổ sung cho bg-destructive-5
          10: "rgba(239, 68, 68, 0.1)", // Bổ sung cho bg-destructive-10
          20: "rgba(239, 68, 68, 0.2)", // Bổ sung cho border-destructive-20
        },
        secondary: {
          DEFAULT: "#f1f5f9",
          foreground: "#0f172a",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "#64748b",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--foreground)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};
