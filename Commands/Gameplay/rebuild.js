const { Client, MessageEmbed } = require("discord.js");
const BotBuilder = require("../../Helpers/BotBuilder");
const BotObj = require("../../Data/Bots/BotObj");

module.exports = {
    name: "rebuild",
    description: "Rebuild a destroyed Battle Bot.",
    /**
     * @param {CommandInteraction} CommandInteraction
     * @param {Object} executeObj
     */
    async execute(interaction, utils) {

        let bots = await utils.user.getBots();
        let collection = await new utils.botCollection(bots, interaction, true);
        
        //Sort parameters
        collection.sortCollection({
            exp: interaction.options.getString("exp"),
        });

        //Inspect the collection
        await collection.inspectCollection(interaction, 1);

        //When a card is selected, display it
        collection.selectedEvent.on(`selected`, async () => {
            
            //TODO accept/cancel with cost
            await utils.dbBots.revive(interaction, collection.selected.botObj.bot_id);

            const card = await new utils.card(interaction, collection.selected);
            
            if(!await card.createCard())
                return;

            await interaction.editReply({ files: [card.getCard()], content: `\`${collection.selected.name}\` was rebuilt for \`0x Machine Parts!\`` })
                .catch(e => utils.consola.error(e));

        });

    }

}