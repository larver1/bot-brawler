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
        return;
    }

    async createCard(){
        //Apply card background
        let chosen = this.getCardLevel();
        console.log(this.progressPercentage + "%");

        this.cardColour = await Canvas.loadImage(`./Data/Cards/${chosen.colour}Card.png`);
        this.ctx.drawImage(this.cardColour, 0, 0, this.canvas.width, this.canvas.height);

        //Apply progress bar
        this.ctx.fillStyle = 'rgba(64,68,75,1)';
        this.ctx.fillRect(132, 1902, 1020, 50);

        this.ctx.fillStyle = 'rgba(100,0,0,1)';
        this.ctx.fillRect(132, 1902, Math.floor(1020 * (this.progressPercentage / 100)), 50);

        //Apply card details
        this.background = await Canvas.loadImage(this.bgImage);
        this.ctx.drawImage(this.background, 0, 0, this.canvas.width, this.canvas.height); 

        //Draw text
        this.setFont(100);
        this.ctx.fillStyle = '#ffffff';

        //Name and card type
        this.ctx.fillText(`${this.botObj.bot_type}`.toUpperCase(), this.canvas.width / 2 - this.ctx.measureText(`${this.botObj.bot_type}`.toUpperCase()).width / 2, 170);
        this.ctx.fillText(`${chosen.name}`, this.canvas.width / 2 - this.ctx.measureText(`${chosen.name}`).width / 2, 1180);

        //Stats
        this.ctx.fillText(`${this.botObj.power}`, 635 - this.ctx.measureText(`${this.botObj.power}`).width - 20, 1460);
        this.ctx.fillText(`${this.botObj.lifespan}`, 680 + 20, 1460);

        this.ctx.fillText(`${this.botObj.viral}`, 635 - this.ctx.measureText(`${this.botObj.viral}`).width - 20, 1710);
        this.ctx.fillText(`${this.botObj.firewall}`, 680 + 20, 1710);


        if(this.botObj && this.botObj.image) {
            let img = await Canvas.loadImage(this.botObj.image);
            this.ctx.drawImage(img, this.canvas.width / 2 - img.width / 2 + 50, 180, 922, 922);
        }

        this.attachment = new MessageAttachment(this.canvas.toBuffer(), 'card.png');
    }

    getCardLevel(){
        //Find the correct card level
        for(let i = 0; i < cardData.length; i++) {
            if(!cardData[i + 1] || 
                (cardData[i + 1].exp > this.botObj.exp && cardData[i].exp <= this.botObj.exp)) {
                    if(cardData[i + 1]) {
                        let expRange = cardData[i + 1].exp - cardData[i].exp;
                        let progress = this.botObj.exp - cardData[i].exp;;
                        this.progressPercentage = Math.floor((progress / expRange) * 100);
                    }
                    return cardData[i];  
                }
        }
    }

    setFont(size){
        this.ctx.font = `${size}px "Code"`;
    }

    getCard(){
        return this.attachment;
    }

}