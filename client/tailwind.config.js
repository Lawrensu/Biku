/** @type {import('tailwindcss').Config} */
export default {
	content: ['./index.html', './src/**/*.{vue,js}'],
	darkMode: ['selector', '[data-theme="dark"]'],
	theme: {
		extend: {
			colors: {
				linen:        '#FAF1E8',
				carbon:       '#1B1C20',
				blush:        '#EDB1B0',
				slate:        '#5B6E7D',
				cherry:       '#5C0403',
				'cherry-tint': '#F5E8E8',
			},
			fontFamily: {
				heading: ['Plus Jakarta Sans', 'sans-serif'],
				body:    ['Lora', 'Georgia', 'serif'],
			},
			borderRadius: {
				sm:   '6px',
				md:   '10px',
				lg:   '14px',
				xl:   '20px',
				full: '9999px',
			},
			transitionTimingFunction: {
				tender: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
				enter:  'cubic-bezier(0.0, 0.0, 0.2, 1.0)',
				exit:   'cubic-bezier(0.4, 0.0, 1.0, 1.0)',
			},
			transitionDuration: {
				350: '350ms',
				400: '400ms',
			},
		},
	},
}
