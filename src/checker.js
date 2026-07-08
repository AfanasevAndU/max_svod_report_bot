import { getReports } from "./clickhouse.js";
import { isExpired } from "./periodParser.js";
import {
    logger,
    logCheckStarted,
    logCheckFinished,
    logNoReports
} from "./logger.js";

export async function checkReports() {

    logCheckStarted();

    const reports = await getReports();

    const expiredReports = [];

    for (const report of reports) {

        try {

            if (isExpired(report.report_period)) {

                expiredReports.push({
                    reportPeriod: report.report_period,
                    organization: report.organization,
                    reportName: report.report_name,
                    status: report.status,
                    comment: report.comment
                });

            }

        } catch (err) {

            logger.warn(
                {
                    reportPeriod: report.report_period
                },
                "Unknown report_period format"
            );

        }

    }

    if (expiredReports.length === 0) {
        logNoReports();
    }

    logCheckFinished(expiredReports.length);

    return expiredReports;

}