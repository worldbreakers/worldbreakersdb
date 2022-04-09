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
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "app/Resources/assets/"),
        },
    },
};
