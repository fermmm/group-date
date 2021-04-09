const { override, addBabelPlugin } = require("customize-cra");

module.exports = override(
  addBabelPlugin([
    "babel-plugin-styled-components",
    {
      displayName: true,
      // any extra config from babel-plugin-styled-components
    },
  ])
);
