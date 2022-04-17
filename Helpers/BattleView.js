const ErrorHandler = require("./ErrorHandler.js");
const fs = require('fs');
const consola = require("consola");
const cardData = JSON.parse(fs.readFileSync('./Data/Cards/cardData.json'));
const CPM = JSON.parse(fs.readFileSync('./Data/Bots/CPM.json'));
const Canvas = require('canvas');
const Card = require("./Card");
const { MessageAttachment } = require('discord.js');
Canvas.registerFont('./Data/Cards/Assets/TravelingTypewriter.ttf', { family: 'Typewriter' });
Canvas.registerFont('./Data/Cards/Assets/Code.ttf', { family: 'Code' });

module.exports = class BattleView {
    constructor(interaction, yourBot, otherBot, results) {
        this.scale = 0.25;
        this.width = 4096;
        this.height = 2048;
        this.canvas = Canvas.createCanvas(this.width * this.scale, this.height * this.scale);
        this.ctx = this.canvas.getContext('2d');
        this.vsImage = "./Data/Cards/Assets/VS.png";
        this.results = results;

        this.attachment;
        this.interaction = interaction;

        if(this.results) {
            yourBot.investStats();
            yourBot.battling = true;
            otherBot.investStats();
            otherBot.battling = true;
        }

        this.yourBot = yourBot;
        this.otherBot = otherBot;
        this.yourCard, this.otherCard;
        
        return;
    }

    async createCards(){
        this.yourCard = await new Card(this.interaction, this.yourBot);
        this.otherCard = await new Card(this.interaction, this.otherBot);
        let vs = await Canvas.loadImage(this.vsImage);

        await this.yourCard.createCard();
        await this.otherCard.createCard();
        
        this.ctx.drawImage(this.yourCard.canvas, 0, 0, this.yourCard.width * this.yourCard.scale, this.yourCard.height * this.yourCard.scale);
        this.ctx.drawImage(this.otherCard.canvas, (this.width * this.scale) - (this.otherCard.width * this.otherCard.scale), 0, this.otherCard.width * this.otherCard.scale, this.otherCard.height * this.otherCard.scale);

        if(this.results)
            await this.createChart();

        this.ctx.drawImage(vs, 
            ((this.canvas.width) / 2) - (vs.width / 12), 
            ((this.canvas.height) / 2) - (vs.height / 12), 
            vs.width / 6, 
            vs.height / 6);

        if(this.results)
            await this.createPercentages();

        this.attachment = new MessageAttachment(this.canvas.toBuffer(), 'battle.png');

        return true;

    }

    degreeToRadian(degree){
        return degree * Math.PI / 180;
    }

    async createChart(){

        /* 
        -> 2 Pi = full circle
        -> First segment uses your percentage as fraction
        -> Second segment fills in the remainder of the circle
        */

        //Draw background circle
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2, 120, this.degreeToRadian(0), this.degreeToRadian(360));

        //Create red gradient
        let grd = this.ctx.createRadialGradient(this.canvas.width / 2, this.canvas.height / 2, 25, this.canvas.width / 2 + 60, this.canvas.height / 2, 120)
        grd.addColorStop(0, '#370000');
        grd.addColorStop(1, '#DD3F1A');
        this.ctx.fillStyle = grd;

        this.ctx.closePath();
        this.ctx.fill();

        //Draw your segment
        this.ctx.beginPath();
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2, 150, this.degreeToRadian(0) - Math.PI / 2, this.degreeToRadian(360) * (this.results.otherPercent / 100) - Math.PI / 2, true);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height / 2);

        //Create green gradient
        let grd2 = this.ctx.createRadialGradient(this.canvas.width / 2, this.canvas.height / 2, 25, this.canvas.width / 2 - 60, this.canvas.height / 2, 120)
        grd2.addColorStop(0, '#043200');
        grd2.addColorStop(1, '#4ECE59');
        this.ctx.fillStyle = grd2;
        
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.fillStyle = '';

    }

    async createPercentages(){
        this.setFont(70);
        this.ctx.fillStyle = "#4ECE59";

        //Left side percentage
        this.ctx.fillText(`${this.results.yourPercent.toFixed()}%`, 
            this.canvas.width / 2 - this.ctx.measureText(`${this.results.yourPercent.toFixed()}%`).width * 0.85,
            this.canvas.height - (100 * this.scale));

        this.ctx.fillStyle = "#DD3F1A";

        //Right side percentage
        this.ctx.fillText(`${this.results.otherPercent.toFixed()}%`, 
        this.canvas.width / 2,
        300 * this.scale);
    }

    async setFont(size){
        //Uses specific font
        this.ctx.font = `${size}px "Code"`;
    }

    getScene(){
        return this.attachment;
    }

}