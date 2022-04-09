const cssnano = require("cssnano");
const postcssPresetEnv = require("postcss-preset-env");
const atImport = require("postcss-import");

module.exports = {
    plugins: [cssnano(), postcssPresetEnv(), atImport()],
};
