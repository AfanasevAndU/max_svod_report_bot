const MAX_MESSAGE_LENGTH = 4000;

// Запас под возможный суффикс "(часть N из M)", заголовок и PS,
// которые добавляются уже после того, как блоки посчитаны.
const RESERVE_MARGIN = 60;

const PS_LINE =
    "PS: после заполнения отчета не забывайте переводить его в статус \"Подготовлен\"";

function formatDeadline(date) {

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${day}.${month}.${year} ${hours}:${minutes}`;

}

// Сообщения уходят в MAX с format: "markdown", поэтому спецсимволы
// в названиях отчетов и МО нужно экранировать, иначе разметка поедет.
function escapeMarkdown(text) {
    return String(text).replace(/([\\`*_~\[\]])/g, "\\$1");
}

// Группирует отчеты по названию, а внутри - по дедлайну,
// чтобы не повторять его для каждой МО, у которой он совпадает.
function buildReportBlocks(reports, buildReportLine) {

    const groupedByReport = reports.reduce((acc, report) => {

        if (!acc[report.reportName]) {
            acc[report.reportName] = [];
        }

        acc[report.reportName].push(report);

        return acc;

    }, {});

    const blocks = [];

    for (const [reportName, reportEntries] of Object.entries(groupedByReport)) {

        const groupedByDeadline = reportEntries.reduce((acc, report) => {

            const key = report.deadline.getTime();

            if (!acc[key]) {
                acc[key] = {
                    deadline: report.deadline,
                    organizations: []
                };
            }

            acc[key].organizations.push(report.organization);

            return acc;

        }, {});

        for (const { deadline, organizations } of Object.values(groupedByDeadline)) {

            const lines = [
                buildReportLine(escapeMarkdown(reportName), formatDeadline(deadline)),
                "Не заполнили:",
                ...organizations.map(organization => `🏢 ${escapeMarkdown(organization)}`)
            ];

            blocks.push(lines.join("\n"));

        }

    }

    return blocks;

}

// Разбивает блоки на несколько сообщений, если общий текст
// превышает лимит MAX API (4000 символов на сообщение).
function formatReportsMessage(reports, { greeting, intro, buildReportLine }) {

    if (!reports || reports.length === 0) {
        return [];
    }

    const blocks = buildReportBlocks(reports, buildReportLine);

    const header = greeting
        ? `${greeting} ${intro}`
        : intro;

    const reserve = RESERVE_MARGIN + header.length + PS_LINE.length;

    const chunks = [];
    let current = [];
    let currentLength = reserve;

    for (const block of blocks) {

        const blockLength = block.length + 2;

        if (current.length > 0 && currentLength + blockLength > MAX_MESSAGE_LENGTH) {
            chunks.push(current);
            current = [];
            currentLength = reserve;
        }

        current.push(block);
        currentLength += blockLength;

    }

    if (current.length > 0) {
        chunks.push(current);
    }

    const totalParts = chunks.length;

    return chunks.map((blocksInChunk, index) => {

        const parts = [];

        if (totalParts > 1) {
            parts.push(`(часть ${index + 1} из ${totalParts})`);
        }

        parts.push(header);
        parts.push(...blocksInChunk);
        parts.push(PS_LINE);

        return parts.join("\n\n");

    });

}

export function formatDueTodayReports(reports) {
    return formatReportsMessage(reports, {
        greeting: "Доброе утро!",
        intro: "Уважаемые коллеги, напоминаю о необходимости заполнения следующих отчетов в 1С:Свод отчетов:",
        buildReportLine: (reportName, deadlineStr) =>
            `**"${reportName}"** до "${deadlineStr}"`
    });
}

export function formatDueLaterReports(reports) {
    return formatReportsMessage(reports, {
        greeting: null,
        intro: "Уважаемые коллеги, напоминаю о необходимости заполнения следующих отчетов в 1С:Свод отчетов:",
        buildReportLine: (reportName, deadlineStr) =>
            `**"${reportName}"** до "${deadlineStr}"`
    });
}

export function formatOverdueReports(reports) {
    return formatReportsMessage(reports, {
        greeting: null,
        intro: "Уважаемые коллеги, следующие отчеты в 1С:Свод отчетов просрочены:",
        buildReportLine: (reportName, deadlineStr) =>
            `**"${reportName}"** — срок сдачи был "${deadlineStr}"`
    });
}
