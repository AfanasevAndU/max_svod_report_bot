const MAX_MESSAGE_LENGTH = 4000;

// Запас под суффикс " (часть N из M)", который дописывается
// к заголовку уже после того, как чанки посчитаны.
const PART_SUFFIX_RESERVE = 40;

function buildUnits(reports) {

    const groupedByReport = reports.reduce((acc, report) => {

        if (!acc[report.reportName]) {
            acc[report.reportName] = [];
        }

        acc[report.reportName].push(report);

        return acc;

    }, {});

    const units = [];

    for (const [reportName, reportEntries] of Object.entries(groupedByReport)) {

        units.push([`📄 ${reportName}`, ""]);

        // Внутри отчета группируем по периоду/комментарию, чтобы не
        // повторять их для каждой МО, у которой они совпадают.
        const groupedByDeadline = reportEntries.reduce((acc, report) => {

            const key = `${report.reportPeriod}|${report.comment || ""}`;

            if (!acc[key]) {
                acc[key] = {
                    reportPeriod: report.reportPeriod,
                    comment: report.comment,
                    organizations: []
                };
            }

            acc[key].organizations.push(report.organization);

            return acc;

        }, {});

        for (const { reportPeriod, comment, organizations } of Object.values(groupedByDeadline)) {

            const lines = [`📅 ${reportPeriod}`];

            if (comment) {
                lines.push(`💬 ${comment}`);
            }

            for (const organization of organizations) {
                lines.push(`🏢 ${organization}`);
            }

            lines.push("");

            units.push(lines);

        }

        units.push(["────────────────", ""]);

    }

    return units;

}

// Разбивает отчеты на несколько сообщений, если общий текст
// превышает лимит MAX API (4000 символов на сообщение).
function formatReportsList(reports, title) {

    if (!reports || reports.length === 0) {
        return [];
    }

    const units = buildUnits(reports);

    const headerLength = title.length + PART_SUFFIX_RESERVE + 1;

    const chunks = [];
    let current = [];
    let currentLength = headerLength;

    for (const unit of units) {

        const unitLength = unit.join("\n").length + 1;

        if (current.length > 0 && currentLength + unitLength > MAX_MESSAGE_LENGTH) {
            chunks.push(current);
            current = [];
            currentLength = headerLength;
        }

        current.push(...unit);
        currentLength += unitLength;

    }

    if (current.length > 0) {
        chunks.push(current);
    }

    const totalParts = chunks.length;

    return chunks.map((chunkLines, index) => {

        const chunkTitle = totalParts > 1
            ? `${title} (часть ${index + 1} из ${totalParts})`
            : title;

        return [chunkTitle, "", ...chunkLines].join("\n");

    });

}

export function formatDueTodayReports(reports) {
    return formatReportsList(
        reports,
        "📋 Отчеты к сдаче сегодня"
    );
}

export function formatDueLaterReports(reports) {
    return formatReportsList(
        reports,
        "⏰ Отчеты к сдаче сегодня"
    );
}

export function formatOverdueReports(reports) {
    return formatReportsList(
        reports,
        "🚨 Просроченные отчеты (сегодня)"
    );
}
