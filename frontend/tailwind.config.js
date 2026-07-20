/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ── Core palette ──────────────────────────────────────────
        navy:    '#0F2744',   // titre foncé, sidebar
        blue:    '#1A56DB',   // CTA principal, liens actifs
        sky:     '#EFF6FF',   // fond clair bleuté
        // ── Semantic ──────────────────────────────────────────────
        success: '#16A34A',
        warning: '#D97706',
        danger:  '#DC2626',
        // ── Neutrals ──────────────────────────────────────────────
        ink:     '#111827',
        dim:     '#374151',
        muted:   '#6B7280',
        pale:    '#9CA3AF',
        ash:     '#E5E7EB',
        fog:     '#F3F4F6',
        snow:    '#F9FAFB',
        white:   '#FFFFFF',
        // ── Status badges ─────────────────────────────────────────
        'status-active-bg':  '#DBEAFE',
        'status-active-fg':  '#1E40AF',
        'status-paid-bg':    '#DCFCE7',
        'status-paid-fg':    '#15803D',
        'status-late-bg':    '#FEF3C7',
        'status-late-fg':    '#B45309',
        'status-dispute-bg': '#FEE2E2',
        'status-dispute-fg': '#B91C1C',
        'status-settled-bg': '#F3F4F6',
        'status-settled-fg': '#374151',
        'status-pending-bg': '#F9FAFB',
        'status-pending-fg': '#6B7280',
      },
      fontFamily: {
        sans: ['"Geist"', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'monospace'],
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px' }],
        xs:    ['12px', { lineHeight: '16px' }],
        sm:    ['13px', { lineHeight: '18px' }],
        base:  ['14px', { lineHeight: '20px' }],
        md:    ['15px', { lineHeight: '22px' }],
        lg:    ['16px', { lineHeight: '24px' }],
        xl:    ['18px', { lineHeight: '26px' }],
        '2xl': ['20px', { lineHeight: '28px' }],
        '3xl': ['24px', { lineHeight: '32px' }],
        '4xl': ['30px', { lineHeight: '38px' }],
        '5xl': ['36px', { lineHeight: '44px' }],
        '6xl': ['48px', { lineHeight: '56px' }],
        '7xl': ['60px', { lineHeight: '68px' }],
      },
      borderRadius: {
        sm:   '6px',
        md:   '8px',
        lg:   '12px',
        xl:   '16px',
        '2xl':'20px',
        '3xl':'28px',
      },
      boxShadow: {
        xs:   '0 1px 2px rgba(0,0,0,0.05)',
        sm:   '0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)',
        md:   '0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.04)',
        lg:   '0 10px 24px rgba(0,0,0,0.07), 0 4px 8px rgba(0,0,0,0.04)',
        xl:   '0 20px 40px rgba(0,0,0,0.08), 0 8px 16px rgba(0,0,0,0.04)',
        blue: '0 4px 14px rgba(26,86,219,0.25)',
        ring: '0 0 0 3px rgba(26,86,219,0.2)',
        card: '0 0 0 1px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.06)',
      },
      animation: {
        'fade-in':   'fadeIn 0.3s ease both',
        'slide-up':  'slideUp 0.35s cubic-bezier(0.16,1,0.3,1) both',
        'slide-down':'slideDown 0.25s cubic-bezier(0.16,1,0.3,1) both',
        'scale-in':  'scaleIn 0.2s cubic-bezier(0.16,1,0.3,1) both',
        'shimmer':   'shimmer 1.6s linear infinite',
        'float':     'float 4s ease-in-out infinite',
        'ticker-up': 'tickerUp 20s linear infinite',
      },
      keyframes: {
        fadeIn:   { from: { opacity: 0 },           to: { opacity: 1 } },
        slideUp:  { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'none' } },
        slideDown:{ from: { opacity: 0, transform: 'translateY(-8px)'  }, to: { opacity: 1, transform: 'none' } },
        scaleIn:  { from: { opacity: 0, transform: 'scale(0.95)' },       to: { opacity: 1, transform: 'none' } },
        shimmer:  { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
        float:    { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        tickerUp: { from: { transform: 'translateY(0)' }, to: { transform: 'translateY(-50%)' } },
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
