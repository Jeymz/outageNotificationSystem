/* eslint-disable */

module.exports = {
  apps: [
    {
      name: "Robotti Rapid Response",
      script: "./src/app.js",
      watch: false,
      env_development: {
        "NODE_ENV": "development",
        "DEBUG": "app,app:*"
      },
      env_production: {
        "NODE_ENV": "production",
        "DEBUG": "app,app:*"
      }
    }
  ]
}
