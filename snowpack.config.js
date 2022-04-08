// Snowpack Configuration File
// See all supported options: https://www.snowpack.dev/reference/configuration

/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
    plugins: [
        /* ... */
    ],
    packageOptions: {
        /* ... */
    },
    devOptions: {
        /* ... */
    },
    buildOptions: {
        out: './web/dist',
        watch: true,
    },
    optimize: {
        bundle: true,
        entrypoints: ['./js/worldbreakers.js'],
        minify: true,
        target: 'es2018',
    },
    root: 'app/Resources/assets'
};
