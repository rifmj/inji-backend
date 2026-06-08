export default () => {
  const {
    APP_NAME,
    APP_DESCRIPTION,
    APP_VERSION,
    PORT,
    KEY_DB_HOST,
    KEY_DB_PORT,
    PG_HOST,
    PG_PORT,
    PG_USERNAME,
    PG_PWD,
    PG_DB,
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_FROM_NUMBER,
    ENV,
    FIREBASE_PRIVATE_KEY,
    FIREBASE_PRIVATE_KEY_ID,
    FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL,
    FIREBASE_CLIENT_ID,
    FIREBASE_CLIENT_X509_CERT_URL,
    ORIGIN_HOST,
    TWILIO_WHATSAPP_SERVICE_SID,
    SESSION_SECRET,
    TELEGRAM_NOTIFICATION_BOT_TOKEN,
    TELEGRAM_AUTH_BOT_TOKEN,
    TELEGRAM_AUTH_BOT_USERNAME,
    TELEGRAM_AUTH_WHATSAPP_PHONE,
    TELEGRAM_AUTH_BOT_ENABLED,
    TELEGRAM_AUTH_HASH_TTL_MINUTES,
    TELEGRAM_WEBHOOK_DOMAIN,
    TELEGRAM_WEBHOOK_SECRET,
    TELEGRAM_USE_WEBHOOK,
    SECRETS_ENCRYPTION_KEY,
    APPLE_BUNDLE_ID,
    APPLE_TEAM_ID,
    APPLE_KEY_ID,
    APPLE_PRIVATE_KEY,
    APPLE_NONCE_TTL_SECONDS,
  } = process.env;

  const appleKeyConfigured = !!(
    APPLE_BUNDLE_ID &&
    APPLE_TEAM_ID &&
    APPLE_KEY_ID &&
    APPLE_PRIVATE_KEY
  );

  return {
    common: {
      appName: APP_NAME,
      appDescription: APP_DESCRIPTION,
      appVersion: APP_VERSION,
      appEnv: ENV,
      port: PORT,
      originHost: ORIGIN_HOST,
      sessionSecret: SESSION_SECRET,
    },
    app: {
      catalog: {
        // Каждые пять минут
        categoryRefreshCron: '*/5 * * * *',
        // Каждые пять минут
        productRefreshCron: '*/30 * * * *',
      },
    },
    keydb: {
      port: KEY_DB_PORT,
      host: KEY_DB_HOST,
    },
    db: {
      host: PG_HOST,
      port: PG_PORT,
      username: PG_USERNAME,
      password: PG_PWD,
      database: PG_DB,
    },
    sms: {
      enable: false,
      codeSalt: '$2b$10$u6bhDutLG1Wu/nvvVN3LGu',
      twilio: {
        accountSid: TWILIO_ACCOUNT_SID,
        authToken: TWILIO_AUTH_TOKEN,
        fromNumber: TWILIO_FROM_NUMBER,
        whatsappServiceSid: TWILIO_WHATSAPP_SERVICE_SID,
      },
    },
    telegram: {
      notificationBotToken: TELEGRAM_NOTIFICATION_BOT_TOKEN,
      authBotToken: TELEGRAM_AUTH_BOT_TOKEN,
      // (a) Bot identity returned to the client so deep-links are not hardcoded.
      // Username without the leading "@" (e.g. "inji_dev_auth_bot").
      authBotUsername: TELEGRAM_AUTH_BOT_USERNAME,
      // WhatsApp number (digits only, e.g. "77474438640") for the WhatsApp flow.
      whatsappPhone: TELEGRAM_AUTH_WHATSAPP_PHONE,
      // Force-enable the polling auth bot regardless of ENV. The bot is skipped
      // by default on ENV=dev (so dev laptops don't poll), but a shared
      // dev/staging box can opt in by setting TELEGRAM_AUTH_BOT_ENABLED=true.
      authBotEnabled: TELEGRAM_AUTH_BOT_ENABLED === 'true',
      // (c) Lifetime of a one-time auth hash, in minutes.
      authHashTtlMinutes: TELEGRAM_AUTH_HASH_TTL_MINUTES
        ? parseInt(TELEGRAM_AUTH_HASH_TTL_MINUTES, 10)
        : 10,
      // (b) Webhook mode (required for serverless / Vercel where long-polling
      // does not survive). When a domain is set we default to webhook mode;
      // TELEGRAM_USE_WEBHOOK can force it on/off explicitly.
      webhookDomain: TELEGRAM_WEBHOOK_DOMAIN,
      webhookSecret: TELEGRAM_WEBHOOK_SECRET,
      useWebhook:
        TELEGRAM_USE_WEBHOOK != null
          ? TELEGRAM_USE_WEBHOOK === 'true'
          : !!TELEGRAM_WEBHOOK_DOMAIN,
    },
    secrets: {
      // 32-byte key (64 hex chars) for AES-256-GCM. Required.
      encryptionKey: SECRETS_ENCRYPTION_KEY,
    },
    apple: {
      bundleId: APPLE_BUNDLE_ID,
      teamId: APPLE_TEAM_ID,
      keyId: APPLE_KEY_ID,
      // PEM-encoded ES256 private key downloaded from Apple Developer portal.
      privateKey: APPLE_PRIVATE_KEY,
      // Whether server can sign client_secret for /auth/token and /auth/revoke.
      // When false, sign-in still works (we only verify identityToken), but
      // token-exchange and revoke are skipped.
      keyConfigured: appleKeyConfigured,
      nonceTtlSeconds: APPLE_NONCE_TTL_SECONDS
        ? parseInt(APPLE_NONCE_TTL_SECONDS, 10)
        : 600,
    },
    firebase: {
      serviceAccount: {
        type: 'service_account',
        project_id: FIREBASE_PROJECT_ID,
        private_key_id: FIREBASE_PRIVATE_KEY_ID,
        private_key: FIREBASE_PRIVATE_KEY,
        client_email: FIREBASE_CLIENT_EMAIL,
        client_id: FIREBASE_CLIENT_ID,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url:
          'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: FIREBASE_CLIENT_X509_CERT_URL,
      },
    },
  };
};
