const ErrorHandler = require("./ErrorHandler.js");
const fs = require('fs');
const botData = JSON.parse(fs.readFileSync('./Data/Bots/botData.json'));
const cardData = JSON.parse(fs.readFileSync('./Data/Cards/cardData.json'));
const Canvas = require('canvas');
const { MessageAttachment } = require('discord.js');
Canvas.registerFont('./Data/Cards/Assets/TravelingTypewriter.ttf', { family: 'Typewriter' });
Canvas.registerFont('./Data/Cards/Assets/Code.ttf', { family: 'Code' });
const assets = {}

async function loadAssets(){
    // Load card assets
    assets["template"] = await Canvas.loadImage("./Data/Cards/Assets/CardTemplate.png");
    assets["shine"] = await Canvas.loadImage("./Data/Cards/Assets/Shine.png");
    assets["deadBot"] = await Canvas.loadImage("./Data/Cards/Assets/DeadBot.png");

    // Load all card colours
    for(const card of cardData) {
        assets[card.colour] = await Canvas.loadImage(`./Data/Cards/Assets/${card.colour}Card.png`);
    }

    // Load all bot images
    for(const bot of botData) {
        assets[bot.name] = await Canvas.loadImage(`./Data/Bots/Assets/${bot.name}.png`);
        assets[bot.name + "Gold"] = await Canvas.loadImage(`./Data/Bots/Assets/${bot.name}Gold.png`);
    }

}

loadAssets();


