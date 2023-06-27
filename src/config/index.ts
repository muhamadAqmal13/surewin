export class Config {
    public nodeEnv = process.env.NODE_ENV || "DEVELOPMENT";
    public port = process.env.PORT || 3000;
    public maxBonusUser = process.env.MAX_BONUS_USER || 100;
    public bonusNewRegistration = process.env.BONUS_REGISTRATION || "20";
    public jwtAccessToken = process.env.JWT_ACCESS_TOKEN;
    public jwtRefreshToken = process.env.JWT_REFRESH_TOKEN;
    public uriMongoDb = process.env.URI_MONGO_DB || "mongodb://localhost:27017/jostech";

    public redisUri = process.env.REDIS_URI || "redis://default:redis@127.0.0.1:6379";

    public nowPaymentsEmail = process.env.NOW_PAYMENTS_EMAIL;
    public nowPaymentsPassword = process.env.NOW_PAYMENTS_PASSWORD;
    public nowPaymentsBaseUrl = process.env.NOW_PAYMENTS_BASE_URL;
    public nowPaymentsApiKey = process.env.NOW_PAYMENTS_API_KEY;
    public nowPaymentsSecretKey = process.env.NOW_PAYMENTS_SECRET_KEY;

    public minDeposit = process.env.MIN_DEPOSIT || "50";
    public minWithdrawal = process.env.MIN_WITHDRAWAL || "50";

    public callbackUrl = process.env.CALLBACK_URL;
    public withdrawalCallbackUrl = process.env.WITHDRAWAL_CALLBACK_URL;
    public backUrl = process.env.BACK_URL;

    public secretKeySpeakEasy = process.env.SECRET_KEY_SPEAKEASY;

    public minSpent = process.env.MIN_SPENT || 2;
    public maxSpent = process.env.MAX_SPENT || 100;

    public bucketAccessKey = process.env.BUCKET_ACCESS_KEY;
    public bucketSecretKey = process.env.BUCKET_SECRET_KEY;
    public bucketName = process.env.BUCKET_NAME;
    public bucketRegion = process.env.BUCKET_REGION;
    public bucketEndpoint = process.env.BUCKET_ENDPOINT;

    public signAppKey = process.env.SIGN_APP_KEY;

    public smtpHost = process.env.SMTP_HOST;
    public smtpPassword = process.env.SMTP_PASSWORD;
    public smtpUsername = process.env.SMTP_USERNAME;
    public smtpPort = parseInt(process.env.SMTP_PORT);
    public smtpSender = process.env.SMTP_EMAIL_SENDER;
}
