const botObj = require('../Data/Bots/botObj');
const ErrorHandler = require("./ErrorHandler.js");

module.exports = class BotCollection {
	constructor(collection, interaction){

        //Convert string to an array
        this.collection = collection;
        this.objs = [];
        this.interaction = interaction;

        if(typeof collection != 'object') {
            let err = new Error(`Invalid collection given to botCollection.constructor()`);
            return ErrorHandler.handle(this.interaction, err);
        }

        this.convertToObjects();

    }

    //Pass in an array of strings and turn to botObjs
    convertToObjects(){
        let objArray = [];

        for(const bot of this.collection){
            let newBot = new botObj(this.interaction, bot);
            objArray.push(newBot); 
        }

        this.objs = objArray;

    }

    //Takes pokemon objects and gives back selection options
    getSelectionList(objs){
        let objects = this.objs;

        if(objs) objects = objs;

        let selectionList = [];
        selectionList[0] = [];
        let page = 0;
        
        for(let i = 0; i < objects.length; i++){
            //select menus can have a max of 25 values
            if((i + 1) % 25 == 0){
                page++; 
                selectionList.push([]);
            } 

            selectionList[page].push({
                label: `${objects[i].bot_type} ${objects[i].goldPlated ? "Gold Plated" : ""}`,
                description: `${objects[i].power}/${objects[i].lifespan}/${objects[i].viral}/${objects[i].firewall}`,
                value: `${i}`,
                emoji: `🤖`,
            });
        }

        return selectionList;

    }

    //Filter a list of pokemon objects
    filterCollection(filters){
        /*
        filters can have following params:
        
            bot_type: STRING,
            owner_username: STRING,
            owner_original_username: STRING,
            minExp: INTEGER,
            maxExp: INTEGER,
            minLevel: INTEGER,
            maxLevel: INTEGER
            specificLevel: INTEGER
            alive: BOOLEAN
            minPowerBoost: INTEGER,
            maxPowerBoost: INTEGER,
            minLifespanBoost: INTEGER,
            maxLifespanBoost: INTEGER,
            minViralBoost: INTEGER,
            maxViralBoost: INTEGER,
            minFirewallBoost: INTEGER,
            maxFirewallBoost: INTEGER,
            minStats: INTEGER,
            maxStats: INTEGER
            goldPlated: BOOLEAN,
            isSelling: BOOLEAN,
        
        */

        let collection = this.objs;
        let newCollection = [];

        if(typeof collection != "object") {
            let err = new Error(`Invalid collection passed to botCollection.filterCollection()`);
            return ErrorHandler.handle(this.interaction, err);
        }

        //Accounts for API bugs
        if(filters.name)
            filters.name = filters.name.trim();

        for(let i = 0; i < collection.length; i++){

            if(filters.bot_type && collection[i].bot_type != filters.bot_type) continue;
            if(filters.owner_username && collection[i].owner_username != filters.owner_username) continue;
            if(filters.owner_original_username && collection[i].owner_original_username != filters.owner_original_username) continue;
            if(filters.minExp && collection[i].exp < filters.minExp) continue;
            if(filters.maxExp && collection[i].exp > filters.maxExp) continue;
            if(filters.minLevel && collection[i].findLevel() < filters.minLevel) continue;
            if(filters.maxLevel && collection[i].findLevel() > filters.maxLevel) continue;
            if(filters.specificLevel && collection[i].findLevel() != filters.specificLevel) continue;
            if(filters.alive && collection[i].alive != filters.alive) continue;
            if(filters.minPowerBoost && collection[i].powerBoost < filters.minPowerBoost) continue;
            if(filters.maxPowerBoost && collection[i].powerBoost > filters.maxPowerBoost) continue;
            if(filters.minLifespanBoost && collection[i].lifespanBoost < filters.minLifespanBoost) continue;
            if(filters.maxLifespanBoost && collection[i].lifespanBoost > filters.maxLifespanBoost) continue;
            if(filters.minViralBoost && collection[i].viralBoost < filters.minViralBoost) continue;
            if(filters.maxViralBoost && collection[i].viralBoost > filters.maxViralBoost) continue;
            if(filters.minFirewallBoost && collection[i].firewallBoost < filters.minFirewallBoost) continue;
            if(filters.maxFirewallBoost && collection[i].firewallBoost > filters.maxFirewallBoost) continue;
            if(filters.minStats && collection[i].stats < filters.minStats) continue;
            if(filters.maxStats && collection[i].stats > filters.maxStats) continue;
            if(filters.goldPlated && collection[i].goldPlated != filters.goldPlated) continue;
            if(filters.isSelling && collection[i].isSelling != filters.isSelling) continue;

            newCollection.push(collection[i]);
        }

        this.objs = newCollection;

        return newCollection;
    }


}