module.exports = class Card {
    constructor(interaction, botObj) {
        this.scale = 0.25
        this.width = 1280;
        this.height = 2048;
        this.botObj = botObj;
        this.attachment;
        this.progressPercentage = 0;
        this.interaction = interaction;
        return;
    }

    async createCard(){

        //Clear canvas
        this.canvas = Canvas.createCanvas(this.width * this.scale, this.height * this.scale);
        this.ctx = this.canvas.getContext('2d');

        //Apply card background
        let chosen = await this.getCardLevel();
        this.success = true;
        
        //Scale according to given values
        this.ctx.scale(this.scale, this.scale);

        await this.addColour(chosen.colour);

        //Apply progress bar
        await this.addProgressBar();

        //Apply card template overlay
        await this.addCardTemplate();

        //Draw text on card
        await this.addTextElements(chosen.name);

        //90% scale on the image
        await this.addImage();

        //Dead icon
        if(!this.botObj.alive)
            await this.addDead();

        //Gloss on card
        await this.addShine();

        if(!this.success)
            return false;

        this.attachment = new MessageAttachment(this.canvas.toBuffer(), 'card.png');
    
        return true;
    
    }

    async addShine(){
        this.ctx.drawImage(assets["shine"], (this.width / 2) - (assets["shine"].width / 2) - 68, 0, this.width * 0.75, this.height * 0.25);
    }

    async addImage(){

        //No image found
        if(!this.botObj || !this.botObj.image) {
            let err = new Error(`No bot image found on Card.addImage()`);
            this.success = false;
            return ErrorHandler.handle(this.interaction, err);
        }

        let img = assets[`${this.botObj.bot_type}${this.botObj.goldPlated ? 'Gold' : ''}`];
        this.ctx.drawImage(img, (this.width / 2) - (4 * img.width / 2) + 50, 180, 4 * Math.round(img.width * 0.9), 4 * Math.round(img.height * 0.9));
    }

    async addTextElements(name){
        //Set appropriate font and colour
        this.ctx.fillStyle = '#ffffff';

        //No image found
        if(!this.botObj || isNaN(this.botObj.power) || isNaN(this.botObj.lifespan) || isNaN(this.botObj.viral) || isNaN(this.botObj.firewall)) {
            let err = new Error(`No bot stats on Card.addTextElements()`);
            this.success = false;
            return ErrorHandler.handle(this.interaction, err);
        }

        //Name and card type
        this.setFont(100);
        this.ctx.fillText(`${this.botObj.bot_type}`.toUpperCase(), this.width / 2 - this.ctx.measureText(`${this.botObj.bot_type}`.toUpperCase()).width / 2, 170);
        
        this.setFont(70);
        this.ctx.fillText(`${name} ${this.botObj.model_no}`, this.width / 2 - this.ctx.measureText(`${name} ${this.botObj.model_no}`).width / 2 + 10, 1180);

        //If the bot has a chip attached
        this.ctx.fillStyle = "#ff0000";

        //Stats
        this.setFont(this.checkFont(this.botObj.battleStats.power));
        await this.displayStat("power", `${this.botObj.battleStats.power}`, 635 - this.ctx.measureText(`${this.formatStat(this.botObj.battleStats.power)}`).width - 20, 1460);
        this.setFont(this.checkFont(this.botObj.battleStats.lifespan));
        await this.displayStat("lifespan", `${this.botObj.battleStats.lifespan}`, 680 + 20, 1460);
        this.setFont(this.checkFont(this.botObj.battleStats.viral));
        await this.displayStat("viral", `${this.botObj.battleStats.viral}`, 635 - this.ctx.measureText(`${this.formatStat(this.botObj.battleStats.viral)}`).width - 20, 1710);
        this.setFont(this.checkFont(this.botObj.battleStats.firewall));
        await this.displayStat("firewall", `${this.botObj.battleStats.firewall}`, 680 + 20, 1710);

    }

    checkFont(value) {
        if(value < 1000 || (value >= 10000 && value < 100000))
            return 100;
        return 80;
    }

    formatStat(value) {
        if(value < 1000)
            return `${value}`;
        if(value < 10000)
            return `${(value / 1000).toFixed(1)}k`;
        if(value < 100000)
            return `${(value / 1000).toFixed(0)}k`;
        if(value < 10000000)
            return `${(value / 100000).toFixed(0)}m`;
    }

    async displayStat(statName, text, x, y) {

        if(!this.botObj.battling)
            this.ctx.fillStyle = "#ffffff";
        else if(statName == this.botObj.item)
            this.ctx.fillStyle = "#00ff00";
        else if(this.botObj.item == "balanced")
            this.ctx.fillStyle = "#8AFF8A";
        else
            this.ctx.fillStyle = "#ffffff";

        this.ctx.fillText(`${this.formatStat(text)}`, x, y);

    }

    async addCardTemplate(){
        this.ctx.drawImage(assets["template"], 0, 0, this.width, this.height); 
    }

    async addColour(colour){
        this.ctx.drawImage(assets[colour], 0, 0, this.width, this.height);
    }

    async addProgressBar(){
        //Background bar
        this.ctx.fillStyle = 'rgba(64,68,75,1)';
        this.ctx.fillRect(132, 1902, 1020, 50);

        //Foreground bar which varies in width depending on percentage
        this.ctx.fillStyle = 'rgba(88,101,242,1)';
        this.ctx.fillRect(132, 1902, Math.floor(1020 * (this.progressPercentage / 100)), 50);
    }

    async getCardLevel(){
        //No exp found
        if(!this.botObj || this.botObj.exp == null || !this.botObj.exp < 0 || typeof this.botObj.exp != "number") {
            let err = new Error(`No valid exp '${this.botObj.exp}' found on Card.getCardLevel()`);
            this.success = false;
            return ErrorHandler.handle(this.interaction, err);
        }

        //Find the correct card level
        for(let i = 0; i < cardData.length; i++) {
            if(!cardData[i + 1] || 
                (cardData[i + 1].exp > this.botObj.exp && cardData[i].exp <= this.botObj.exp)) {
                    if(cardData[i + 1]) {
                        let expRange = cardData[i + 1].exp - cardData[i].exp;
                        let progress = this.botObj.exp - cardData[i].exp;
                        this.progressPercentage = Math.floor((progress / expRange) * 100);
                    }
                    return cardData[i];  
                }
        }

    }

    async addDead(){

        //No image found
        if(!assets["deadBot"]) {
            let err = new Error(`No deadBot image found on Card.addDead()`);
            this.success = false;
            return ErrorHandler.handle(this.interaction, err);
        }

        this.ctx.globalAlpha = 0.4;
        this.ctx.drawImage(assets["deadBot"], (this.width / 2) - (4 * assets["deadBot"].width / 2), 120, 4 * assets["deadBot"].width, 4 * assets["deadBot"].width);
        this.ctx.globalAlpha = 1.0;
    }

    async setFont(size){
        //Uses specific font
        this.ctx.font = `${size}px "Code"`;
    }

    getCard(){
        return this.attachment;
    }

}