import { createClient } from "@clickhouse/client";

import { config } from "./config.js";
import { logger } from "./logger.js";

const client = createClient({
    url: `${config.CLICKHOUSE_HOST}:${config.CLICKHOUSE_PORT}`,

    username: config.CLICKHOUSE_USER,

    password: config.CLICKHOUSE_PASSWORD,

    database: config.CLICKHOUSE_DATABASE
});

// Сегодняшняя дата (YYYY-MM-DD) в часовом поясе бота — совпадает с тем,
// как загрузчик пишет load_date.
function todayInTimezone(timezone) {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(new Date());
}

export async function getReports() {

    // Таблицу заполняет загрузчик svod_reports: в ней уже только отчёты,
    // которые нужны боту (bot=true), с непустым deadline_time и periodEnd=сегодня.
    // Берём снимок за сегодня и отсеиваем уже подготовленные.
    const today = todayInTimezone(config.TIMEZONE);

    const query = `
        SELECT
            organization,
            department,
            report_type,
            state,
            period,
            period_end,
            deadline_date,
            deadline_time,
            template_comment
        FROM ${config.CLICKHOUSE_TABLE}
        WHERE load_date = {today:Date}
          AND state != 'Подготовлен'
          AND state != 'Утвержден'
          AND state != 'Показатели отсутствуют'
    `;

    try {

        logger.debug(`Loading reports from ClickHouse for ${today}...`);

        const result = await client.query({
            query,
            query_params: { today },
            format: "JSONEachRow"
        });

        const rows = await result.json();

        logger.info(`Loaded ${rows.length} report(s)`);

        return rows;

    } catch (err) {

        logger.error(err, "ClickHouse query failed");

        throw err;

    }

}
