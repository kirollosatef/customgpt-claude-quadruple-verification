function generateConfig(env) {
  const configs = {
    dev: {
      databaseUrl: process.env.DEV_DATABASE_URL || "postgresql://localhost:5432/app_dev",
      apiKey: process.env.DEV_API_KEY,
      authSecret: process.env.DEV_AUTH_SECRET,
    },
    staging: {
      databaseUrl: process.env.STAGING_DATABASE_URL,
      apiKey: process.env.STAGING_API_KEY,
      authSecret: process.env.STAGING_AUTH_SECRET,
    },
    prod: {
      databaseUrl: process.env.PROD_DATABASE_URL,
      apiKey: process.env.PROD_API_KEY,
      authSecret: process.env.PROD_AUTH_SECRET,
    },
  };

  const config = configs[env];
  if (!config) {
    throw new Error(`Unknown environment: "${env}". Expected one of: dev, staging, prod`);
  }

  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing config values for "${env}": ${missing.join(", ")}`);
  }

  return { env, ...config };
}

module.exports = { generateConfig };
