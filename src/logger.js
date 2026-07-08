import pino from "pino";

const isDevelopment = process.env.NODE_ENV !== "production";

export const logger = pino({
    level: isDevelopment ? "debug" : "info",

    transport: isDevelopment
        ? {
              target: "pino-pretty",
              options: {
                  colorize: true,
                  translateTime: "yyyy-mm-dd HH:MM:ss",
                  ignore: "pid,hostname"
              }
          }
        : undefined
});

export function logStart() {
    logger.info("========================================");
    logger.info("📊 Report Monitor started");
    logger.info("========================================");
}

export function logCheckStarted() {
    logger.info("🔍 Checking overdue reports...");
}

export function logCheckFinished(count) {
    logger.info(`✅ Check completed. Found ${count} overdue report(s).`);
}

export function logNoReports() {
    logger.info("✅ No overdue reports.");
}