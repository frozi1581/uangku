/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './resources/**/*.blade.php',
        './resources/**/*.js',
        './resources/**/*.jsx',
    ],
    theme: {
        extend: {
            fontFamily: {
                display: ['"Plus Jakarta Sans"', 'sans-serif'],
                sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui'],
            },
        },
    },
    plugins: [],
};
