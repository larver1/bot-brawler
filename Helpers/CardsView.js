const Canvas = require('canvas');
const Card = require("./Card");
const { MessageAttachment } = require('discord.js');
Canvas.registerFont('./Data/Cards/Assets/TravelingTypewriter.ttf', { family: 'Typewriter' });
Canvas.registerFont('./Data/Cards/Assets/Code.ttf', { family: 'Code' });

module.exports = class CardsView {
    constructor(interaction, botsToDisplay) {
        this.scale = 0.20;
        this.width = 6272;
        this.height = 2048;
        this.botsToDisplay = botsToDisplay;
        this.numBots = this.botsToDisplay.length;

        this.canvas = Canvas.createCanvas(this.width * this.scale, this.height * this.scale);
        this.ctx = this.canvas.getContext('2d');

        this.attachment;
        this.interaction = interaction;      
        return;
    }

    async createCards(){

        console.time("creating cards");
        for(let i = this.numBots - 1; i >= 0; i--) {

            let bot = this.botsToDisplay[i];

            // Create card out of bot
            let card = await new Card(this.interaction, bot);
            card.scale = this.scale;
            await card.createCard();

            // Draw card on canvas
            this.ctx.drawImage(card.canvas, i * (this.canvas.width / this.numBots) - 20 * this.scale, 0, card.width * card.scale, card.height * card.scale);
        }

        this.attachment = new MessageAttachment(this.canvas.toBuffer(), 'cards.png');
        console.timeEnd("creating cards");

        return true;

    }

    getCards(){
        return this.attachment;
    }

}