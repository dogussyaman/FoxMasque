module.exports = ({ config }) => {
  const baseUrl = process.env.EXPO_PUBLIC_BASE_URL;

  return baseUrl
    ? {
        ...config,
        experiments: {
          ...config.experiments,
          baseUrl,
        },
      }
    : config;
};
