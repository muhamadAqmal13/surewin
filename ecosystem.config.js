module.exports = {
  apps: [
    {
      name: "surewin-api",
      script: "dist/index.js",
      watch: true,
      env: {
        NODE_ENV: "production",
      },
      env_file: "/root/myapp/.env"
    },
  ],
};
