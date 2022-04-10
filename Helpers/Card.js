const ErrorHandler = require("./ErrorHandler.js");
const fs = require('fs');
const consola = require("consola");
const cardData = JSON.parse(fs.readFileSync('./Data/Cards/cardData.json'));
const CPM = JSON.parse(fs.readFileSync('./Data/Bots/CPM.json'));
const Canvas = require('canvas');
const { MessageAttachment } = require('discord.js');
Canvas.registerFont('./Data/Cards/Assets/TravelingTypewriter.ttf', { family: 'Typewriter' });
Canvas.registerFont('./Data/Cards/Assets/Code.ttf', { family: 'Code' });

module.exports = class Card {
    constructor(interaction, botObj) {
        this.scale = 0.25
        this.width = 1280;
        this.height = 2048;
        this.bgImage = "./Data/Cards/Assets/CardTemplate.png";
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

        if(!this.success)
            return false;

        this.attachment = new MessageAttachment(this.canvas.toBuffer(), 'card.png');
    
        return true;
    
    }

    async addImage(){

        //No image found
        if(!this.botObj || !this.botObj.image) {
            let err = new Error(`No bot image found on Card.addImage()`);
            this.success = false;
            return ErrorHandler.handle(this.interaction, err);
        }

        let img = await Canvas.loadImage(this.botObj.image);

        this.ctx.drawImage(img, (this.width / 2) - (img.width / 2) + 50, 180, Math.round(img.width * 0.9), Math.round(img.height * 0.9));
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
        this.setFont(100);

        //Stats
        await this.displayStat("power", `${this.botObj.battleStats.power}`, 635 - this.ctx.measureText(`${this.botObj.battleStats.power}`).width - 20, 1460);
        await this.displayStat("lifespan", `${this.botObj.battleStats.lifespan}`, 680 + 20, 1460);
        await this.displayStat("viral", `${this.botObj.battleStats.viral}`, 635 - this.ctx.measureText(`${this.botObj.battleStats.viral}`).width - 20, 1710);
        await this.displayStat("firewall", `${this.botObj.battleStats.firewall}`, 680 + 20, 1710);

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

        this.ctx.fillText(`${text}`, x, y);

    }

    async addCardTemplate(){
        this.background = await Canvas.loadImage(this.bgImage);
        this.ctx.drawImage(this.background, 0, 0, this.width, this.height); 
    }

    async addColour(colour){
        this.cardColour = await Canvas.loadImage(`./Data/Cards/Assets/${colour}Card.png`);
        this.ctx.drawImage(this.cardColour, 0, 0, this.width, this.height);
    }

    async addProgressBar(){
        //Background bar
        this.ctx.fillStyle = 'rgba(64,68,75,1)';
        this.ctx.fillRect(132, 1902, 1020, 50);

        //Foreground bar which varies in width depending on percentage
        this.ctx.fillStyle = 'rgba(59,165,93,1)';
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

    async setFont(size){
        //Uses specific font
        this.ctx.font = `${size}px "Code"`;
    }

    getCard(){
        return this.attachment;
    }

}