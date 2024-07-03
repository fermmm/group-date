import type { Config } from "tailwindcss";

module.exports = {
   content: ["./src/**/*.{html,js,ts,tsx,jsx}"],
   presets: [],
   darkMode: "media", // or 'class'
   theme: {
      colors: {
         accent1: "#5EFFF4",
         accent2: "#00FDF3",
         accent3: "#00E0DD",
         accent4: "#809FFC",
         accent5: "#9B63F8",
         accent6: "#244A7A",
         accent7: "#FFD997",
         accent8: "#FFBF9C",
         button1: "#F8AF20",
         button2: "#F85C35",
         buttonActive: "#111111",
         buttonText: "#FFFFFF",
         red: "#FA4B4A",
         icon: "#8E8E90",
         iconInverted: "#FFFFFF",
         line1: "#434346",
         line2: "#3A393B",
         lineInverted: "#FFFFFF",
         border1: "#3A393B",
         border2: "#3A393B",
         border3: "#FFFFFF",
         backgroundNear: "#1D1B21",
         backgroundFar: "#111111",
         backgroundInverted: "#FFFFFF"
      },
      textColor: {
         text1: "#FFFFFF",
         text2: "#B1B2B6",
         text3: "#8A8A8C"
      },
      chatNamesColors: [
         "#29b516",
         "#a85b7c",
         "#006cff",
         "#379ba8",
         "#f72e62",
         "#f0ff00",
         "#2b8129",
         "#2d2981",
         "#000000",
         "#7778b1",
         "#755c72",
         "#878900",
         "#00bab3",
         "#660000",
         "#ae5bde",
         "#de5b5b",
         "#d95bde",
         "#9600ff",
         "#a2ff00",
         "#0c00ff"
      ],
      fontFamily: {
         sans: [
            "ui-sans-serif",
            "system-ui",
            "sans-serif",
            '"Apple Color Emoji"',
            '"Segoe UI Emoji"',
            '"Segoe UI Symbol"',
            '"Noto Color Emoji"'
         ],
         serif: ["ui-serif", "Georgia", "Cambria", '"Times New Roman"', "Times", "serif"],
         mono: [
            "ui-monospace",
            "SFMono-Regular",
            "Menlo",
            "Monaco",
            "Consolas",
            '"Liberation Mono"',
            '"Courier New"',
            "monospace"
         ]
      },
      borderRadius: {
         none: "0px",
         sm: "0.125rem",
         DEFAULT: "0.25rem",
         md: "0.375rem",
         lg: "0.5rem",
         xl: "0.75rem",
         "2xl": "1rem",
         "3xl": "1.5rem",
         full: "9999px"
      },
      boxShadow: {
         sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
         DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
         md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
         lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
         xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
         "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
         inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
         none: "none"
      },
      dropShadow: {
         sm: "0 1px 1px rgb(0 0 0 / 0.05)",
         DEFAULT: ["0 1px 2px rgb(0 0 0 / 0.1)", "0 1px 1px rgb(0 0 0 / 0.06)"],
         md: ["0 4px 3px rgb(0 0 0 / 0.07)", "0 2px 2px rgb(0 0 0 / 0.06)"],
         lg: ["0 10px 8px rgb(0 0 0 / 0.04)", "0 4px 3px rgb(0 0 0 / 0.1)"],
         xl: ["0 20px 13px rgb(0 0 0 / 0.03)", "0 8px 5px rgb(0 0 0 / 0.08)"],
         "2xl": "0 25px 25px rgb(0 0 0 / 0.15)",
         none: "0 0 #0000"
      },
      animation: {
         none: "none",
         spin: "spin 1s linear infinite",
         ping: "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite",
         pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
         bounce: "bounce 1s infinite"
      },
      fontSize: {
         xs: ["0.75rem", { lineHeight: "1rem" }],
         sm: ["0.875rem", { lineHeight: "1.25rem" }],
         base: ["1rem", { lineHeight: "1.5rem" }],
         lg: ["1.125rem", { lineHeight: "1.75rem" }],
         xl: ["1.25rem", { lineHeight: "1.75rem" }],
         "2xl": ["1.5rem", { lineHeight: "2rem" }],
         "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
         "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
         "5xl": ["3rem", { lineHeight: "1" }],
         "6xl": ["3.75rem", { lineHeight: "1" }],
         "7xl": ["4.5rem", { lineHeight: "1" }],
         "8xl": ["6rem", { lineHeight: "1" }],
         "9xl": ["8rem", { lineHeight: "1" }]
      },
      fontWeight: {
         thin: "100",
         extralight: "200",
         light: "300",
         normal: "400",
         medium: "500",
         semibold: "600",
         bold: "700",
         extrabold: "800",
         black: "900"
      },
      letterSpacing: {
         tighter: "-0.05em",
         tight: "-0.025em",
         normal: "0em",
         wide: "0.025em",
         wider: "0.05em",
         widest: "0.1em"
      },
      screens: {
         sm: "640px",
         md: "768px",
         lg: "1024px",
         xl: "1280px",
         "2xl": "1536px"
      },
      space: ({ theme }) => ({
         ...theme("spacing")
      }),
      spacing: {
         px: "1px",
         0: "0px",
         0.5: "0.125rem",
         1: "0.25rem",
         1.5: "0.375rem",
         2: "0.5rem",
         2.5: "0.625rem",
         3: "0.75rem",
         3.5: "0.875rem",
         4: "1rem",
         5: "1.25rem",
         6: "1.5rem",
         7: "1.75rem",
         8: "2rem",
         9: "2.25rem",
         10: "2.5rem",
         11: "2.75rem",
         12: "3rem",
         14: "3.5rem",
         16: "4rem",
         20: "5rem",
         24: "6rem",
         28: "7rem",
         32: "8rem",
         36: "9rem",
         40: "10rem",
         44: "11rem",
         48: "12rem",
         52: "13rem",
         56: "14rem",
         60: "15rem",
         64: "16rem",
         72: "18rem",
         80: "20rem",
         96: "24rem"
      },
      zIndex: {
         auto: "auto",
         0: "0",
         10: "10",
         20: "20",
         30: "30",
         40: "40",
         50: "50"
      }
   },
   plugins: []
} satisfies Config;
