const { Client, MessageEmbed, MessageActionRow, MessageSelectMenu, MessageButton } = require("discord.js");
const BotBuilder = require("../../Helpers/BotBuilder");
const BotObj = require("../../Data/Bots/BotObj");
const BotCollection = require("../../Helpers/BotCollection");

module.exports = {
    name: "train",
    description: "Train a card for more EXP.",
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
        let collection = await new BotCollection(bots, interaction);

        if(!collection)
            return;

        //Filter parameters
        collection.filterCollection({
            bot_type: interaction.options.getString("name"),
            specificLevel: interaction.options.getInteger("level"),
        });

        //Sort parameters
        collection.sortCollection({
            exp: interaction.options.getString("exp"),
        });

        //Inspect the collection
        await collection.inspectCollection(interaction, 1);

        //When a card is selected, display it
        collection.selectedEvent.on(`selected`, async () => {

            let exp = Math.ceil(Math.random() * 100);
            let dataEntries = exp * 15000 * Math.random();

            console.log("old exp: " + collection.selected.exp);

            //Find the selected bot, add XP, and save to DB
            if(!await utils.dbBots.addExp(interaction, collection.selected.botObj.bot_id, exp))
                return;

            //Make new object and display new card
            const botToTrain = await utils.dbBots.findBot(interaction, collection.selected.botObj.bot_id);
            const newObj = await new BotObj(interaction, botToTrain);
            const card = await new utils.card(interaction, newObj);
            
            if(!await card.createCard())
                return;

            let msg = `${newObj.bot_type} analysed ${dataEntries.toFixed(2)} KB of training data and gained ${exp} EXP!\n`;

            //If leveled up, show extra text
            console.log("new exp: " + newObj.exp);

            if(newObj.findLevel() > collection.selected.findLevel()) 
                msg += `${newObj.bot_type} entered the *${newObj.levelName}* development phase!`;

            await interaction.editReply({ content: `${msg}`, files: [card.getCard()], components: [] })
                .catch(e => utils.consola.error(e));

        });

    }

}