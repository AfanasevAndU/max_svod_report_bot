import { startScheduler } from "./scheduler.js";
import { logStart, logger } from "./logger.js";


async function main() {

    try {

        logStart();

        startScheduler();

        logger.info(
            "Report monitor is running"
        );


    } catch (error) {

        logger.error(
            error,
            "Application startup failed"
        );

        process.exit(1);

    }

}


main();