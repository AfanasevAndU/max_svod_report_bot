import { getReports } from "./clickhouse.js";
import { buildDeadline } from "./periodParser.js";
import {
    logger,
    logCheckStarted,
    logCheckFinished,
    logNoReports
} from "./logger.js";

export async function checkReports() {

    logCheckStarted();

    const reports = await getReports();

    const now = new Date();

    const dueTodayReports = [];
    const dueLaterReports = [];
    const overdueReports = [];

    for (const report of reports) {

        // Дедлайн: дата окончания периода (period_end = сегодня) + время сдачи.
        const deadline = buildDeadline(report.period_end, report.deadline_time);

        if (!deadline) {
            logger.warn(
                {
                    period: report.period,
                    periodEnd: report.period_end,
                    deadlineTime: report.deadline_time
                },
                "Cannot build deadline from period_end/deadline_time"
            );
            continue;
        }

        const mapped = {
            reportPeriod: report.period,
            organization: report.organization,
            reportName: report.report_type,
            status: report.state,
            comment: report.template_comment,
            deadline
        };

        // Все строки — сегодняшние (загрузчик отбирает periodEnd = сегодня),
        // поэтому каждая попадает в «сдать сегодня».
        dueTodayReports.push(mapped);

        if (deadline > now) {
            dueLaterReports.push(mapped);
        } else {
            overdueReports.push(mapped);
        }

    }

    if (dueTodayReports.length === 0 && overdueReports.length === 0) {
        logNoReports();
    }

    logCheckFinished(dueTodayReports.length, overdueReports.length);

    return { dueTodayReports, dueLaterReports, overdueReports };

}
