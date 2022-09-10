const { Client, Collection, Intents } = require("discord.js");
const { token, topgg, topggpass, debug } = require("./config.json");
const Topgg = require("@top-gg/sdk");
const express = require("express");
const { AutoPoster } = require('topgg-autoposter');
const dbAccess = require("./Database/dbAccess");

// Only post to top.gg on live server
if(!debug) { 
    const app = express();
    const webhook = new Topgg.Webhook(topggpass);

    app.post("/dblwebhook", webhook.listener(vote => {
        dbAccess.voteLogic(vote.user, client);
    }));
    
    app.listen(80);

    const ap = AutoPoster(topgg, client);

    ap.on('posted', () => {
        console.log('Posted stats to Top.gg!');
    });
}

// Create discord client
const client = new Client({ intents: [
    Intents.FLAGS.GUILDS, 
    Intents.FLAGS.GUILD_MESSAGES, 
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.DIRECT_MESSAGES
]});

client.commands = new Collection();

// Setup handlers
require("./Database/dbStatus")(client);
require("./Handlers/Events")(client);
require("./Handlers/Commands")(client);

// Setup bot user timers
require("./Helpers/BotUsers")(client);

client.login(token);
