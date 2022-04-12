const ErrorHandler = require("../../Helpers/ErrorHandler.js");
const fs = require('fs');
const consola = require("consola");
const bots = JSON.parse(fs.readFileSync('./Data/Bots/botData.json'));
const CPM = JSON.parse(fs.readFileSync('./Data/Bots/CPM.json'));
const cardData = JSON.parse(fs.readFileSync('./Data/Cards/cardData.json'));


module.exports = class BotObj {
    constructor(interaction, botObj) {

        //If incorrect arguments were given
        if(!interaction || !interaction.user || !botObj) {
            let err = new Error(`Invalid arguments (${interaction},${botObj}) passed to botObj.constructor()`);
			return ErrorHandler.handle(interaction, err);
        }

        this.botObj = botObj;
        this.obj = this.findJSON(botObj.bot_type);

        if(!this.obj) {
            let err = new Error(`Invalid bot name (${botObj.bot_type}) passed to botObj.constructor()`);
			return ErrorHandler.handle(interaction, err);
        }

        //Misc info
        this.bot_type = this.obj.name;
        this.model_no = this.botObj.model_no;
        this.owner_username = this.botObj.owner_username;
        this.owner_original_username = this.botObj.owner_original_username;
        this.exp = this.botObj.exp || 0;
        this.alive = this.botObj.alive;
        this.extras = this.botObj.extras;
        this.isSelling = this.botObj.isSelling;
        this.item = this.botObj.item;
        this.name = `${this.obj.name} ${this.model_no}`;
        if(!this.item) this.item = "balanced";
        
        //Combat stats
        this.basePower = this.obj.basePower;
        this.baseLifespan = this.obj.baseLifespan;
        this.baseViral = this.obj.baseViral;
        this.baseFirewall = this.obj.baseFirewall;
        this.powerBoost = this.botObj.powerBoost;
        this.lifespanBoost = this.botObj.lifespanBoost;
        this.viralBoost = this.botObj.viralBoost;
        this.firewallBoost = this.botObj.firewallBoost;
        this.battling = false;
        
        //Calculated stats
        this.level = this.findLevel();
        this.multiplier = CPM[this.level];
        this.power = Math.ceil((this.basePower + this.powerBoost) * this.multiplier);
        this.lifespan = Math.ceil((this.baseLifespan + this.lifespanBoost) * this.multiplier);
        this.viral = Math.ceil((this.baseViral + this.viralBoost) * this.multiplier);
        this.firewall = Math.ceil((this.baseFirewall + this.firewallBoost) * this.multiplier);
        this.stats = this.power + this.lifespan + this.viral + this.firewall;

        this.investmentPoints = this.power + this.lifespan + this.viral + this.firewall;
        this.battleStats = {
            power: this.power,
            lifespan: this.lifespan,
            viral: this.viral,
            firewall: this.firewall
        }

        //Appearance
        this.goldPlated = this.botObj.goldPlated;
        this.image = this.findImage(this.goldPlated, this.obj);

    }

    calcAdvantage(stat1, stat2) {
        return stat1 / stat2;
    }

    getBattleText(){
        switch(this.item) {
            case "power":
                return "assumes an aggressive stance!";
            case "lifespan":
                return "assumes a reserved stance!"
            case "viral":
                return "assumes a provoking stance!";
            case "firewall":
                return "assumes a cautious stance!";
            default:
                return "assumes a well-rounded stance!";
        }
    }

    battle(opponent) {
        //Add extra stats to each pokemon
        this.investStats();
        opponent.investStats();

        let powerAdvantage = this.calcAdvantage(this.battleStats.power, opponent.battleStats.lifespan);
        let viralAdvantage = this.calcAdvantage(this.battleStats.viral, opponent.battleStats.firewall);
        
        let opponentPowerAdvantage = this.calcAdvantage(opponent.battleStats.power, this.battleStats.lifespan);
        let opponentViralAdvantagae = this.calcAdvantage(opponent.battleStats.viral, this.battleStats.firewall);

        let total = powerAdvantage + viralAdvantage;
        let opponentTotal = opponentPowerAdvantage + opponentViralAdvantagae;

        let divisor = (total + opponentTotal) / 100;

        return { 
            yourPercent: total / divisor, 
            otherPercent: opponentTotal / divisor,
            winner: Math.random() * 100
        }

    }

    investStats() {

        let value = this.item;

        switch(value) {
            case "power":
                this.battleStats.power = (this.power + this.investmentPoints);
                break;
            case "lifespan":
                this.battleStats.lifespan = (this.lifespan + this.investmentPoints);
                break;
            case "viral":
                this.battleStats.viral = (this.viral + this.investmentPoints);
                break;
            case "firewall":
                this.battleStats.firewall = (this.firewall + this.investmentPoints);
                break;
            default:
                //No stat specified, then use balanced chip
                this.battleStats.power = this.power + Math.round(this.investmentPoints / 4);
                this.battleStats.lifespan = this.lifespan + Math.round(this.investmentPoints / 4);
                this.battleStats.viral = this.viral + Math.round(this.investmentPoints / 4);
                this.battleStats.firewall = this.firewall + Math.round(this.investmentPoints / 4);
                break;
        }

        return true;

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

    findLevel() {
        for(let i = 0; i < cardData.length; i++) {
            if(!cardData[i + 1] || 
                (cardData[i + 1].exp > this.exp && cardData[i].exp <= this.exp)) {
                    this.levelName = cardData[i].name;
                    return i;  
            }
        }
    }

}