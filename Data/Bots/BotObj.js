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
        this.powerBoost = 0;
        this.lifespanBoost = 0;
        this.viralBoost = 0;
        this.firewallBoost = 0;
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
        
        this.investStats();
        opponent.investStats();

        console.log(`YOUR BOT`);
        console.log(this.battleStats);
        console.log(`OTHER BOT`);
        console.log(opponent.battleStats);

        let total = this.battleStats.power + this.battleStats.lifespan + this.battleStats.viral + this.battleStats.firewall;
        let opponentTotal = opponent.battleStats.power + opponent.battleStats.lifespan + opponent.battleStats.viral + opponent.battleStats.firewall;

        let yourPowerAdvantage = this.calcAdvantage(this.battleStats.power, opponent.battleStats.lifespan);
        let yourViralAdvantage = this.calcAdvantage(this.battleStats.viral, opponent.battleStats.firewall);
        let opponentPowerAdvantage = this.calcAdvantage(opponent.battleStats.power, this.battleStats.lifespan);
        let opponentViralAdvantage = this.calcAdvantage(opponent.battleStats.viral, this.battleStats.firewall);

        console.log(`${this.name} Power ${this.battleStats.power} vs ${opponent.name} Lifespan ${opponent.battleStats.lifespan} gives advantage ${yourPowerAdvantage}`);
        console.log(`${this.name} Viral ${this.battleStats.viral} vs ${opponent.name} Firewall ${opponent.battleStats.firewall} gives advantage ${yourViralAdvantage}`);

        console.log(`${opponent.name} Power ${opponent.battleStats.power} vs ${this.name} Lifespan ${this.battleStats.lifespan} gives advantage ${opponentPowerAdvantage}`);
        console.log(`${opponent.name} Viral ${opponent.battleStats.viral} vs ${this.name} Firewall ${this.battleStats.firewall} gives advantage ${opponentViralAdvantage}`);

        let yourMsg = ``;
        let opponentMsg = ``;

        // Change odds if you or opponent get power advantage
        if(yourPowerAdvantage > opponentPowerAdvantage) {
            if(yourPowerAdvantage > 0) {
                total += yourPowerAdvantage;
                console.log(`${yourPowerAdvantage} gets added to ${this.name}'s total.`);
                yourMsg += `${this.name} has a Power advantage over ${opponent.name}'s Lifespan!\n`;
            }
        } else if(opponentPowerAdvantage > yourPowerAdvantage) {
            if(opponentPowerAdvantage > 0) {
                opponentTotal += opponentPowerAdvantage;
                console.log(`${opponentPowerAdvantage} gets added to ${opponent.name}'s total.`);
                opponentMsg += `${opponent.name} has a Power advantage over ${this.name}'s Lifespan!\n`;
            }
        }

        // Change odds if you or opponent get viral advantage
        if(yourViralAdvantage > opponentViralAdvantage) {
            if(yourViralAdvantage > 0) {
                total += yourViralAdvantage;
                console.log(`${yourViralAdvantage} gets added to ${this.name}'s total.`);
                yourMsg += `${this.name} has a Viral advantage over ${opponent.name}'s Firewall!\n`;
            }
        } else if(opponentViralAdvantage > yourViralAdvantage) {
            if(opponentViralAdvantage > 0) {
                opponentTotal += opponentViralAdvantage;
                console.log(`${opponentViralAdvantage} gets added to ${opponent.name}'s total.`);
                opponentMsg += `${opponent.name} has a Viral advantage over ${this.name}'s Firewall!\n`;
            }
        }

        if(!yourMsg)
            yourMsg = `${this.name} has no advantages over ${opponent.name}`;

        if(!opponentMsg)
            opponentMsg = `${opponent.name} has no advantages over ${this.name}`;

        let divisor = (total + opponentTotal) / 100;

        console.log("\n✅ your percent " + total + " / " + divisor + " = " + (total / divisor));
        console.log("✅ opponent percent " + opponentTotal + " / " + divisor + " = " +  (opponentTotal / divisor));

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
                break;
            case "lifespan":
                this.battleStats.lifespan = (this.lifespan + this.investmentPoints);
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
                this.battleStats.firewall = (this.firewall + this.investmentPoints);
                this.battleStats.power = this.power;
                this.battleStats.lifespan = this.lifespan;
                this.battleStats.viral = this.viral;
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