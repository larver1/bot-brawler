const { Client, MessageEmbed } = require("discord.js");
const BotBuilder = require("../../Helpers/BotBuilder");
const BotObj = require("../../Data/Bots/BotObj");
const BotCollection = require("../../Helpers/BotCollection");

module.exports = {
    name: "cards",
    description: "Check all of your cards.",
    /**
     * @param {CommandInteraction} CommandInteraction
     * @param {Object} executeObj
     */
    async execute(interaction, utils) {

        let bots = await utils.user.getBots();
        let collection = await new BotCollection(bots, interaction);

        if(!collection)
            return;

        //await interaction.editReply({ files: [card.getCard()], content: `${utils.user.username} built a *PROTOTYPE:${botObj.bot_type.toUpperCase()}*` });

        return interaction.editReply("works");
    }

}