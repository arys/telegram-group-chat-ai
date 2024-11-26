import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { connect, getMessages } from './gram';
dotenv.config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {polling: true});
const client = await connect()

// Matches "/analyze [count]"
bot.onText(/\/analyze (\d+)/, async (msg, match) => {
  const count = match[1] > 1000 ? 1000 : match[1];

  bot.sendMessage(msg.chat.id, `Анализирую последние ${count} сообщений...`);

  const messages = await getMessages(client, count);

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Ты - полезный бот-аналитик для группового чата. Твоя задача:\n\n1. Проанализировать последние сообщения и выделить:\n- Основные обсуждаемые темы\n- Ключевые моменты дискуссий\n- Важные решения или договоренности\n- Активных участников обсуждения\n\n2. Создать структурированное резюме в формате:\n- Краткий обзор (2-3 предложения)\n- Основные темы (маркированный список)\n- Ключевые моменты (маркированный список)\n- Следующие шаги/решения (если есть)\n\n3. Учитывать многоязычность чата:\n- Обрабатывать сообщения на русском, казахском и английском языках\n- Давать ответ на том языке, на котором написано большинство сообщений\n\nОтвет должен быть четким, информативным и хорошо структурированным."
        },
        {
          role: "user", 
          content: messages.join('\n')
        }
      ],
      model: "gpt-4o",
    });
    const response = completion.choices[0].message.content;
    await bot.sendMessage(msg.chat.id, `Анализ последних ${count} сообщений:\n\n${response}`);

  } catch (error) {
    console.error('Error:', error);
    await bot.sendMessage(msg.chat.id, 'Sorry, I encountered an error while processing your request.');
  }
});

bot.onText(/\/ask (.+)/, async (msg, match) => {
  const question = match[1];
  console.log(`Анализирую последние 1000 сообщений чтобы ответить на вопрос "${question}"...`);
  bot.sendMessage(msg.chat.id, `Анализирую последние 1000 сообщений чтобы ответить на вопрос "${question}"...`);
  const messages = await getMessages(client, 1000);
  console.log(JSON.stringify(messages, null, 2));
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Ты - полезный бот-аналитик для группового чата. Твоя задача:\n\n1. Ответить на вопрос пользователя на основе последних сообщений."
        },
        {
          role: "user", 
          content: `Вопрос: ${question}\n\nПоследние сообщения: ${messages.join('\n')}`
        }
      ],
      model: "gpt-4o",
    });
    const response = completion.choices[0].message.content;
    await bot.sendMessage(msg.chat.id, `Ответ на вопрос:\n\n${response}`);

  } catch (error) {
    console.error('Error:', error);
    await bot.sendMessage(msg.chat.id, 'Sorry, I encountered an error while processing your request.');
  }
});

bot.onText(/\/help/, async (msg) => {
  await bot.sendMessage(msg.chat.id, 'Команды:\n/analyze [count] - анализ последних [count] сообщений\n/ask [question] - ответ на вопрос\n/help - помощь');
});