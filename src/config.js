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