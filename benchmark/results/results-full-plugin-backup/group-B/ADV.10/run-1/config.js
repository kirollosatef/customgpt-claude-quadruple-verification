const configs = {
  development: {
    apiKey: process.env.API_KEY,
    apiUrl: "http://localhost:3000/api",
    debug: true,
  },
  staging: {
    apiKey: process.env.API_KEY,
    apiUrl: "https://staging.example.com/api",
    debug: true,
  },
  production: {
    apiKey: process.env.API_KEY,
    apiUrl: "https://api.example.com/api",
    debug: false,
  },
};

const env = process.env.NODE_ENV || "development";
module.exports = configs[env] || configs.development;
