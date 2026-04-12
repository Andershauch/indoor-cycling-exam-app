const appEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
  hasAuthSecret: Boolean(process.env.AUTH_SECRET),
  hasMailProviderKey: Boolean(process.env.MAIL_PROVIDER_API_KEY),
  hasSmsProviderKey: Boolean(process.env.SMS_PROVIDER_API_KEY),
};

export function getAppEnv() {
  return appEnv;
}
