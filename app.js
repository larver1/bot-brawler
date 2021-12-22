const fs = require('fs');
const Discord = require('discord.js');
const { token  } = require('./config.json');

const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });


client.once('ready', async () => {

	console.log(`Logged in as ${client.user.tag}!`);
	client.user.setUsername('Bot Brawler');
	client.user.setActivity('Bot is restarting...');
	
	//Set up user

	client.user.setActivity('Beep Booooop');
	client.on('messageCreate', async message => {
		console.log("message");
	});
	
	client.on('interactionCreate', async interaction => {
		console.log("something");
	});

});

client.login(token);
