import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import readline from "readline";

const apiId = parseInt(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH;
const stringSession = new StringSession(process.env.TELEGRAM_SESSION_STRING); // fill this later with the value from session.save()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

export async function connect() {
  console.log("Loading interactive example...");
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });
  await client.start({
    phoneNumber: async () =>
      new Promise((resolve) =>
        rl.question("Please enter your number: ", resolve)
      ),
    password: async () =>
      new Promise((resolve) =>
        rl.question("Please enter your password: ", resolve)
      ),
    phoneCode: async () =>
      new Promise((resolve) =>
        rl.question("Please enter the code you received: ", resolve)
      ),
    onError: (err) => console.log(err),
  });
  console.log("You should now be connected.");
  // console.log(client.session.save()); // Save this string to avoid logging in again
  // await client.sendMessage("me", { message: "Hello!" });
  return client;
}

export async function getMessages(client, count) {
  const chats = await client.getDialogs();
  const chat = chats.find(c => c.name === 'Purple Squad')
  const users = await client.getParticipants(chat);
  const messages = await client.getMessages(chat, { limit: count });
  return messages.map(m => {
    const user = users.find(u => u.id.toString() === m.fromId?.userId.toString());
    if (!user) return null;
    const replyTo = m.replyToMsgId ? messages.find(msg => msg.id.toString() === m.replyToMsgId.toString()) : null;
    const replyToUser = replyTo ? users.find(u => u.id.toString() === replyTo.fromId.userId.toString()) : null;
    return `${user.firstName}: ${m.message} ${replyTo ? `\nReply To: ${replyToUser.firstName}: ${replyTo.message}` : ''}`;  
  }).filter(m => m && !m.startsWith('PurpleSquadBot') && !m.includes('@purple_squad_bot'));
}