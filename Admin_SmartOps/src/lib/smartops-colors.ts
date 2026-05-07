// SmartOps Color Palette
export const smartopsColors = {
  blue: '#3956FF',
  blueHover: '#00D9C3',
  dark: '#1d1f21',
  white: '#ffffff',
  gray: '#f8f9fa',
} as const;

// Tailwind CSS classes for SmartOps colors
export const smartopsColorClasses = {
  blue: 'text-smartops-blue',
  blueHover: 'text-smartops-blue-hover',
  dark: 'text-smartops-dark',
  white: 'text-smartops-white',
  gray: 'text-smartops-gray',
  bgBlue: 'bg-smartops-blue',
  bgBlueHover: 'bg-smartops-blue-hover',
  bgDark: 'bg-smartops-dark',
  bgWhite: 'bg-smartops-white',
  bgGray: 'bg-smartops-gray',
  borderBlue: 'border-smartops-blue',
  borderBlueHover: 'border-smartops-blue-hover',
  borderDark: 'border-smartops-dark',
  borderWhite: 'border-smartops-white',
  borderGray: 'border-smartops-gray',
} as const;

// Common SmartOps button styles
export const smartopsButtonStyles = {
  primary: 'bg-smartops-blue hover:bg-smartops-blue-hover text-smartops-white font-montserrat font-semibold px-4 py-2 rounded-lg transition-colors duration-200',
  secondary: 'bg-smartops-gray hover:bg-smartops-blue text-smartops-dark hover:text-smartops-white font-montserrat font-medium px-4 py-2 rounded-lg transition-colors duration-200',
  outline: 'border-2 border-smartops-blue text-smartops-blue hover:bg-smartops-blue hover:text-smartops-white font-montserrat font-medium px-4 py-2 rounded-lg transition-colors duration-200',
} as const; 