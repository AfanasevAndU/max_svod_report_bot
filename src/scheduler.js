import cron from "node-cron";

import { checkReports } from "./checker.js";
import { formatExpiredReports } from "./formatter.js";
import { sendMessage } from "./bot.js";

import { config } from "./config.js";
import { logger } from "./logger.js";


async function runReportCheck() {

    try {

        logger.info("Starting report check...");


        const expiredReports = await checkReports();


        if (expiredReports.length === 0) {

            logger.info(
                "No expired reports found. Nothing to send."
            );

            return;
        }


        const message =
            formatExpiredReports(expiredReports);


        if (message) {

            await sendMessage(message);

        }


    } catch (error) {

        logger.error(
            error,
            "Report check failed"
        );

    }

}


export function startScheduler() {

    logger.info(
        `Scheduler started. Timezone: ${config.TIMEZONE}`
    );


    // Каждый день в 09:00
    cron.schedule(
        "30 16 * * *",
        async () => {

            logger.info(
                "09:00 scheduled run"
            );

            await runReportCheck();

        },
        {
            timezone: config.TIMEZONE
        }
    );


    // Каждый день в 14:00
    cron.schedule(
        "0 14 * * *",
        async () => {

            logger.info(
                "14:00 scheduled run"
            );

            await runReportCheck();

        },
        {
            timezone: config.TIMEZONE
        }
    );


}