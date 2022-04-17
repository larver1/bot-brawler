const fs = require("fs");
const { Client, Collection, Intents, Partials } = require("discord.js");
const { token } = require("./config.json");
const { default: logger } = require("consola");

//Create discord client
const client = new Client({ intents: [
    Intents.FLAGS.GUILDS, 
    Intents.FLAGS.GUILD_MESSAGES, 
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.DIRECT_MESSAGES
]});
client.commands = new Collection();

//Setup handlers
require("./Database/dbStatus")(client);
require("./Handlers/Events")(client);
require("./Handlers/Commands")(client);

client.login(token);
