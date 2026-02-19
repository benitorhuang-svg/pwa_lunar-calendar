/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
    theme: {
        extend: {
            screens: {
                'xs': '475px',
                'short': { 'raw': '(max-height: 660px)' },
            },
            colors: {
                'primary-red': '#c41e3a',
                'gold-accent': '#d4af37',
                'ink-black': '#1a1a1a',
                'paper-white': '#fdfbf7',
                'glass-bg': 'rgba(255, 255, 255, 0.7)',
                'glass-bg-dark': 'rgba(20, 20, 30, 0.7)',
            },
            fontFamily: {
                serif: ['"Noto Serif TC"', 'serif'],
                'serif-num': ['"Playfair Display"', '"Noto Serif TC"', 'serif'],
                calligraphy: ['"Zhi Mang Xing"', 'cursive'],
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
            },
            transitionTimingFunction: {
                'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
                premium: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
            },
            keyframes: {
                panelPopUp: {
                    '0%': { opacity: '0', transform: 'translateY(8px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'slide-right': {
                    '0%': { transform: 'translateX(10px)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
                'slide-left': {
                    '0%': { transform: 'translateX(-10px)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
            },
            animation: {
                panelPopUp: 'panelPopUp 0.3s var(--ease-out-expo)',
                'slide-right': 'slide-right 0.3s ease-out forwards',
                'slide-left': 'slide-left 0.3s ease-out forwards',
            },
            boxShadow: {
                premium: '0 12px 40px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.06)',
            },
            zIndex: {
                '60': '60',
                '70': '70',
                '80': '80',
                '90': '90',
                '100': '100',
                'cal-header': '2000',
                'cal-popup': '9000',
            }
        },
    },
    plugins: [
        /** @param {{ addVariant: (name: string, selector: string) => void }} pluginContext */
        function ({ addVariant }) {
            addVariant('body-loading', 'body:not(.app-loaded) &');
            addVariant('body-welcome', 'body.initial-welcome &');
            addVariant('not-body-welcome', 'body:not(.initial-welcome) &');
            addVariant('body-calendar', 'body:not(.immersion-mode):not(.initial-welcome):not(.mode-artwork):not(.note-mode-active) &');
            addVariant('body-artwork', 'body.mode-artwork &');
            // Combined variant: artwork mode enters immersion-mode simultaneously
            addVariant('body-artwork-immersion', 'body.mode-artwork.immersion-mode &');
            addVariant('body-zen', 'body.immersion-mode:not(.mode-artwork):not(.initial-welcome) &');
            addVariant('body-note', 'body.note-mode-active &');
            addVariant('body-immersion', 'body.immersion-mode &');
            addVariant('panel-today', 'body[data-active-panel="today"] &');
            addVariant('panel-year-month', 'body[data-active-panel="yearMonth"] &');
            addVariant('panel-faq', 'body[data-active-panel="faq"] &');
            addVariant('any-panel', 'body[data-active-panel] &');
        },
    ],
}
