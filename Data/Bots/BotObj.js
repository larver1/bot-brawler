const ErrorHandler = require("../../Helpers/ErrorHandler.js");
const fs = require('fs');
const consola = require("consola");
const bots = JSON.parse(fs.readFileSync('./Data/Bots/botData.json'));
const CPM = JSON.parse(fs.readFileSync('./Data/Bots/CPM.json'));
const cardData = JSON.parse(fs.readFileSync('./Data/Cards/cardData.json'));


module.exports = class BotObj {
    constructor(interaction, botObj) {

        //If incorrect arguments were given
        if(!botObj) {
            let err = new Error(`Invalid arguments (${botObj}) passed to botObj.constructor()`);
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
        this.ability = this.obj.ability;
        this.powerBoost = this.botObj.powerBoost;
        this.lifespanBoost = this.botObj.lifespanBoost;
        this.viralBoost = this.botObj.viralBoost;
        this.firewallBoost = this.botObj.firewallBoost;
        this.totalBoost = this.powerBoost + this.lifespanBoost + this.viralBoost + this.firewallBoost;
        this.battling = false;
        
        //Calculated stats
        this.level = this.findLevel();
        this.multiplier = CPM[this.level];
        this.power = Math.ceil((this.basePower + this.powerBoost) * this.multiplier);
        this.lifespan = Math.ceil((this.baseLifespan + this.lifespanBoost) * this.multiplier);
        this.viral = Math.ceil((this.baseViral + this.viralBoost) * this.multiplier);
        this.firewall = Math.ceil((this.baseFirewall + this.firewallBoost) * this.multiplier);
        this.stats = this.power + this.lifespan + this.viral + this.firewall;

        this.investmentPoints = Math.ceil(this.stats / 2);
        this.battleStats = {
            power: this.power,
            lifespan: this.lifespan,
            viral: this.viral,
            firewall: this.firewall
        }

        this.totalBattleStats = this.battleStats.power + this.battleStats.lifespan + this.battleStats.viral + this.battleStats.firewall;

        //Appearance
        this.goldPlated = this.botObj.goldPlated;
        this.image = this.findImage(this.goldPlated, this.obj);

    }

    calcAdvantage(stat1, stat2) {
        return stat1 - stat2;
    }

    getBattleText(){
        switch(this.item) {
            case "power":
                if(this.ability == "Overclocked")
                    return "assumes a Power Strategy and gets extra Power due to its ability!";
                return "assumes a Power Strategy!";
            case "lifespan":
                return "assumes a Lifespan Strategy!"
            case "viral":
                return "assumes a Viral Strategy!";
            case "firewall":
                return "assumes a Firewall Strategy!";
            default:
                return "assumes a Balanced Strategy!";
        }
    }

    getStatTotal(){
        return this.battleStats.power + this.battleStats.lifespan + this.battleStats.viral + this.battleStats.lifespan;
    }

    calcDamage(yourBot, otherBot, type) {
        if(type == "power") {
            return yourBot.battleStats.power * (100 / (100 + (otherBot.battleStats.lifespan * 2)));
        } else if(type == "viral") {
            return yourBot.battleStats.viral * (100 / (100 + (otherBot.battleStats.firewall * 2)));
        }
    }

    battle(opponent) {

        if(this.ability == "Factory Reset")
            opponent.item = "balanced";
        if(opponent.ability == "Factory Reset")
            this.item = "balanced";

        opponent.investStats();
        this.investStats();

        let total = this.battleStats.power + this.battleStats.lifespan + this.battleStats.viral + this.battleStats.firewall;
        let opponentTotal = opponent.battleStats.power + opponent.battleStats.lifespan + opponent.battleStats.viral + opponent.battleStats.firewall;

        let yourPowerAdvantage = this.calcAdvantage(this.battleStats.power, opponent.battleStats.lifespan);
        let yourViralAdvantage = this.calcAdvantage(this.battleStats.viral, opponent.battleStats.firewall);
        let opponentPowerAdvantage = this.calcAdvantage(opponent.battleStats.power, this.battleStats.lifespan);
        let opponentViralAdvantage = this.calcAdvantage(opponent.battleStats.viral, this.battleStats.firewall);

        let yourMsg = ``;
        let opponentMsg = ``;

        // Change odds if you or opponent get power advantage
        if(yourPowerAdvantage > opponentPowerAdvantage) {
            if(yourPowerAdvantage > 0) {
                if(opponent.ability != "30FA") {
                    if(this.ability == "Super Manipulation") {
                        yourMsg += `${this.name}'s ability destroys ${opponent.name}'s Lifespan!\n`;
                        yourPowerAdvantage = Math.ceil(yourPowerAdvantage * 1.5);
                    } else {
                        yourMsg += `${this.name} has a Power advantage over ${opponent.name}'s Lifespan!\n`;
                    }
                    total += yourPowerAdvantage;
                } else {
                    yourMsg += `${this.name}'s Power advantage was blocked by ${opponent.name}'s ability!\n`;
                }
            }
        } else if(opponentPowerAdvantage > yourPowerAdvantage) {
            if(opponentPowerAdvantage > 0) {
                if(this.ability != "30FA") {
                    if(opponent.ability == "Super Manipulation") {
                        opponentMsg += `${opponent.name}'s ability destroys ${this.name}'s Lifespan!`;
                        opponentPowerAdvantage = Math.ceil(opponentPowerAdvantage * 1.5);
                    } else {
                        opponentMsg += `${opponent.name} has a Power advantage over ${this.name}'s Lifespan!\n`;
                    }
                    opponentTotal += opponentPowerAdvantage;
                } else {
                    opponentMsg += `${opponent.name}'s Power advantage was blocked by ${this.name}'s ability!\n`;
                }
            }
        }

        // Change odds if you or opponent get viral advantage
        if(yourViralAdvantage > opponentViralAdvantage) {
            if(yourViralAdvantage > 0) {
                if(opponent.ability != "I'm not even a bot") {
                    if(this.ability == "Super Intrusion") {
                        yourMsg += `${this.name} destroys ${opponent.name}'s Firewall!`;
                        yourViralAdvantage = Math.ceil(yourViralAdvantage * 1.5);
                    } else {
                        yourMsg += `${this.name} has a Viral advantage over ${opponent.name}'s Firewall!\n`;  
                    }
                    total += yourViralAdvantage;  
                } else {
                    yourMsg += `${this.name}'s Viral Advantage was blocked by ${opponent.name}'s ability!\n`;    
                }
            }
        } else if(opponentViralAdvantage > yourViralAdvantage) {
            if(opponentViralAdvantage > 0) {
                if(this.ability != "I'm not even a bot") {
                    if(opponent.ability == "Super Intrusion") {
                        opponentMsg += `${opponent.name}'s ability destroys ${this.name}'s Firewall!\n`;
                        opponentViralAdvantage = Math.ceil(opponentViralAdvantage * 1.5);
                    } else {
                        opponentMsg += `${opponent.name} has a Viral advantage over ${this.name}'s Firewall!\n`;
                    }
                    opponentTotal += opponentViralAdvantage;
                } else {
                    opponentMsg += `${opponent.name}'s Viral advantage was blocked by ${this.name}'s ability!\n`;
                }
            }
        }

        if(!yourMsg)
            yourMsg = `${this.name} has no advantages over ${opponent.name}`;

        if(!opponentMsg)
            opponentMsg = `${opponent.name} has no advantages over ${this.name}`;

        let divisor = (total + opponentTotal) / 100;
        
        return { 
            yourPercent: total / divisor, 
            otherPercent: opponentTotal / divisor,
            winner: Math.random() * 100,
            yourMsg: yourMsg,
            opponentMsg: opponentMsg
        }

    }

    investStats(overrideChip) {

        let value = overrideChip || this.item;

        switch(value) {
            case "power":
                this.battleStats.power = (this.power + this.investmentPoints);
                this.battleStats.lifespan = this.lifespan;
                this.battleStats.viral = this.viral;
                this.battleStats.firewall = this.firewall;
                if(this.ability == "Overclocked") 
                    this.battleStats.power = Math.ceil(this.power + this.investmentPoints * 1.5);
                break;
            case "lifespan":
                this.battleStats.lifespan = Math.ceil(this.lifespan + this.investmentPoints * 1.75);
                this.battleStats.power = this.power;
                this.battleStats.viral = this.viral;
                this.battleStats.firewall = this.firewall;
                break;
            case "viral":
                this.battleStats.viral = (this.viral + this.investmentPoints);
                this.battleStats.lifespan = this.lifespan;
                this.battleStats.power = this.power;
                this.battleStats.firewall = this.firewall;
                break;
            case "firewall":
                this.battleStats.firewall = Math.ceil(this.firewall + this.investmentPoints * 1.75);
                this.battleStats.power = this.power;
                this.battleStats.lifespan = this.lifespan;
                this.battleStats.viral = this.viral;
                break;
            default:
                // No stat specified, then use balanced chip
                this.battleStats.power = this.power + Math.round(this.investmentPoints / 3);
                this.battleStats.lifespan = this.lifespan + Math.round(this.investmentPoints / 3);
                this.battleStats.viral = this.viral + Math.round(this.investmentPoints / 3);
                this.battleStats.firewall = this.firewall + Math.round(this.investmentPoints / 3);
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

    findColour() {
        for(let i = 0; i < cardData.length; i++) {
            if(!cardData[i + 1] || 
                (cardData[i + 1].exp > this.exp && cardData[i].exp <= this.exp)) {
                    return cardData[i];  
            }
        }
    }

}