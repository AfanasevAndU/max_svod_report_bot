import cron from "node-cron";

import { checkReports } from "./checker.js";
import {
    formatDueTodayReports,
    formatDueLaterReports,
    formatOverdueReports
} from "./formatter.js";
import { sendMessage } from "./bot.js";

import { config } from "./config.js";
import { logger } from "./logger.js";


async function sendIfPresent(reports, formatFn) {

    if (reports.length === 0) {
        return;
    }

    const messages = formatFn(reports);

    for (const message of messages) {
        await sendMessage(message);
    }

}


// 9:00 — отчеты, которые нужно сдать сегодня
async function runMorningCheck() {

    try {

        logger.info("Starting morning report check...");

        const { dueTodayReports } = await checkReports();

        await sendIfPresent(dueTodayReports, formatDueTodayReports);

    } catch (error) {

        logger.error(
            error,
            "Morning report check failed"
        );

    }

}


// 14:00 / 17:00 — отчеты, которые нужно сдать позже сегодня,
// и отдельным сообщением уже просроченные
async function runIntradayCheck() {

    try {

        logger.info("Starting intraday report check...");

        const { dueLaterReports, overdueReports } = await checkReports();

        await sendIfPresent(dueLaterReports, formatDueLaterReports);
        await sendIfPresent(overdueReports, formatOverdueReports);

    } catch (error) {

        logger.error(
            error,
            "Intraday report check failed"
        );

    }

}


export function startScheduler() {

    logger.info(
        `Scheduler started. Timezone: ${config.TIMEZONE}`
    );


    // Каждый день в 09:00
    cron.schedule(
        "12 9 * * *",
        async () => {

            logger.info(
                "09:00 scheduled run"
            );

            await runMorningCheck();

        },
        {
            timezone: config.TIMEZONE
        }
    );


    // Каждый день в 14:00
    cron.schedule(
        "5 11 * * *",
        async () => {

            logger.info(
                "14:00 scheduled run"
            );

            await runIntradayCheck();

        },
        {
            timezone: config.TIMEZONE
        }
    );


    // Каждый день в 17:00
    cron.schedule(
        "0 17 * * *",
        async () => {

            logger.info(
                "17:00 scheduled run"
            );

            await runIntradayCheck();

        },
        {
            timezone: config.TIMEZONE
        }
    );


}
