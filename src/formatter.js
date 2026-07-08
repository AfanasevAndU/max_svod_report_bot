export function formatExpiredReports(reports) {

    if (!reports || reports.length === 0) {
        return null;
    }


    const grouped = reports.reduce((acc, report) => {

        if (!acc[report.organization]) {
            acc[report.organization] = [];
        }

        acc[report.organization].push(report);

        return acc;

    }, {});


    const lines = [];

    lines.push("🚨 Просроченные отчеты");
    lines.push("");


    for (const [organization, orgReports] of Object.entries(grouped)) {

        lines.push(`🏢 ${organization}`);
        lines.push("");

        for (const report of orgReports) {

            lines.push(
                `📄 ${report.reportName}`
            );

            lines.push(
                `📅 ${report.reportPeriod}`
            );

            if (report.comment) {
                lines.push(
                    `💬 ${report.comment}`
                );
            }

            lines.push("");

        }

        lines.push("────────────────");
        lines.push("");

    }

    const message = lines.join("\n");

    if (message.length > 4000) {
        return message.substring(0, 3900)
            + "\n\n⚠️ Сообщение обрезано";
    }

    return message;

}