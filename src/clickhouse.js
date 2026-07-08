import { createClient } from "@clickhouse/client";

import { config } from "./config.js";
import { logger } from "./logger.js";

const client = createClient({
    url: `${config.CLICKHOUSE_HOST}:${config.CLICKHOUSE_PORT}`,

    username: config.CLICKHOUSE_USER,

    password: config.CLICKHOUSE_PASSWORD,

    database: config.CLICKHOUSE_DATABASE
});

export async function getReports() {

    const query = `
        SELECT
            report_period,
            organization,
            report_name,
            status,
            comment
        FROM ${config.CLICKHOUSE_TABLE}
        WHERE status != 'Подготовлен'
    `;

    try {

        logger.debug("Loading reports from ClickHouse...");

        const result = await client.query({
            query,
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