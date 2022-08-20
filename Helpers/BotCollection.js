const BotObj = require('../Data/Bots/BotObj');
const ErrorHandler = require("./ErrorHandler");
const CardsView = require("./CardsView");
const { MessageActionRow, MessageSelectMenu, MessageButton } = require("discord.js");
const fs = require('fs');
const cardData = JSON.parse(fs.readFileSync('./Data/Cards/cardData.json'));
const { v4: uuidv4 } = require('uuid');
const EventEmitter = require('events');
const consola = require("consola");

module.exports = class BotCollection {
	constructor(collection, interaction, showDead){

        //Convert string to an array
        this.collection = collection;
        this.objs = [];
        this.interaction = interaction;
        this.id = uuidv4();
        this.selected;
        this.selectedEvent = new EventEmitter();

        if(typeof collection != 'object') {
            let err = new Error(`Invalid collection given to botCollection.constructor()`);
            return ErrorHandler.handle(this.interaction, err);
        }

        this.convertToObjects(showDead);

    }

    async viewCollection(interaction, cardsPerPage, selectMsg, otherUser){

        let sortedCollection = this.objs;

        let page = 0;
        let maxPages = Math.ceil(sortedCollection.length / cardsPerPage);
        let prevPageId = uuidv4();
        let nextPageId = uuidv4();

        let sortedSelection = sortedCollection.slice(page * cardsPerPage, page * cardsPerPage + cardsPerPage);

        if(sortedCollection.length <= 0) {
            let err;
            if(otherUser) {
                err = new Error(`This user does not have any Bots to view...`);
            } else {
                err = new Error(`You do not own any Bots of the specified type. Try \`/build\` to get started.`);
            }
            return ErrorHandler.info(interaction, err);
        }
    
        const nextPage = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId(prevPageId)
                        .setLabel('Prev Page: ')
                        .setStyle('SECONDARY'),
                    new MessageButton()
                        .setCustomId(nextPageId)
                        .setLabel('Next Page: ')
                        .setStyle('SECONDARY')
                )

        let cards = await new CardsView(interaction, sortedSelection);
        await cards.createCards();

        if(!interaction.channel)
            await interaction.user.createDM();

        await interaction.editReply({ 
            content: `${selectMsg}Bot Collection [Page ${page + 1}/${maxPages}]`, 
            components: [nextPage], 
            files: [await cards.getCards()] }).catch((e) => consola.error(e));

        const filter = i => (i.user.id === interaction.user.id && (i.customId == nextPageId || i.customId == prevPageId)); 
		const collector = interaction.channel.createMessageComponentCollector({ filter, time: 600000, errors: ['time'] });
		
        collector.on('collect', async i => { 

            await i.deferUpdate().catch(e => consola.error(e));

			//If they switched a page
			if(i.customId == nextPageId || i.customId == prevPageId) {
				if(i.customId == nextPageId) {
					if(page < maxPages - 1) page++;
					else page = 0;
				} else {
					if(page > 0) page--;
					else page = maxPages - 1;
				}

                sortedSelection = sortedCollection.slice(page * cardsPerPage, page * cardsPerPage + cardsPerPage);

                cards = await new CardsView(interaction, sortedSelection);
                await cards.createCards();

				return interaction.editReply({ 
                    content: `${selectMsg}Bot Collection [Page ${page + 1}/${maxPages}]`, 
                    components: [nextPage], 
                    files: [await cards.getCards()] 
                }).catch(e => { consola.error(e)});
                
			}

        });

        collector.on('end', async() => {
            await interaction.editReply({ components: [] }).catch(e => consola.error(e));
        });

    }

    async inspectCollection(interaction, user, maxSelected, selectMsg, noCancel){
        let selectId = uuidv4();
        let prevPageId = uuidv4();
        let nextPageId = uuidv4();
        let cancelId = uuidv4();

        let selectionList = this.getSelectionList();
        let page = 0;
        let maxPages = Math.max(selectionList.length, 1);
        let selectCount = 0;

        if(selectionList[0].length <= 0) {
            let err = new Error(`No bots could be found.`);
            await ErrorHandler.info(interaction, err);
            return;
        }

        //Selection menu
        let selectList = new MessageActionRow()
            .addComponents(
                new MessageSelectMenu()
                    .setCustomId(selectId)
                    .setPlaceholder(`[Page ${page + 1}] ${selectMsg ? selectMsg : 'Select a Bot: '}`)
                    .addOptions([selectionList[page]])
            );
    
        const nextPage = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId(prevPageId)
                    .setLabel('Prev Page: ')
                    .setStyle('SECONDARY'),
                new MessageButton()
                    .setCustomId(nextPageId)
                    .setLabel('Next Page: ')
                    .setStyle('SECONDARY')
            )
        
        const cancel = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId(cancelId)
                    .setLabel('Cancel Command')
                    .setStyle('DANGER')
            )

        if(!interaction.channel)
            await interaction.user.createDM().catch((e) => consola.error(e));

        let components = [selectList, nextPage];
        if(!noCancel) components.push(cancel);

        await interaction.editReply({ 
            content: 'Select a bot: ', 
            components: components }).catch((e) => consola.error(e));

        const filter = i => (i.user.id === interaction.user.id && (i.customId == selectId || i.customId == nextPageId || i.customId == prevPageId || i.customId == cancelId)); 
		const collector = interaction.channel.createMessageComponentCollector({ filter, time: 600000, errors: ['time'] });
		let cancelled = false;

        collector.on('collect', async i => { 

            await i.deferUpdate().catch(e => consola.error(e));

            // If they cancelled the command
            if(i.customId == cancelId) {
                cancelled = true;
                collector.emit('end');
                return;
            }

			// If they switched a page
			if(i.customId == nextPageId || i.customId == prevPageId) {
				if(i.customId == nextPageId) {
					if(page < maxPages - 1) page++;
					else page = 0;
				} else {
					if(page > 0) page--;
					else page = maxPages - 1;
				}

				selectList = new MessageActionRow()
					.addComponents(
						new MessageSelectMenu()
							.setCustomId(selectId)
							.setPlaceholder(`[Page ${page + 1}] ${selectMsg ? selectMsg : 'Select a Bot: '}`)
							.addOptions([selectionList[page]]),
					);

				return interaction.editReply({ components: [selectList, nextPage] })
                    .catch(e => { consola.error(e)});
                
			}

            //If maximum number of selects, then finish
            if(maxSelected) {
                selectCount++;
                if(selectCount >= maxSelected)
                    collector.emit('end');
            } 

            //Create a new card image out of selected option
            this.selected = this.objs[parseInt(i.values)];
            this.selectedEvent.emit('selected');

        });

        collector.once('end', async() => {
            await user.pause(false);
            if(cancelled) {      
                await interaction.editReply({ 
                    embeds: [],
                    files: [],
                    components: [],
                    content: `The command was cancelled` 
                }).catch(e => consola.error(e));
            }
        });

        return true;

    }

    // Pass in an array of strings and turn to BotObjs
    convertToObjects(showDead){
        let objArray = [];

        for(const bot of this.collection){
            let newBot = new BotObj(this.interaction, bot);
            if((!showDead && bot.alive) || (showDead && !bot.alive))
                objArray.push(newBot); 
        }

        this.objs = objArray;

    }

    // Takes bot objects and gives back selection options
    getSelectionList(objs) {
        let objects = this.objs;

        if(objs) objects = objs;

        let selectionList = [];
        selectionList[0] = [];
        let page = 0;
        
        for(let i = 0; i < objects.length; i++){
            // Select menus have a max of 25 values
            if((i + 1) % 25 == 0){
                page++; 
                selectionList.push([]);
            } 

            selectionList[page].push({
                label: `${objects[i].name} ${objects[i].goldPlated ? "Gold Plated" : ""}`,
                description: `${objects[i].power}/${objects[i].lifespan}/${objects[i].viral}/${objects[i].firewall}`,
                value: `${i}`,
                emoji: `${cardData[objects[i].findLevel()].emoji}`,
            });
        }

        return selectionList;

    }

    compareAscending(a, b) {
        if (a.exp < b.exp)
            return -1;
        if (a.exp > b.exp)
            return 1;
        return 0;
    }

    compareDescending(a, b) {
        if (a.exp > b.exp)
            return -1;
        if (a.exp < b.exp)
            return 1;
        return 0;
    }
      
    sortCollection(sort){
        /*
            highestExp: BOOLEAN
            lowestExp: BOOLEAN
        */

        let collection = this.objs;

        if(typeof collection != "object") {
            let err = new Error(`Invalid collection passed to botCollection.filterCollection()`);
            return ErrorHandler.handle(this.interaction, err);
        }

        //Order by highest exp
        if(sort) {
            if(sort.exp) {
                if(sort.exp == "highest")
                    this.objs = collection.sort(this.compareDescending);
                else if(sort.exp == "lowest")
                    this.objs = collection.sort(this.compareAscending);
                return this.objs;
            }
        }

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
            isChallenge: STRING
        
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

            if(filters.bot_type && collection[i].bot_type.toLowerCase() != filters.bot_type.toLowerCase()) continue;
            if(filters.owner_username && collection[i].owner_username != filters.owner_username) continue;
            if(filters.owner_original_username && collection[i].owner_original_username != filters.owner_original_username) continue;
            if(filters.minExp && collection[i].exp < filters.minExp) continue;
            if(filters.maxExp && collection[i].exp > filters.maxExp) continue;
            if(filters.minLevel && collection[i].findLevel() < filters.minLevel) continue;
            if(filters.maxLevel && collection[i].findLevel() > filters.maxLevel) continue;
            if(filters.specificLevel && collection[i].findLevel() != filters.specificLevel) continue;
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
            if(filters.isChallenge && !filters.isChallenge.includes(collection[i].BotObj.bot_id)) continue;

            newCollection.push(collection[i]);
        }

        this.objs = newCollection;

        return newCollection;
    }


}
