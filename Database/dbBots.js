const { Users, Bots } = require('./dbObjects');
const ErrorHandler = require("../Helpers/ErrorHandler.js");
const BotObj = require("../Data/Bots/BotObj");
const Messenger = require("../Helpers/Messenger.js");
const db = require("../Database/dbAccess.js");
const dbAchievements = require("../Database/dbAchievements.js");

module.exports = class dbBots
{
    static async findBot(interaction, botID) {
		const bot = await Bots.findOne({ where: { bot_id: botID } });
		if(!bot) {
			let err = new Error(`Bot of ID ${botID} could not be found.`);
			return ErrorHandler.handle(interaction, err);
		}

        return bot;
    }

    static async findBotObjByName(interaction, botName, botModelNo) {
		const bot = await Bots.findOne({ where: { bot_type: botName, model_no: `M-${botModelNo}` } });
		if(!bot) {
			let err = new Error(`Bot of name '${botName} M-${botModelNo}' could not be found.`);
            await ErrorHandler.handle(interaction, err);
            return;
        }

        let botObj = await new BotObj(interaction, bot);
        return botObj;
    }

    static async findBotObj(interaction, botID) {
		const bot = await Bots.findOne({ where: { bot_id: botID } });
		if(!bot) {
			let err = new Error(`Bot of ID ${botID} could not be found.`);
			return ErrorHandler.handle(interaction, err);
		}

        let botObj = await new BotObj(interaction, bot);
		return botObj;
    }

    static async addBoost(interaction, botID, type, toAdd) {
		const bot = await this.findBot(interaction, botID);

        if(!bot) {
            let err = new Error(`Invalid botID '${botID}' passed to dbBots.addBoost().`);
            await ErrorHandler.handle(interaction, err);
            return false;
        }   

        if(!["power", "lifespan", "viral", "firewall"].includes(type)) {
            let err = new Error(`Invalid type '${type}' passed to dbBots.addBoost().`);
            await ErrorHandler.handle(interaction, err);
            return false;
        }

        if(typeof toAdd != "number" || toAdd < 0) {
            let err = new Error(`Invalid Power '${toAdd}' passed to dbBots.addBoost().`);
            await ErrorHandler.handle(interaction, err);
            return false;
        }    

        switch(type) {
            case "power":   
                bot.powerBoost += toAdd;
                await bot.save();
                break;
            case "lifespan":
                bot.lifespanBoost += toAdd;
                await bot.save();
                break;
            case "viral":
                bot.viralBoost += toAdd;
                await bot.save();
                break;
            case "firewall":
                bot.firewallBoost += toAdd;
                await bot.save();
                break;
            default:
                break;
        }

        return true;

	}

	static async addExp(interaction, botID, toAdd) {
		const bot = await this.findBot(interaction, botID);
        const oldObj = await this.findBotObj(interaction, botID);

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
 
        // Check if levelled up and delete requests
        const newObj = await this.findBotObj(interaction, botID);
        if(newObj.findLevel() > oldObj.findLevel()) {
            await this.cancelRequests(interaction, botID);
        
            // Check for achievement progress
            let newColour = newObj.findColour();
            const user = await dbAchievements.findUsername(interaction, newObj.owner_username);
            if(!user)
                return;

            // Find achievement that applies
            let achievementIndex = 0;
            switch(newColour.name) {
                case "TESTING:3":
                case "TESTING:2":
                case "TESTING:1":
                    achievementIndex = 1;
                    break;
                case "ALPHA:3":
                case "ALPHA:2":
                case "ALPHA:1":
                    achievementIndex = 2;
                    break;
                case "BETA:3":
                case "BETA:2":
                case "BETA:1":
                    achievementIndex = 3;
                    break;
                case "COMPLETE:3":
                case "COMPLETE:2":
                case "COMPLETE:1":
                    achievementIndex = 4;
                    break;            
                default:
                    return true;
            }

            // Update achievement data
            if(!await dbAchievements.editAchievement(interaction, user.username, "Conqueror", 1, achievementIndex));
                return true;
        }

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
            let err = new Error(`Invalid EXP '${toRemove}' passed to dbBots.removeExp().`);
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

    static async changeOwner(interaction, botID, newName, market) {
		const bot = await this.findBot(interaction, botID);
        const user = await Users.findOne({ where: { username: newName } }) ;

        if(!bot || (!user && !market)) {
            let err = new Error(`Invalid values '${botID}, ${newName}' passed to dbBots.changeOwner().`);
            await ErrorHandler.handle(interaction, err);
            return false;
        }   

        if((typeof newName != "string" || newName.length <= 0) && !market) {
            let err = new Error(`Invalid newName '${newName}' passed to dbBots.changeOwner().`);
            await ErrorHandler.handle(interaction, err);
            return false;
        }    

        if(bot.owner_username != "market")
            await this.cancelRequests(interaction, botID);

        // Apply achievements
        if(!market) {
            await dbAchievements.editAchievement(interaction, user.username, "Collector", bot.bot_type);
            if(bot.goldPlated)
                await dbAchievements.editAchievement(interaction, user.username, "Collector", bot.bot_type);
            if(parseInt(bot.model_no.slice(2, bot.model_no.length)) <= 100) 
                await dbAchievements.editAchievement(interaction, user.username, "Antique Collector", bot.bot_type);    
        }

        bot.owner_username = newName || "market";
        
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

        // If bot is dead then its requests are no longer valid
        await this.cancelRequests(interaction, botID);

        bot.alive = false;
        await bot.save();

        return true;

	}

    static async revive(interaction, botID) {
		const bot = await this.findBot(interaction, botID);

        if(!bot) {
            let err = new Error(`Invalid botID '${botID}' passed to dbBots.addExp().`);
            await ErrorHandler.handle(interaction, err);
            return false;
        }   

        if(bot.alive) {
            let err = new Error(`Can't revive a destroyed bot in dbBots.revive().`);
            await ErrorHandler.handle(interaction, err);
            return false;
        }    

        bot.alive = true;
        await bot.save();

        return true;

	}

    static async changeChip(interaction, botID, chip) {
		const bot = await this.findBot(interaction, botID);

        if(!bot) {
            let err = new Error(`Invalid botID '${botID}' passed to dbBots.changeChip().`);
            await ErrorHandler.handle(interaction, err);
            return false;
        }   

        if(!["power", "lifespan", "viral", "firewall", "balanced"].includes(chip)) {
            let err = new Error(`Invalid chip ${chip} passed to dbBots.changeChip().`);
            await ErrorHandler.handle(interaction, err);
            return false;
        }     

        bot.item = chip;
        await bot.save();

        return true;

	}

    // Remove all requests the bot is involved in
    static async cancelRequests(interaction, botID) {
		const bot = await this.findBot(interaction, botID);
        if(!bot) {
            let err = new Error(`Invalid botID '${botID}' passed to dbBots.cancelRequests().`);
            await ErrorHandler.handle(interaction, err);
        }

        const user = await db.findUsername(interaction, bot.owner_username);
        if(!user) {
            let err = new Error(`Invalid username '${bot.owner_username}' passed to dbBots.cancelRequests().`);
            await ErrorHandler.handle(interaction, err);
        }

        // Find all requests that involves the bot and delete them
        let inbox = await Messenger.readAllMessages(interaction, user, null, null, true, true);
        if(!inbox)
            return
        
        for(const message of inbox) {
            if(message.message_content.includes(botID)) {
                await user.removeMessage(message);
            }
        }

    }

    // Set some lab challenges for the user
    static async setChallenge(interaction, username, professorName) {
        const user = await db.findUsername(interaction, username);
        const professor = await db.findUsername(interaction, professorName);

        if(!user || !professor) {
            let err = new Error(`Invalid username '${username}' or '${professorName}' passed to dbBots.setChallenges().`);
            await ErrorHandler.handle(interaction, err);
        }

        const userBots = await user.getBots();
        const professorBots = await professor.getBots();

        if(!userBots || !professorBots) {
            let err = new Error(`Usernames '${username}' or '${professorName}' do not own any bots in dbBots.setChallenges().`);
            await ErrorHandler.handle(interaction, err);
        }

        // Find average EXP of each bot
        let totalEXP, averageEXP, maxEXP = 0;
        for(const bot of userBots) {
            totalEXP += bot.exp;
            if(bot.exp > maxEXP)
                maxEXP = bot.exp;
        }
        
        averageEXP = totalEXP / userBots.length;

        if(!maxEXP)
            maxEXP = 100;

        // Choose 10 challenge bots
        let challengeBots = [];
        for(const bot of professorBots) {
            if(bot.exp <= maxEXP)
                challengeBots.push(bot.bot_id);
            if(challengeBots.length >= 5)
                break;
        }

        challengeBots = `${challengeBots.join("|")}|`;
        
        return challengeBots;
    }

    static async addLogs(interaction, botID, toAdd) {
		const bot = await this.findBot(interaction, botID);

        if(!bot) {
            let err = new Error(`Invalid botID '${botID}' passed to dbBots.addLogs().`);
            await ErrorHandler.handle(interaction, err);
            return false;
        }   

        if(typeof toAdd != "string" || toAdd.length <= 0) {
            let err = new Error(`Invalid logs '${toAdd}' passed to dbBots.addLogs().`);
            await ErrorHandler.handle(interaction, err);
            return false;
        }    

        var dateTime = new Date();
        var dateString =
            dateTime.getFullYear() + "/" +
            ("0" + (dateTime.getMonth()+1)).slice(-2) + "/" +
            ("0" + dateTime.getDate()).slice(-2) + " " +
            ("0" + dateTime.getHours()).slice(-2) + ":" +
            ("0" + dateTime.getMinutes()).slice(-2) + ":" +
            ("0" + dateTime.getSeconds()).slice(-2);

        bot.logs += `[${dateString}] ${bot.bot_type} ${bot.model_no} ${toAdd}\n`;
        await bot.save();

        return true;

	}
	
};


