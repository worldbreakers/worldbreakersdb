import eslintPlugin from 'vite-plugin-eslint';
const path = require("path");

module.exports = {
    build: {
        lib: {
            entry: path.resolve(__dirname, "app/Resources/assets/js/main.js"),
            name: "WorldbreakersDB",
            fileName: (format) => `worldbreakersdb.${format}.js`,
        },
        outDir: 'web/dist'
    },
    plugins: [eslintPlugin({
        include: 'app/Resources/assets/**/*.js'
    })],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "app/Resources/assets/"),
        },
    },
};
