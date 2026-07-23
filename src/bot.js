import { Bot } from "@maxhub/max-bot-api";

import { config } from "./config.js";
import { logger } from "./logger.js";


const bot = new Bot(config.MAX_BOT_TOKEN);


export async function sendMessage(text, chatId = config.MAX_CHAT_ID) {

    try {

        const message = String(text);


        const result = await bot.api.sendMessageToChat(
            chatId,
            message,
            { format: "markdown" }
        );


        logger.info(
            "MAX message sent successfully"
        );


        return result;


    } catch (error) {

        logger.error(
            error,
            "Failed to send MAX message"
        );

        throw error;

    }

}