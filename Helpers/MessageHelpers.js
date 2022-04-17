const ErrorHandler = require("./ErrorHandler");
const CardsView = require("./CardsView");
const { Client, MessageEmbed, MessageActionRow, MessageSelectMenu, MessageButton, CommandInteraction } = require("discord.js");
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const EventEmitter = require('events');
const consola = require("consola");
const sampleEmbed = require("./sampleEmbed");


module.exports = class MessageHelpers {
    constructor() {

    }

    //Provides interactive next/prev page functionality for lists of items
    static async listPages(interaction, user, list, config){
        let prevPageId = uuidv4();
        let nextPageId = uuidv4();

        let lines = list.split("\n");
        let linesPerPage = config.linesPerPage || 10;
        let pageList = [];
        let page = 0;
        let lineCount = 0;
        pageList[page] = '';

        for(let line = 0; line < lines.length; line++) {
            pageList[page] += `${lines[line]}\n`;

            lineCount++;
            if(lineCount > linesPerPage) {
                page++;
                lineCount = 0;
                pageList[page] = '';
            }
        }

        let maxPages = pageList.length;
        page = 0;

        if(pageList[page].length <= 0) {
            let err = new Error(`The message given to MessageHelpers.listPages() is empty.`);
            return ErrorHandler.error(interaction, err);
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

        const display = new sampleEmbed(interaction, user)
            .setTitle(`${config.title ? config.title : 'List'} Page [${page + 1}/${maxPages}]`)
            .setDescription(`${pageList[page]}`)

        await interaction.editReply({ embeds: [display], components: [nextPage] });

        if(!interaction.channel)
            await interaction.user.createDM();

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

                display.setTitle(`${config.title ? config.title : 'List'} Page [${page + 1}/${maxPages}]`)
                display.setDescription(`${pageList[page]}`)

				return interaction.editReply({ embeds: [display], components: [nextPage] }).catch(e => { consola.error(e)});
                
			}

        });

        collector.on('end', async() => {
            await interaction.editReply({ components: [] }).catch(e => utils.consola.error(e));
        });

    }
}