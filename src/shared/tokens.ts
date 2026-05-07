export const T = {
  bg: '#FBFBFB',
  ink: '#222222',
  inkSoft: '#666666',
  inkSofter: '#999999',
  line: '#E5E5E5',
  lineSoft: '#F0F0F0',
  red: '#D9534F',
  green: '#5CB85C',
  blue: '#3F8EFC',
  amber: '#E0A100',
} as const

export const SPRING = {
  type: 'spring' as const,
  stiffness: 220,
  damping: 26,
  mass: 0.6,
}

export const SOFT_SPRING = {
  type: 'spring' as const,
  stiffness: 130,
  damping: 20,
}
