const ErrorHandler = require("../../../Helpers/ErrorHandler.js");
const fs = require('fs');
const botData = JSON.parse(fs.readFileSync('./Data/Bots/botData.json'));
const cardData = JSON.parse(fs.readFileSync('./Data/Cards/cardData.json'));
const Canvas = require('canvas');
const { MessageAttachment } = require('discord.js');
Canvas.registerFont('./Data/Cards/Assets/TravelingTypewriter.ttf', { family: 'Typewriter' });
Canvas.registerFont('./Data/Cards/Assets/Code.ttf', { family: 'Code' });

module.exports = class Doll {
    constructor(interaction, head, body, legs) {
        this.scale = 10;
        this.width = 64;
        this.height = 96;
        this.head = head;
        this.body = body;
        this.legs = legs;
        this.attachment;
        this.interaction = interaction;
        return;
    }

    async createDoll(){

        this.currentHeight = this.height - 48;

        //Clear canvas
        this.canvas = Canvas.createCanvas(this.width * this.scale, this.height * this.scale);
        this.ctx = this.canvas.getContext('2d');

        this.success = true;
        
        //Scale according to given values
        this.ctx.scale(this.scale, this.scale);
        
        if(!await this.addPart("Legs", this.legs))
            return false;

        this.currentHeight -= this.part.height * 0.50;
        this.currentHeight -= 5;

        if(!await this.addPart("Body", this.body))
            return false;

        this.currentHeight -= (this.part.height * 0.5);
        this.currentHeight += 5;

        if(!await this.addPart("Head", this.head))
            return false;

        if(!this.success)
            return false;

        this.attachment = new MessageAttachment(this.canvas.toBuffer(), 'doll.png');
    
        return true;
    
    }

    async addPart(partName, partNumber) {
        this.part = await Canvas.loadImage(`./Data/Minigames/Assets/${partName}${partNumber}.png`);
        this.ctx.drawImage(this.part, this.width / 2 - this.part.width / 2, this.currentHeight);

        return true;
    }

    async setFont(size){
        //Uses specific font
        this.ctx.font = `${size}px "Code"`;
    }

    getImage(){
        return this.attachment;
    }

}