export const workosConfigured = !!process.env.WORKOS_CLIENT_ID;
export const devAuthEnabled = process.env.DEV_AUTH_ENABLED === "true";
export const authEnabled = workosConfigured && !devAuthEnabled;
