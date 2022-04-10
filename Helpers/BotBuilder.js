
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const ErrorHandler = require("./ErrorHandler.js");
const BotStats = require("../Database/dbBotStats.js");
const bots = JSON.parse(fs.readFileSync('./Data/Bots/botData.json'));

module.exports = class BotBuilder
{
    static async build(interaction, info, user) {

		let botObj = {};

		//Define all the bot properties
		botObj.bot_type = info.bot_type ? info.bot_type : bots[Math.floor(Math.random()  * bots.length)].name;
		botObj.model_no = info.model_no ? info.model_no : await this.generateModelNo(interaction, botObj.bot_type);
		botObj.owner_username = info.owner_username ? botObj.owner_username : user.username;
		botObj.owner_original_username = botObj.owner_username;
		botObj.exp = info.exp ? info.exp : 0;
		botObj.alive = info.alive ? info.alive : true;
		botObj.powerBoost = info.powerBoost ? info.powerBoost : Math.ceil(Math.random() * 20);
		botObj.lifespanBoost = info.lifespanBoost ? info.lifespanBoost : Math.ceil(Math.random() * 20);
		botObj.viralBoost = info.viralBoost ? info.viralBoost : Math.ceil(Math.random() * 20);
		botObj.firewallBoost = info.firewallBoost ? info.firewallBoost : Math.ceil(Math.random() * 20);
		botObj.goldPlated = info.goldPlated ? info.goldPlated : 0.001 > Math.random();
		botObj.extras = info.extras ? info.extras : "";
		botObj.isSelling = info.isSelling ? info.isSelling : false;
		botObj.item = info.item ? info.item : "";

		if(!this.validate(interaction, botObj))
			return;

		return botObj;

	}

	static async generateModelNo(interaction, name) {

		// Find number of this bot in existence
		let numExists = await BotStats.addExists(interaction, name);
		let modelString = numExists.toString();

		// Lead string with zeros
		return "M-" + modelString.padStart(5, '0');
	}

	static async validate(interaction, botObj){
		let err;

		if(!this.validateBotType(botObj.bot_type)) {
			err = new Error(`Bot type ${botObj.bot_type} is invalid on botBuilder.buildBot()`);
			return ErrorHandler.error(interaction, err);
		} else if(!this.validateOwnerUsername(botObj.owner_username)) {
			err = new Error(`Bot owner ${botObj.owner_username} is invalid on botBuilder.buildBot()`);
			return ErrorHandler.error(interaction, err);
		} else if(!this.validateOwnerUsername(botObj.owner_original_username)) {
			err = new Error(`Bot original owner ${botObj.owner_original_username} is invalid on botBuilder.buildBot()`);
			return ErrorHandler.error(interaction, err);
		} else if(!this.validateExp(botObj.exp)) {
			err = new Error(`Bot exp ${botObj.exp} is invalid on botBuilder.buildBot()`);
			return ErrorHandler.error(interaction, err);
		} else if(!this.validateExp(botObj.alive)) {
			err = new Error(`Bot alive ${botObj.alive} is invalid on botBuilder.buildBot()`);
			return ErrorHandler.error(interaction, err);
		} else if(!this.validateBoost(botObj.powerBoost)) {
			err = new Error(`Bot power boost ${botObj.powerBoost} is invalid on botBuilder.buildBot()`);
			return ErrorHandler.error(interaction, err);
		} else if(!this.validateBoost(botObj.lifespanBoost)) {
			err = new Error(`Bot lifespan boost ${botObj.lifespanBoost} is invalid on botBuilder.buildBot()`);
			return ErrorHandler.error(interaction, err);
		} else if(!this.validateBoost(botObj.viralBoost)) {
			err = new Error(`Bot viral boost ${botObj.viralBoost} is invalid on botBuilder.buildBot()`);
			return ErrorHandler.error(interaction, err);
		} else if(!this.validateBoost(botObj.firewallBoost)) {
			err = new Error(`Bot firewall boost ${botObj.firewallBoost} is invalid on botBuilder.buildBot()`);
			return ErrorHandler.error(interaction, err);
		} else if(!this.validateBoost(botObj.goldPlated)) {
			err = new Error(`Bot gold plated ${botObj.goldPlated} is invalid on botBuilder.buildBot()`);
			return ErrorHandler.error(interaction, err);
		} else if(!this.validateExtras(botObj.extras)) {
			err = new Error(`Bot extras ${botObj.extras} is invalid on botBuilder.buildBot()`);
			return ErrorHandler.error(interaction, err);
		} else if(!this.validateIsSelling(botObj.isSelling)) {
			err = new Error(`Bot isSelling ${botObj.isSelling} is invalid on botBuilder.buildBot()`);
			return ErrorHandler.error(interaction, err);
		}

		return true;

	}

	static async validateBotType(bot_type) {
		for(const bot of bots)
			if(bot_type == bot.name)
				return true;
		return false;
	}

	static async validateOwnerUsername(owner_username) {
		if(typeof owner_username == "string" && owner_username.length > 1)
			return true;
		return false;
	}

	static async validateExp(exp) {
		if(typeof exp == "number" && exp >= 0)
			return true;
		return false;
	}

	static async validateAlive(alive) {
		if(typeof alive == "boolean")
			return true;
		return false;
	}

	static async validateBoost(boost) {
		if(typeof boost == "number" && boost > 0 && boost <= 20)
			return true;
		return false;
	}

	static async validateGoldPlated(goldPlated) {
		if(typeof goldPlated == "boolean")
			return true;
		return false;
	}

	static async validateExtras(extras) {
		if(typeof extras == "string")
			return true;
		return false;
	}

	static async validateIsSelling(isSelling) {
		if(typeof isSelling == "boolean")
			return true;
		return false;
	}
	
};


