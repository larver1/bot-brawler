const { Client, Collection, Intents } = require("discord.js");
const { token, topggpass } = require("./config.json");
const Topgg = require("@top-gg/sdk");
const express = require("express");
const dbAccess = require("./Database/dbAccess");

const app = express();
const webhook = new Topgg.Webhook(topggpass);

// Create discord client
const client = new Client({ intents: [
    Intents.FLAGS.GUILDS, 
    Intents.FLAGS.GUILD_MESSAGES, 
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.DIRECT_MESSAGES
]});

app.post("/dblwebhook", webhook.listener(vote => {
    dbAccess.voteLogic(vote.user, client);
}));

app.listen(80);

client.commands = new Collection();

// Setup handlers
require("./Database/dbStatus")(client);
require("./Handlers/Events")(client);
require("./Handlers/Commands")(client);

// Setup bot user timers
require("./Helpers/BotUsers")(client);

client.login(token);
