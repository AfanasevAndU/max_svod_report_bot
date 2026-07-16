import { getReports } from "./clickhouse.js";
import {
    getDeadline,
    isDailyReportPeriod,
    hasDeadlineTime,
    isExcludedByComment
} from "./periodParser.js";
import {
    logger,
    logCheckStarted,
    logCheckFinished,
    logNoReports
} from "./logger.js";

function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate();
}

export async function checkReports() {

    logCheckStarted();

    const reports = await getReports();

    const now = new Date();

    const dueTodayReports = [];
    const dueLaterReports = [];
    const overdueReports = [];

    for (const report of reports) {

        try {

            // Отчет с меткой-исключением в комментарии (например "Другой отдел")
            // не отправляем в MAX, независимо от срока сдачи.
            if (isExcludedByComment(report.comment)) {
                continue;
            }

            // Ежедневный отчет без указанного времени сдачи в комментарии
            // не отправляем в MAX.
            if (
                isDailyReportPeriod(report.report_period)
                && !hasDeadlineTime(report.comment)
            ) {
                continue;
            }

            const deadline =
                getDeadline(report.report_period, report.comment);

            const mapped = {
                reportPeriod: report.report_period,
                organization: report.organization,
                reportName: report.report_name,
                status: report.status,
                comment: report.comment,
                deadline
            };

            if (isSameDay(deadline, now)) {
                dueTodayReports.push(mapped);

                if (deadline > now) {
                    dueLaterReports.push(mapped);
                } else {
                    overdueReports.push(mapped);
                }
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

    if (dueTodayReports.length === 0 && overdueReports.length === 0) {
        logNoReports();
    }

    logCheckFinished(dueTodayReports.length, overdueReports.length);

    return { dueTodayReports, dueLaterReports, overdueReports };

}
