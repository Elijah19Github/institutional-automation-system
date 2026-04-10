// 1. Bright (Light) Theme
// Clean, high-contrast, and airy. Uses a vibrant blue for primary actions.
export const lightTheme = {
  '--background': '0 0% 100%', // Pure white
  '--foreground': '222.2 84% 4.9%', // Near black for optimal readability
  '--surface': '210 40% 98%', // Very soft cool gray for cards
  '--surface-foreground': '222.2 84% 4.9%',
  '--border': '214.3 31.8% 91.4%', // Subtle light gray border
  '--input': '214.3 31.8% 91.4%',
  '--ring': '221.2 83.2% 53.3%',
  '--primary': '221.2 83.2% 53.3%', // Standard bright, clickable blue
  '--primary-foreground': '210 40% 98%', // White text on primary buttons
  '--secondary': '210 40% 96.1%',
  '--secondary-foreground': '222.2 47.4% 11.2%',
  '--accent': '210 40% 96.1%',
  '--accent-foreground': '222.2 47.4% 11.2%',
  '--text-primary': '222.2 84% 4.9%',
  '--text-secondary': '215.4 16.3% 46.9%', // Muted gray for secondary text
  '--radius': '0.5rem',
};

// 2. Refined Dark Theme
// Sleek, modern, and neutral dark (slate). Improved contrast over the original.
export const darkTheme = {
  '--background': '240 10% 3.9%', // Deepest neutral slate
  '--foreground': '0 0% 98%', // Pure white for crisp text
  '--surface': '240 5% 9.6%', // Slightly elevated dark gray for cards
  '--surface-foreground': '0 0% 98%',
  '--border': '240 3.7% 15.9%', // Visible but subtle dark border
  '--input': '240 3.7% 15.9%',
  '--ring': '217.2 91.2% 59.8%',
  '--primary': '217.2 91.2% 59.8%', // Punchy neon blue for dark mode
  '--primary-foreground': '222.2 47.4% 11.2%', // Dark text on light blue buttons
  '--secondary': '240 3.7% 15.9%',
  '--secondary-foreground': '0 0% 98%',
  '--accent': '240 3.7% 15.9%',
  '--accent-foreground': '0 0% 98%',
  '--text-primary': '0 0% 98%',
  '--text-secondary': '240 5% 64.9%', // Readable, cool-toned gray
  '--radius': '0.5rem',
};

// 3. Deep Blue Theme
// A rich, monochromatic navy theme. Great for dashboards and developer tools.
export const blueTheme = {
  '--background': '226 58% 10%', // Deep navy blue
  '--foreground': '210 40% 98%', // Icy white
  '--surface': '226 45% 15%', // Elevated navy for cards/modals
  '--surface-foreground': '210 40% 98%',
  '--border': '226 30% 25%', // Muted blue border
  '--input': '226 30% 25%',
  '--ring': '212 100% 60%',
  '--primary': '212 100% 60%', // Vivid electric blue
  '--primary-foreground': '0 0% 100%', // Pure white on electric blue
  '--secondary': '226 30% 25%',
  '--secondary-foreground': '210 40% 98%',
  '--accent': '226 30% 25%',
  '--accent-foreground': '210 40% 98%',
  '--text-primary': '210 40% 98%',
  '--text-secondary': '215 25% 70%', // Soft, readable blue-gray
  '--radius': '0.5rem',
};
