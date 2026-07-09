const MONTHS = {
    "январь": 0,
    "января": 0,

    "февраль": 1,
    "февраля": 1,

    "март": 2,
    "марта": 2,

    "апрель": 3,
    "апреля": 3,

    "май": 4,
    "мая": 4,

    "июнь": 5,
    "июня": 5,

    "июль": 6,
    "июля": 6,

    "август": 7,
    "августа": 7,

    "сентябрь": 8,
    "сентября": 8,

    "октябрь": 9,
    "октября": 9,

    "ноябрь": 10,
    "ноября": 10,

    "декабрь": 11,
    "декабря": 11
};

function parseDate(dateString) {

    const parts = dateString.split(".");

    return new Date(
        Number(parts[2]),
        Number(parts[1]) - 1,
        Number(parts[0])
    );

}

function lastDayOfMonth(year, month) {
    return new Date(year, month + 1, 0);
}

const DAY_REGEX =
    /^(\d{1,2})\s+([А-Яа-я]+)\s+(\d{4})/i;

export function parseReportPeriod(reportPeriod) {

    const value = reportPeriod.trim();

    // -----------------------------
    // 01.01.2026 - 07.01.2026
    // -----------------------------

    if (value.includes("-")) {

        const [, end] = value.split("-");

        return parseDate(end.trim());

    }

    // -----------------------------
    // 1 февраля 2026 г.
    // -----------------------------

    const dayMatch = value.match(DAY_REGEX);

    if (dayMatch) {

        const day = Number(dayMatch[1]);

        const month = MONTHS[
            dayMatch[2].toLowerCase()
        ];

        const year = Number(dayMatch[3]);

        return new Date(year, month, day);

    }

    // -----------------------------
    // Июнь 2026 г.
    // -----------------------------

    const monthRegex =
        /^([А-Яа-я]+)\s+(\d{4})/i;

    const monthMatch = value.match(monthRegex);

    if (monthMatch) {

        const month = MONTHS[
            monthMatch[1].toLowerCase()
        ];

        const year = Number(monthMatch[2]);

        return lastDayOfMonth(year, month);

    }

    throw new Error(
        `Unknown report_period format: ${reportPeriod}`
    );

}

// Отчет за конкретный день ("9 июля 2026 г."), в отличие от
// недельного диапазона ("01.07.2026 - 09.07.2026") или месяца ("Июль 2026 г.").
export function isDailyReportPeriod(reportPeriod) {

    const value = reportPeriod.trim();

    return !value.includes("-") && DAY_REGEX.test(value);

}

const DEADLINE_DATE_REGEX =
    /Дата сдачи:\s*(\d{1,2})\.(\d{1,2})/i;

const DEADLINE_TIME_REGEX =
    /Время сдачи:\s*(\d{1,2}):(\d{2})/i;

export function hasDeadlineTime(comment) {
    return Boolean(comment) && DEADLINE_TIME_REGEX.test(comment);
}

// Разбирает комментарий вида "Дата сдачи: 09.07; Время сдачи: 10:00"
// (для ежемесячных отчетов) или "Время сдачи: 10:00" (для остальных)
// и возвращает точный дедлайн (дата + время сдачи).
export function getDeadline(reportPeriod, comment) {

    let deadlineDate =
        parseReportPeriod(reportPeriod);

    if (comment) {

        const dateMatch =
            comment.match(DEADLINE_DATE_REGEX);

        if (dateMatch) {

            const day = Number(dateMatch[1]);
            const month = Number(dateMatch[2]) - 1;

            deadlineDate = new Date(
                deadlineDate.getFullYear(),
                month,
                day
            );

        }

    }

    let hours = 0;
    let minutes = 0;

    if (comment) {

        const timeMatch =
            comment.match(DEADLINE_TIME_REGEX);

        if (timeMatch) {
            hours = Number(timeMatch[1]);
            minutes = Number(timeMatch[2]);
        }

    }

    return new Date(
        deadlineDate.getFullYear(),
        deadlineDate.getMonth(),
        deadlineDate.getDate(),
        hours,
        minutes
    );

}