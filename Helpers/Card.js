const ErrorHandler = require("./ErrorHandler.js");
const fs = require('fs');
const consola = require("consola");
const cardData = JSON.parse(fs.readFileSync('./Data/Cards/cardData.json'));
const CPM = JSON.parse(fs.readFileSync('./Data/Bots/CPM.json'));
const Canvas = require('canvas');
const { MessageAttachment } = require('discord.js');
Canvas.registerFont('./Data/Cards/TravelingTypewriter.ttf', { family: 'Typewriter' });
Canvas.registerFont('./Data/Cards/Code.ttf', { family: 'Code' });

module.exports = class BotObj {
    constructor(interaction, botObj) {
        this.canvas = Canvas.createCanvas(1280, 2048);
        this.ctx = this.canvas.getContext('2d');
        this.bgImage = "./Data/Cards/CardTemplate.png";
        this.botObj = botObj;
        this.attachment;
        this.progressPercentage = 0;
        this.interaction = interaction;
        return;
    }

    async createCard(){

        //Apply card background
        this.background = await Canvas.loadImage(this.bgImage);
        let chosen = await this.getCardLevel();
        this.success = true;
        
        await this.addColour(chosen.colour);

        //Apply progress bar
        await this.addProgressBar(132, 1902, 1020, 50);

        //Apply card template overlay
        await this.addCardTemplate();

        //Draw text on card
        await this.addTextElements(chosen.name);

        //90% scale on the image
        await this.addImage(0.9, 0.9);

        if(!this.success)
            return false;

        this.attachment = new MessageAttachment(this.canvas.toBuffer(), 'card.png');
    
        return true;
    
    }

    async addImage(scaleX, scaleY){

        //No image found
        if(!this.botObj || !this.botObj.image) {
            let err = new Error(`No bot image found on Card.addImage()`);
            this.success = false;
            return ErrorHandler.error(this.interaction, err);
        }

        let img = await Canvas.loadImage(this.botObj.image);
        this.ctx.drawImage(img, this.canvas.width / 2 - img.width / 2 + 50, 180, Math.round(1024 * scaleX), Math.round(1024 * scaleY));

    }

    async addTextElements(name){
        //Set appropriate font and colour
        this.setFont(100);
        this.ctx.fillStyle = '#ffffff';

        //No image found
        if(!this.botObj || isNaN(this.botObj.power) || isNaN(this.botObj.lifespan) || isNaN(this.botObj.viral) || isNaN(this.botObj.firewall)) {
            let err = new Error(`No bot stats on Card.addTextElements()`);
            this.success = false;
            return ErrorHandler.error(this.interaction, err);
        }

        //Name and card type
        this.ctx.fillText(`${this.botObj.bot_type}`.toUpperCase(), this.canvas.width / 2 - this.ctx.measureText(`${this.botObj.bot_type}`.toUpperCase()).width / 2, 170);
        this.ctx.fillText(`${name}`, this.canvas.width / 2 - this.ctx.measureText(`${name}`).width / 2, 1180);

        //Stats
        this.ctx.fillText(`${this.botObj.power}`, 635 - this.ctx.measureText(`${this.botObj.power}`).width - 20, 1460);
        this.ctx.fillText(`${this.botObj.lifespan}`, 680 + 20, 1460);

        this.ctx.fillText(`${this.botObj.viral}`, 635 - this.ctx.measureText(`${this.botObj.viral}`).width - 20, 1710);
        this.ctx.fillText(`${this.botObj.firewall}`, 680 + 20, 1710);
    }

    async addCardTemplate(){
        this.ctx.drawImage(this.background, 0, 0, this.canvas.width, this.canvas.height); 
    }

    async addColour(colour){
        this.cardColour = await Canvas.loadImage(`./Data/Cards/${colour}Card.png`);
        this.ctx.drawImage(this.cardColour, 0, 0, this.canvas.width, this.canvas.height);
    }

    async addProgressBar(x, y, width, height){
        //Background bar
        this.ctx.fillStyle = 'rgba(64,68,75,1)';
        this.ctx.fillRect(x, y, width, height);

        //Foreground bar which varies in width depending on percentage
        this.ctx.fillStyle = 'rgba(100,0,0,1)';
        this.ctx.fillRect(x, y, Math.floor(width * (this.progressPercentage / 100)), height);
    }

    async getCardLevel(){
        //No exp found
        if(!this.botObj || !this.botObj.exp) {
            let err = new Error(`No bot exp found on Card.getCardLevel()`);
            this.success = false;
            return ErrorHandler.error(this.interaction, err);
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