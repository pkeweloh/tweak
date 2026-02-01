const PROXY_CONFIG = {
    "/api": {
        "target": process.env.BACKEND_URI || "http://localhost:1337",
        "secure": false,
        "changeOrigin": true
    }
};

module.exports = PROXY_CONFIG;
