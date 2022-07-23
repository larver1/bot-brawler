const { Users, BotStats } = require('./dbObjects');
const fs = require('fs');
const consola = require("consola");
const sampleEmbed = require("../Helpers/sampleEmbed.js");
const ErrorHandler = require("../Helpers/ErrorHandler.js");

module.exports = class dbBotStats
{
    static async findBot(interaction, botName) {
		const user = await BotStats.findOne({ where: { bot_type: botName } });
		if(!user) {
			let err = new Error(`Bot of name ${botName} could not be found.`);
			return ErrorHandler.handle(interaction, err);
		}

		return user;
    }

    static async getData(interaction, botName, type) {
		const bot = await this.findBot(interaction, botName);

        if(!bot) {
            let err = new Error(`Invalid botName '${botName}' passed to dbBotStats.getData().`);
            await ErrorHandler.handle(interaction, err);
            return false;
        }  

        switch(type) {
            case "wins":
                return bot.wins;
            case "losses":
                return bot.losses;
            case "exists":
                return bot.num_exists;
            case "alive":
                return bot.num_alive;
            default:
                let err = new Error(`Invalid type '${type}' called on dbBotStats.getData()`);
				await ErrorHandler.handle(interaction, err);
				break;
        }
    }

	static async addWin(interaction, botName) {
		const bot = await this.findBot(interaction, botName);

        if(!bot) {
            let err = new Error(`Invalid botName '${botName}' passed to dbBotStats.addWin().`);
            await ErrorHandler.handle(interaction, err);
            return false;
        }     

        bot.wins += 1;
        await bot.save();

        return true;

	}

    static async addLoss(interaction, botName) {
		const bot = await this.findBot(interaction, botName);

        if(!bot) {
            let err = new Error(`Invalid botName '${botName}' passed to dbBotStats.addLoss().`);
            await ErrorHandler.handle(interaction, err);
            return false;
        }     

        bot.losses += 1;
        await bot.save();

        return true;

	}

    static async addExists(interaction, botName) {
		const bot = await this.findBot(interaction, botName);

        if(!bot) {
            let err = new Error(`Invalid botName '${botName}' passed to dbBotStats.addExists().`);
            await ErrorHandler.handle(interaction, err);
            return false;
        }     

        bot.num_exists += 1;
        bot.num_alive += 1;
        await bot.save();

        return bot.num_exists;

	}

    static async addAlive(interaction, botName) {
		const bot = await this.findBot(interaction, botName);

        if(!bot) {
            let err = new Error(`Invalid botName '${botName}' passed to dbBotStats.addAlive().`);
            await ErrorHandler.handle(interaction, err);
            return false;
        }     

        bot.num_alive += 1;
        await bot.save();

        return true;

	}

    static async removeAlive(interaction, botName) {
		const bot = await this.findBot(interaction, botName);

        if(!bot) {
            let err = new Error(`Invalid botName '${botName}' passed to dbBotStats.removeAlive().`);
            await ErrorHandler.handle(interaction, err);
            return false;
        }     

        bot.num_alive -= 1;
        await bot.save();

        return true;

	}
	
};


