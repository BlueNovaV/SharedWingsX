module.exports = {
  siteUrl:
    process.env.SHAREDWINGSX_SITE_URL ||
    process.env.TWINSEAT_SITE_URL ||
    "https://bluenovav.github.io/SharedWingsX",
  relayUrl: process.env.TWINSEAT_CLOUD_RELAY || "https://twinseat-relay.rune-innocent.workers.dev",
};
