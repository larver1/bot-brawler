const { Market } = require('./dbObjects');
const ErrorHandler = require("../Helpers/ErrorHandler.js");
const db = require("./dbAccess.js");
const dbBots = require("./dbBots.js");

module.exports = class dbMarket {

    // Find all bots in the market with a given ID
    static async findBotByID(interaction, id) {

        let listing = await Market.findAll();
        for(let i = 0; i < listing.length; i++) {
            const botObj = await dbBots.findBotObj(interaction, listing[i].bot_id);
            
            // If it is not the level being searched for
            if(botObj.botObj.bot_id == id) {
                botObj.price = listing[i].selling_amount;
                botObj.seller_username = listing[i].seller_username;
                return botObj;
            }
        }

    }

    // Find all bots in the market from a user
    static async findBotsBySeller(interaction, username) {

        const user = await db.findUsername(interaction, username);
        if(!user)
            return;

        let bots = [];
        await Market.findAll().then(async function(listing) {
            for(let i = 0; i < listing.length; i++) {
                const botObj = await dbBots.findBotObj(interaction, listing[i].bot_id);
                
                // If it is not the level being searched for
                if(listing[i].seller_username != username)
                    continue;

                botObj.price = listing[i].selling_amount;
                botObj.seller_username = listing[i].seller_username;

                bots.push(botObj);

            }       

        });

        return bots;
    }

    // Find all bots in the market of a given level
    static async findBotsByLevel(interaction, level) {

        let bots = [];
        await Market.findAll().then(async function(listing) {
            for(let i = 0; i < listing.length; i++) {
                const botObj = await dbBots.findBotObj(interaction, listing[i].bot_id);
                
                // If it is not the level being searched for
                if(botObj.findLevel() != level)
                    continue;
                    
                botObj.price = listing[i].selling_amount;
                botObj.seller_username = listing[i].seller_username;
                bots.push(botObj);

            }       

        });

        return bots;
    }

    // Add a bot to the market
    static async addBotToMarket(interaction, username, botID, price) {
        const user = await db.findUsername(interaction, username);
        if(!user)
            return;

        const botObj = await dbBots.findBotObj(interaction, botID);
        if(!botObj)
            return;

        if(botObj.owner_username != user.username) {
            let err = new Error(`Bot ${botID} does not belong to ${username}.`);
            await ErrorHandler.handle(interaction, err);
            return;
        }

        if(!price) {
            let err = new Error(`Invalid price ${price} passed to dbMarket.addBotToMarket().`);
            await ErrorHandler.handle(interaction, err);
            return;
        }

        await user.addToMarket(botObj, price);
        return true;

    }

    static async removeBotFromMarket(interaction, username, botID) {
        const user = await db.findUsername(interaction, username);
        if(!user)
            return;

        const botObj = await this.findBotByID(interaction, botID);
        console.log(botObj);
        
        if(!botObj) {
            let err = new Error(`Bot ${botID} is not in the market.`);
            await ErrorHandler.handle(interaction, err);
            return;
        }

        console.log(botObj);

        await user.removeFromMarket(botObj);
        return true;

    }
	
};


