const BotCollection = require("../../Helpers/BotCollection");

module.exports = {
    name: "chip",
    description: "Change your bot's battling chip.",
    usage: "`/chip type` allows you to choose the chip you would like to use on your chosen Bot.\n`/chip exp` allows you to sort your Bots by EXP.\n`/chip name` allows you to filter your Bots by name.",
    hidden: true,
    options: [
        {
            name: "type",
            description: "Choose the chip you would like to set.",
            required: true,
            type: "STRING",
            choices: [
            {
                name: "Power",
                value: "power"
            },
            {
                name: "Lifespan",
                value: "lifespan"
            },
            {
                name: "Viral",
                value: "viral"
            },
            {
                name: "Firewall",
                value: "firewall"
            },
            {
                name: "Balanced",
                value: "balanced"
            }
            ]
        },
        {
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
        }
        ],
    /**
     * @param {CommandInteraction} CommandInteraction
     * @param {Object} executeObj
     */
    async execute(interaction, utils) {

        let bots = await utils.user.getBots();
        let collection = await new BotCollection(bots, interaction);

        if(!collection) {
            await utils.user.pause(false);
            return;
        } 

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
        if(!await collection.inspectCollection(interaction, utils.user, 1)) {
            await utils.user.pause(false);
            return;
        }
        
        let chipType = interaction.options.getString("type");

        //When a card is selected, display it
        collection.selectedEvent.on(`selected`, async () => {

            let yourBot = collection.selected;

            if(!await utils.dbBots.changeChip(interaction, yourBot.botObj.bot_id, chipType)) {
                await utils.user.pause(false);
                return;
            } 

            yourBot.item = chipType;
            yourBot.investStats();
            yourBot.battling = true;

            const yourCard = await new utils.card(interaction, yourBot);

            if(!await yourCard.createCard()) {
                await utils.user.pause(false);
                return;
            } 

            await utils.userFile.writeUserLog(utils.user.username, `switched changed chips to ${yourBot.item} for ${yourBot.name} with ID ${yourBot.botObj.bot_id}.`);
            await utils.db.checkTutorial(interaction, "chip");

            await interaction.editReply({ 
                content: `${yourBot.bot_type} changed to the ${chipType} chip!`, 
                files: [yourCard.getCard()], 
                components: [] 
            }).catch(e => utils.consola.error(e));

        });

    }

}