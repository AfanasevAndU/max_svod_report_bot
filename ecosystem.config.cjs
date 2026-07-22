module.exports = {
  apps: [
    {
      name: "max_svod_report_bot",
      script: "src/app.js",
      cwd: __dirname,
      env: {
        NODE_TLS_REJECT_UNAUTHORIZED: "0",
      },
    },
  ],
};
