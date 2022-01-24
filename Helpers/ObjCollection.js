const botObj = require('../Data/Bots/botObj');
const ErrorHandler = require("./ErrorHandler");
const Card = require("./Card");
const { Client, MessageEmbed, MessageActionRow, MessageSelectMenu, MessageButton, CommandInteraction } = require("discord.js");
const fs = require('fs');
const cardData = JSON.parse(fs.readFileSync('./Data/Cards/cardData.json'));
const { v4: uuidv4 } = require('uuid');
const EventEmitter = require('events');

module.exports = class BotCollection {
	constructor(collection, interaction){

        //Convert string to an array
        this.objs = collection;
        this.interaction = interaction;
        this.selected;
        this.selectedEvent = new EventEmitter();

        if(typeof collection != 'object') {
            let err = new Error(`Invalid collection given to ObjCollection.constructor()`);
            return ErrorHandler.handle(this.interaction, err);
        }

    }

    async inspectCollection(interaction, maxSelected){
        let selectId = uuidv4();
        let prevPageId = uuidv4();
        let nextPageId = uuidv4();

        let page = 0;
        let maxPages = selectionList.length;
        let selectCount = 0;

        if(selectionList[0].length <= 0) {
            let err = new Error(`The list seems to be empty.`);
            return ErrorHandler.info(interaction, err);
        }

        //Selection menu
        let selectList = new MessageActionRow()
        .addComponents(
            new MessageSelectMenu()
                .setCustomId(selectId)
                .setPlaceholder(`[Page ${page + 1}] Select an option: `)
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

        await interaction.editReply({ content: 'Select an option: ', components: [selectList, nextPage] });

        const filter = i => (i.user.id === interaction.user.id && (i.customId == selectId || i.customId == nextPageId || i.customId == prevPageId)); 
		const collector = interaction.channel.createMessageComponentCollector({ filter, time: 600000, errors: ['time'] });
		
        collector.on('collect', async i => { 

            await i.deferUpdate().catch(e => utils.consola.error(e));

			//If they switched a page
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
							.setPlaceholder(`[Page ${page + 1}] Select an option:`)
							.addOptions([selectionList[page]]),
					);

				return interaction.editReply({ components: [selectList, nextPage] }).catch(e => { utils.consola.error(e)});
                
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

        collector.on('end', async() => {
            await interaction.editReply({ components: [] }).catch(e => utils.consola.error(e));
        });

    }

    //Takes pokemon objects and gives back selection options
    getSelectionList(options){
        let objects = this.objs;
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
                label: `${options.label}`,
                description: `${options.description}`,
                value: `${i}`,
                emoji: `${options.emoji}`,
            });
        }

        return selectionList;

    }


}
