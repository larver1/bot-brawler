const { Client, MessageEmbed, MessageActionRow, MessageSelectMenu, MessageButton } = require("discord.js");
const BotCollection = require("../../Helpers/BotCollection");
const { v4: uuidv4 } = require('uuid');

module.exports = {
    name: "cards",
    description: "Check all of your cards.",
    options: [{
        name: "exp",
        description: "Sorts your card collection based on EXP.",
        required: false,
        type: "STRING",
        choices: [
            {
                name: "Highest",
                value: "highest",
            }, 
            {
                name: "Lowest",
                value: "lowest",
            },
        ]
    },
    {
        name: "destroyed",
        description: "Filters your card collection to show dead/destroyed cards.",
        required: false,
        type: "BOOLEAN",
    },
    {
        name: "name",
        description: "Filters your card collection based on Bot Name.",
        required: false,
        type: "STRING",
    },
    {
        name: "level",
        description: "Filters your card collection based on Card Colour.",
        required: false,
        type: "INTEGER",
        choices: [
            {
                name: "Green",
                value: 0,
            }, 
        ]
    }
    ],
    /**
     * @param {CommandInteraction} CommandInteraction
     * @param {Object} executeObj
     */
    async execute(interaction, utils) {

        let bots = await utils.user.getBots();
        let showDead = await interaction.options.getBoolean("destroyed");

        let collection = await new BotCollection(bots, interaction, showDead);

        if(!collection)
            return;

        //Filter parameters
        collection.filterCollection({
            destroyed: showDead,
            bot_type: interaction.options.getString("name"),
            specificLevel: interaction.options.getInteger("level"),
        });

        //Sort parameters
        collection.sortCollection({
            exp: interaction.options.getString("exp"),
        });

        //Inspect the collection
        await collection.inspectCollection(interaction);

        //When a card is selected, display it
        collection.selectedEvent.on(`selected`, async () => {
            const card = await new utils.card(interaction, collection.selected);
            
            if(!await card.createCard())
                return;

            await interaction.editReply({ files: [card.getCard()] })
                .catch(e => utils.consola.error(e));

        });

    }

}