import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    rules: {
      // Experimental React 19 rule — too strict for the async-load-in-effect pattern used here
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default eslintConfig;
