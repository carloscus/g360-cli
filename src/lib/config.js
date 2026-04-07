export const config = {
  defaults: {
    template: 'web-pwa',
    assets: ['components', 'skills', 'engine'],
    theme: 'cool-light'
  },

  projectTypes: {
    'web-pwa': { framework: 'vanilla', features: ['pwa', 'offline'] },
    'web-svelte': { framework: 'svelte', features: ['routing', 'stores'] },
    'python-cli': { framework: 'python', features: ['cli', 'argparse'] },
    'vba-excel': { framework: 'vba', features: ['excel', 'macros'] }
  },

  themes: {
    'cool-light': { primary: '#3B82F6', secondary: '#10B981', accent: '#8B5CF6' },
    'cool-dark': { primary: '#60A5FA', secondary: '#34D399', accent: '#A78BFA' },
    'warm-light': { primary: '#F59E0B', secondary: '#EF4444', accent: '#8B5CF6' },
    'warm-dark': { primary: '#FBBF24', secondary: '#F87171', accent: '#A78BFA' },
    'neutral-light': { primary: '#6B7280', secondary: '#374151', accent: '#111827' },
    'neutral-dark': { primary: '#9CA3AF', secondary: '#D1D5DB', accent: '#F9FAFB' }
  }
};
