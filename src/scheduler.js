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
    logger.info(
        `Cron: morning ${config.MORNING_CRON}, midday ${config.MIDDAY_CRON}, evening ${config.EVENING_CRON}`
    );


    // Утро — отчёты, которые нужно сдать сегодня
    cron.schedule(
        config.MORNING_CRON,
        async () => {

            logger.info(
                "Morning scheduled run"
            );

            await runMorningCheck();

        },
        {
            timezone: config.TIMEZONE
        }
    );


    // День — «ещё нужно сдать» + «просрочено»
    cron.schedule(
        config.MIDDAY_CRON,
        async () => {

            logger.info(
                "Midday scheduled run"
            );

            await runIntradayCheck();

        },
        {
            timezone: config.TIMEZONE
        }
    );


    // Вечер — «ещё нужно сдать» + «просрочено»
    cron.schedule(
        config.EVENING_CRON,
        async () => {

            logger.info(
                "Evening scheduled run"
            );

            await runIntradayCheck();

        },
        {
            timezone: config.TIMEZONE
        }
    );


}
