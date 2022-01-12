const ErrorHandler = require("../../Helpers/ErrorHandler.js");
const fs = require('fs');
const bots = JSON.parse(fs.readFileSync('./Data/Bots/botData.json'));
const CPM = JSON.parse(fs.readFileSync('./Data/Bots/CPM.json'));


module.exports = class BotObj {
    constructor(interaction, botObj) {

        //If incorrect arguments were given
        if(!interaction || !interaction.user || !botObj) {
            let err = new Error(`Invalid arguments (${interaction},${botObj}) passed to botObj.constructor()`);
			return ErrorHandler.error(interaction, err);
        }

        this.botObj = botObj;
        this.obj = this.findJSON(botObj.bot_type);

        if(!this.obj) {
            let err = new Error(`Invalid bot name (${botObj.bot_type}) passed to botObj.constructor()`);
			return ErrorHandler.error(interaction, err);
        }

        //Misc info
        this.bot_type = this.obj.name;
        this.owner_username = this.botObj.owner_username;
        this.owner_original_username = this.botObj.owner_original_username;
        this.exp = this.botObj.exp;
        this.alive = this.botObj.alive;
        this.extras = this.botObj.extras;
        this.isSelling = this.botObj.isSelling;
        
        //Combat stats
        this.basePower = this.obj.basePower;
        this.baseLifespan = this.obj.baseLifespan;
        this.baseViral = this.obj.baseViral;
        this.baseFirewall = this.obj.baseFirewall;
        this.powerBoost = this.botObj.powerBoost;
        this.lifespanBoost = this.botObj.lifespanBoost;
        this.viralBoost = this.botObj.viralBoost;
        this.firewallBoost = this.botObj.firewallBoost;
        
        //Calculated stats
        this.level = this.findLevel(this.exp);
        console.log(CPM);
        this.multiplier = CPM[this.level];
        this.power = Math.ceil((this.basePower + this.powerBoost) * this.multiplier);
        this.lifespan = Math.ceil((this.baseLifespan + this.lifespanBoost) * this.multiplier);
        this.viral = Math.ceil((this.baseViral + this.viralBoost) * this.multiplier);
        this.firewall = Math.ceil((this.baseFirewall + this.firewallBoost) * this.multiplier);
        this.investmentPoints = this.power + this.lifespan + this.viral + this.firewall;

        //Appearance
        this.goldPlated = this.botObj.goldPlated;
        this.image = this.findImage(this.goldPlated, this.obj);

    }

    //Find JSON object 
    findJSON(bot_type){
        for(let i = 0; i < bots.length; i++) 
            if(bots[i].name.toLowerCase() == bot_type.toLowerCase())
                return bots[i];
        return;

    }

    //Find image to display
    findImage(goldPlated, obj) {
        if(goldPlated)
            return obj.imageGoldPlated;
        else
            return obj.image;
    }

    findLevel(bot_exp) {
        return Math.floor(bot_exp / 10);
    }

}