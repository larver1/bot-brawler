const ErrorHandler = require("./ErrorHandler.js");
const Canvas = require('canvas');
const { MessageAttachment } = require('discord.js');
Canvas.registerFont('./Data/Cards/Assets/TravelingTypewriter.ttf', { family: 'Typewriter' });
Canvas.registerFont('./Data/Cards/Assets/Code.ttf', { family: 'Code' });

module.exports = class Map {
    constructor(interaction, users) {
        this.users = users;
        this.scale = 1.0;
        this.width = 1024;
        this.height = 1024;
        this.canvas = Canvas.createCanvas(this.width * this.scale, this.height * this.scale);
        this.ctx = this.canvas.getContext('2d');

        this.attachment;
        this.interaction = interaction;
        
        return;
    }

    degreeToRadian(degree){
        return degree * Math.PI / 180;
    }

    median(values) {
        if(values.length === 0) {
                let err = new Error(`No inputs on Map.median()`);
                this.success = false;
                return ErrorHandler.handle(this.interaction, err);     
        } 

        values.sort(function(a,b){
          return a-b;
        });
      
        let half = Math.floor(values.length / 2);
        
        if (values.length % 2)
          return values[half];
        
        return (values[half - 1] + values[half]) / 2.0; 
    }

    async findRange() {
        // Find the range of wealth
        this.moneyRange = [];
        this.activityRange = [];

        for(const user of this.users) {
            this.moneyRange.push(user.balance);
            this.activityRange.push(Math.abs(Date.now() - user.lastCommand));
        }

        this.moneyMax = Math.max(...this.moneyRange);
        this.activityMax = Math.max(...this.activityRange);

        this.moneyMin = Math.min(...this.moneyRange);
        this.activityMin = Math.min(...this.activityRange);

    }

    async createMap(){

        await this.createText();

        await this.findRange();

        await this.createUsers();

        this.attachment = new MessageAttachment(this.canvas.toBuffer(), 'map.png');
    }

    async createText() {
        this.ctx.fillStyle = `#2f3136`;
        this.ctx.fillRect(0, 0, this.width, this.height);
    
        this.ctx.fillStyle = `WHITE`;
        this.setFont(40);
        //this.displayText(`RECENTLY ACTIVE USERS`, this.width / 2 - this.ctx.measureText(`RECENTLY ACTIVE USERS`).width / 2, 80);

    }

    checkBounds(position, radius) {
        if(position > this.height - radius || position < radius)
            return false;

        return true;
    }

    // Find a set of coordinates that has not been occupied yet
    findCoords(coords, x, y, radiusX, radiusY) {
        let passedAll = false;
        // Keep running until found co-ordinates that don't overlap with existing objects
        while(!passedAll) {
            passedAll = true;
            // Check all of the coords
            for(let i = 0; i < coords.length; i++) {
                // If new coords are colliding with existing rect, change it
                while((x + radiusX >= coords[i].xMin && x - radiusX <= coords[i].xMax) && (y + radiusY >= coords[i].yMin && y - radiusY <= coords[i].yMax)) {
                    // If we have to change co-ords, it can be either x or y
                    if(Math.random() > 0.5)
                        x = Math.ceil(Math.random() * (this.width - (radiusX * 2))) + radiusX;
                    else
                        y = Math.ceil(Math.random() * (this.height - (radiusY * 2))) + radiusY;
                 
                    passedAll = false;
                    i = 0;
                }
            }
        }

        return [x, y];
    }

    async createUsers(){

        let moneyRange = this.moneyMax - this.moneyMin;
        let coords = [];

        for(let i = 0; i < this.users.length; i++) {

            const user = this.users[i];

            // Calculate size of circle
            let userMoneyRange = user.balance - this.moneyMin;
            let circleRadius = Math.ceil(50 * ((userMoneyRange / moneyRange) || 0.01)) + 10;
            
            // Calculate size of text
            this.setFont(Math.min(50, circleRadius + 10));
            let textSize = this.ctx.measureText(user.username);
            
            // Calculate rectangular hitbox
            let radiusX = Math.max(circleRadius, textSize.width / 2, circleRadius) + 20;
            let radiusY = circleRadius + textSize.emHeightAscent + textSize.emHeightDescent;

            // Choose random x and y co-ords that don't go off bounds
            let x = Math.ceil(Math.random() * (this.width - (radiusX * 2))) + radiusX;
            let y = Math.ceil(Math.random() * (this.height - (radiusY * 2))) + radiusY;

            // Replace with new co-ordinates if the collide with another object
            let newValues = this.findCoords(coords, x, y, radiusX, radiusY);
            x = newValues[0];
            y = newValues[1];
            
            // Add new co-ordinates to the list
            let newCoords = {
                xMin: x - radiusX,
                xMax: x + radiusX,
                yMin: y - radiusY,
                yMax: y + radiusY,
            }

            coords.push(newCoords);

            // Display circle of player
            this.ctx.beginPath();
            this.ctx.ellipse(x, y, circleRadius, circleRadius, 0, this.degreeToRadian(0), this.degreeToRadian(360));
            this.ctx.fill();
            this.ctx.closePath();

            // Display player name
            this.displayText(user.username, x - textSize.width / 2, y + radiusY);
        }
    }

    async displayText(text, x, y) {
        this.ctx.fillText(`${text}`, x, y);
    }

    async setFont(size){
        //Uses specific font
        this.ctx.font = `${size}px "Code"`;
    }

    getMap(){
        return this.attachment;
    }

}