// Загрузчик svod_reports кладёт в таблицу готовые поля:
//   period_end    — дата окончания периода (Date, для сегодняшних отчётов = сегодня);
//   deadline_time — время сдачи в формате "HH:MM".
// Отдельный разбор форматов report_period и комментариев больше не нужен —
// точный дедлайн собирается напрямую из этих двух полей.

const DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})/;
const TIME_REGEX = /(\d{1,2}):(\d{2})/;

// Собирает Date дедлайна из period_end ("YYYY-MM-DD") и deadline_time ("HH:MM").
// Возвращает null, если данных не хватает.
export function buildDeadline(periodEnd, deadlineTime) {

    if (typeof periodEnd !== "string") {
        return null;
    }

    const dateMatch = periodEnd.match(DATE_REGEX);
    const timeMatch =
        typeof deadlineTime === "string"
            ? deadlineTime.match(TIME_REGEX)
            : null;

    if (!dateMatch || !timeMatch) {
        return null;
    }

    return new Date(
        Number(dateMatch[1]),
        Number(dateMatch[2]) - 1,
        Number(dateMatch[3]),
        Number(timeMatch[1]),
        Number(timeMatch[2])
    );

}
