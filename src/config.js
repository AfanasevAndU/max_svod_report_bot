import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const schema = z.object({
    MAX_BOT_TOKEN: z.string().min(1),
    MAX_CHAT_ID: z.string().min(1),

    CLICKHOUSE_HOST: z.string().min(1),
    CLICKHOUSE_PORT: z.coerce.number().default(8123),
    CLICKHOUSE_USER: z.string().default("default"),
    CLICKHOUSE_PASSWORD: z.string().default(""),
    CLICKHOUSE_DATABASE: z.string().min(1),
    CLICKHOUSE_TABLE: z.string().min(1),

    TIMEZONE: z.string().default("Asia/Yekaterinburg"),

    // Расписание рассылки (cron). Загрузчик пишет данные в 08:00/13:00/16:00,
    // бот шлёт напоминания после — по умолчанию 09:00/14:00/17:00.
    MORNING_CRON: z.string().default("0 9 * * *"),
    MIDDAY_CRON: z.string().default("0 14 * * *"),
    EVENING_CRON: z.string().default("0 17 * * *"),

    NODE_ENV: z
        .enum(["development", "production"])
        .default("development")
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
    console.error("\n❌ Ошибка в .env\n");

    parsed.error.issues.forEach(issue => {
        console.error(`• ${issue.path.join(".")} - ${issue.message}`);
    });

    process.exit(1);
}

export const config = parsed.data;


// Маршрутизация по отделам.
// В .env задаются пары DEPARTMENT_<n>_NAME / DEPARTMENT_<n>_CHAT_ID.
// Отчёт с полем department отправляется в чат своего отдела;
// если отдел не задан или не найден — в общий MAX_CHAT_ID.
function parseDepartments(env) {

    const indices = new Set();

    for (const key of Object.keys(env)) {
        const match = key.match(/^DEPARTMENT_(\d+)_NAME$/);
        if (match) {
            indices.add(match[1]);
        }
    }

    const map = new Map();

    for (const index of indices) {
        const name = (env[`DEPARTMENT_${index}_NAME`] || "").trim();
        const chatId = (env[`DEPARTMENT_${index}_CHAT_ID`] || "").trim();

        if (name && chatId) {
            // Ключ в нижнем регистре — устойчивость к регистру в данных API.
            map.set(name.toLowerCase(), chatId);
        }
    }

    return map;
}

const departmentChats = parseDepartments(process.env);

// Возвращает chat_id отдела, либо null, если отдел не указан
// или для него не задан chat_id (тогда отчёт не отправляется).
export function resolveChatId(department) {

    if (!department) {
        return null;
    }

    return departmentChats.get(String(department).trim().toLowerCase()) || null;
}