/**
 * Kauri Futsal Brand Theme
 * Centralized theme constants and utility functions
 */

export const colors = {
  // Brand colors
  midnight: '#172F56',  // Primary Navy
  taffy: '#F289AE',     // Pink
  seafoam: '#79CBC4',   // Teal
  white: '#FFFFFF',

  // Semantic colors (light mode)
  background: '#FFFFFF',
  foreground: '#0f172a',
  muted: '#5a718f',
  border: '#e2e8f0',
  ring: '#79CBC4',
  link: '#172F56',
  linkHover: '#79CBC4',
  card: '#FFFFFF',
  inputBg: '#FFFFFF',
  accent: '#F289AE',
  accentHover: '#e5679a',
} as const;

export const gradients = {
  primary: 'from-[#172F56] to-[#79CBC4]',
  light: 'from-white via-[#f8fffe] to-[#f0faf9]',
} as const;

/**
 * Get Tailwind color class for a brand color
 * @param color - The color name from the brand palette
 * @param type - The type of class (bg, text, border)
 * @returns Tailwind CSS class string
 */
export function getColorClass(
  color: 'midnight' | 'taffy' | 'seafoam' | 'white',
  type: 'bg' | 'text' | 'border' = 'bg'
): string {
  const colorMap = {
    midnight: '#172F56',
    taffy: '#F289AE',
    seafoam: '#79CBC4',
    white: '#FFFFFF',
  };

  return `${type}-[${colorMap[color]}]`;
}

/**
 * Common button styles for consistent UI
 */
export const buttonStyles = {
  primary: 'px-4 py-2 rounded-lg bg-[#172F56] text-white font-bold shadow-md hover:bg-[#1e3a5f] transition-all',
  secondary: 'px-4 py-2 rounded-lg bg-[#79CBC4] text-[#172F56] font-bold shadow-md hover:bg-[#68b8b0] transition-all',
  accent: 'px-4 py-2 rounded-lg bg-[#F289AE] text-[#172F56] font-bold shadow-md hover:bg-[#e5679a] transition-all',
  outline: 'px-4 py-2 rounded-lg bg-white border-2 border-[#79CBC4] text-[#172F56] font-bold hover:bg-[#79CBC4] hover:text-white transition-all',
} as const;

/**
 * Common card styles for consistent UI
 */
export const cardStyles = {
  base: 'bg-white rounded-xl shadow-sm border border-[#e2e8f0] p-6',
  hover: 'bg-white rounded-xl shadow-sm border border-[#e2e8f0] p-6 hover:shadow-lg transition-all',
} as const;
