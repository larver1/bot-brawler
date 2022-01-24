const { Users, Bots } = require('./dbObjects');
const fs = require('fs');
const consola = require("consola");
const sampleEmbed = require("../Helpers/sampleEmbed.js");
const ErrorHandler = require("../Helpers/ErrorHandler.js");

module.exports = class dbBots
{
    static async findBot(interaction, botID) {
		const user = await Bots.findOne({ where: { bot_id: botID } });
		if(!user) {
			let err = new Error(`Bot of ID ${botID} could not be found.`);
			return ErrorHandler.handle(interaction, err);
		}

		return user;
    }

	static async addExp(interaction, botID, toAdd) {
		const bot = await this.findBot(interaction, botID);

        if(!bot) {
            let err = new Error(`Invalid botID '${botID}' passed to dbBots.addExp().`);
            await ErrorHandler.handle(interaction, err);
            return false;
        }   

        if(typeof toAdd != "number" || toAdd < 0) {
            let err = new Error(`Invalid EXP '${toAdd}' passed to dbBots.addExp().`);
            await ErrorHandler.handle(interaction, err);
            return false;
        }    


        bot.exp += toAdd;
        await bot.save();

        return true;

	}

    static async removeExp(interaction, botID, toRemove) {
		const bot = await this.findBot(interaction, botID);

        if(!bot) {
            let err = new Error(`Invalid botID '${botID}' passed to dbBots.removeExp().`);
            await ErrorHandler.handle(interaction, err);
            return false;
        }   

        if(typeof toRemove != "number" || toRemove < 0 || bot.exp - toRemove < 0) {
            let err = new Error(`Invalid EXP '${toAdd}' passed to dbBots.removeExp().`);
            await ErrorHandler.handle(interaction, err);
            return false;
        }    

        if(toRemove == 0) {
            await this.destroy(interaction, botID);
            return true;
        }

        bot.exp -= toRemove;
        await bot.save();

        return true;

	}

    static async changeOwner(interaction, botID, newName) {
		const bot = await this.findBot(interaction, botID);
        const user = await Users.findOne({ where: { username: newName } });

        if(!bot || !user) {
            let err = new Error(`Invalid values '${botID}, ${newName}' passed to dbBots.changeOwner().`);
            await ErrorHandler.handle(interaction, err);
            return false;
        }   

        if(typeof newName != "string" || newName.length <= 0) {
            let err = new Error(`Invalid newName '${newName}' passed to dbBots.changeOwner().`);
            await ErrorHandler.handle(interaction, err);
            return false;
        }    

        bot.owner_username = newName;
        await bot.save();

        return true;

	}

    static async destroy(interaction, botID) {
		const bot = await this.findBot(interaction, botID);

        if(!bot) {
            let err = new Error(`Invalid botID '${botID}' passed to dbBots.destroy().`);
            await ErrorHandler.handle(interaction, err);
            return false;
        }   

        if(bot.alive == false) {
            let err = new Error(`BOT ID passed ${botID} to dbBots.destroy() is already dead.`);
            await ErrorHandler.handle(interaction, err);
            return false;
        }    

        bot.alive = false;
        await bot.save();

        return true;

	}
	
};


