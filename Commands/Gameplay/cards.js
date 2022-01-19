const { Client, MessageEmbed, MessageActionRow, MessageSelectMenu, MessageButton } = require("discord.js");
const BotBuilder = require("../../Helpers/BotBuilder");
const BotObj = require("../../Data/Bots/BotObj");
const BotCollection = require("../../Helpers/BotCollection");
const { v4: uuidv4 } = require('uuid');

module.exports = {
    name: "cards",
    description: "Check all of your cards.",
    /**
     * @param {CommandInteraction} CommandInteraction
     * @param {Object} executeObj
     */
    async execute(interaction, utils) {

        let selectId = uuidv4();
        let prevPageId = uuidv4();
        let nextPageId = uuidv4();

        let bots = await utils.user.getBots();
        let collection = await new BotCollection(bots, interaction);

        if(!collection)
            return;

        //All the pages to view
        let selectionList = collection.getSelectionList();
        let page = 0;
        let maxPages = selectionList.length;

        if(selectionList[0].length <= 0)
            return interaction.editReply(`You do not own any Bots. Try \`/build\` to get started.`)
                .catch(e => utils.consola.error(e));

        //Selection menu
        let selectList = new MessageActionRow()
            .addComponents(
                new MessageSelectMenu()
                    .setCustomId(selectId)
                    .setPlaceholder(`[Page ${page + 1}] Select a Bot: `)
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

        await interaction.editReply({ content: 'Select a bot: ', components: [selectList, nextPage] });

		const filter = i => (i.user.id === interaction.user.id && (i.customId == selectId || i.customId == nextPageId || i.customId == prevPageId)); 
		const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000, errors: ['time'] });
		
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
							.setPlaceholder(`[Page ${page + 1}] Select a Bot:`)
							.addOptions([selectionList[page]]),
					);
				await interaction.editReply({ components: [selectList, nextPage]}).catch(e => { utils.consola.error(e)});
				return;
			}

            //Create a new card image out of selected option
            let selected = collection.objs[parseInt(i.values)];
            const card = await new utils.card(interaction, selected);
            
            if(!await card.createCard())
                return;

            await interaction.editReply({ files: [card.getCard()], components: [selectList, nextPage]}).catch(e => utils.consola.error(e));


        });

        collector.on('end', async() => {
            await interaction.editReply({ components: [] }).catch(e => utils.consola.error(e));
        });

    }

}