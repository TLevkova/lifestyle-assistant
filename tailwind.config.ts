import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        card: "hsl(var(--card))",
        muted: "hsl(var(--muted))",

        text: "hsl(var(--text))",
        "muted-foreground": "hsl(var(--muted-foreground))",

        // These three MUST support /opacity modifiers, so keep as hsl()
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",

        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",

        // Secondary is solid; translucency is done via /xx in class usage
        secondary: "hsl(var(--secondary) / <alpha-value>)",
        "secondary-foreground": "hsl(var(--secondary-foreground))",

        destructive: "hsl(var(--destructive) / <alpha-value>)",
        "destructive-foreground": "hsl(0 0% 100%)",

        "dashboard-card-bg": "hsl(var(--dashboard-card-bg))",
        "dashboard-card-border": "hsl(var(--dashboard-card-border) / <alpha-value>)",
        "dashboard-card-accent": "hsl(var(--dashboard-card-accent))",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
    },
  },
  plugins: [],
};

export default config;

