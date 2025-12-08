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
  } = process.env;

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
