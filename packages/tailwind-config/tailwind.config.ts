import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";
const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../apps/**/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [tailwindcssAnimate],
};
export default config;
