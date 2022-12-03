const ErrorHandler = require("./ErrorHandler.js");
const Canvas = require('canvas');
const { MessageAttachment } = require('discord.js');
Canvas.registerFont('./Data/Cards/Assets/TravelingTypewriter.ttf', { family: 'Typewriter' });
Canvas.registerFont('./Data/Cards/Assets/Code.ttf', { family: 'Code' });

module.exports = class Map {
    constructor(interaction, chosen, type) {
        this.chosen = chosen;
        this.type = type;
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

        for(const obj of this.chosen) {
            if(this.type == "users") {
                this.moneyRange.push(obj.balance);
                this.activityRange.push(Math.abs(Date.now() - obj.lastCommand));
            } else if(this.type == "bots") {
                this.moneyRange.push(obj.exp);
            }

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
        let attempts = 0;
        let success = true;
        // Keep running until found co-ordinates that don't overlap with existing objects
        while(!passedAll && attempts < 100) {
            passedAll = true;
            // Check all of the coords
            for(let i = 0; i < coords.length; i++) {
                let innerAttempts = 0;
                // If new coords are colliding with existing rect, change it
                while((x + radiusX >= coords[i].xMin && x - radiusX <= coords[i].xMax) && (y + radiusY >= coords[i].yMin && y - radiusY <= coords[i].yMax) && innerAttempts < 100) {
                    // If we have to change co-ords, it can be either x or y
                    if(Math.random() > 0.5)
                        x = Math.ceil(Math.random() * (this.width - (radiusX * 2))) + radiusX;
                    else
                        y = Math.ceil(Math.random() * (this.height - (radiusY * 2))) + radiusY;
                 
                    passedAll = false;
                    i = 0;
                    innerAttempts++;

                    if(innerAttempts >= 100) {
                        success = false;
                        break;
                    }

                }
            }

            attempts++;
            if(attempts >= 100) {
                console.log('Map object failed to show.');
                success = false;
                break;
            }
        }

        if(!success) {
            console.log('Map object failed to show.');
            return null;
        }

        return [x, y];

    }

    async createUsers(){

        let moneyRange = this.moneyMax - this.moneyMin;
        let coords = [];

        for(let i = 0; i < this.chosen.length; i++) {

            const obj = this.chosen[i];
            let userMoneyRange, circleRadius, objName;

            if(this.type == "users") {
                // Calculate size of circle
                userMoneyRange = obj.balance - this.moneyMin;
                objName = obj.username;
            } else if(this.type == "bots") {
                userMoneyRange = obj.exp - this.moneyMin;
                objName = `${obj.bot_type}\n${obj.model_no}`;
            }

            circleRadius = Math.ceil(50 * ((userMoneyRange / moneyRange) || 0.01)) + 10;
            
            let longName = objName.length >= 10;

            // Calculate size of text
            this.setFont(Math.min(longName ? 30 : 50, circleRadius + 10));
            let textSize = this.ctx.measureText(objName);
            
            // Calculate rectangular hitbox
            let radiusX = Math.max(circleRadius, textSize.width / 2, circleRadius) + 20;
            let radiusY = circleRadius + textSize.emHeightAscent + textSize.emHeightDescent;

            // Choose random x and y co-ords that don't go off bounds
            let x = Math.ceil(Math.random() * (this.width - (radiusX * 2))) + radiusX;
            let y = Math.ceil(Math.random() * (this.height - (radiusY * 2))) + radiusY;

            // Replace with new co-ordinates if the collide with another object
            let newValues = this.findCoords(coords, x, y, radiusX, radiusY);
            if(!newValues)
                continue;

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
            this.displayText(objName, x - textSize.width / 2, y + radiusY - (this.type == "bots" ? (textSize.emHeightAscent) : 0));
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