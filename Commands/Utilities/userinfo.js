const { ContextMenuInteraction, MessageEmbed } = require("discord.js");
const CardsView = require("../../Helpers/CardsView");
const BotCollection = require("../../Helpers/BotCollection");

module.exports = {
    name: "userinfo",
    description: "View a user's profile.",
    options: [{
        name: "user",
        description: "Check another user's profile.",
        required: false,
        type: "USER",
    }],
    /***
     * @param {ContextMenuInteraction} interaction
     * @param {Object} utils
     */
    async execute(interaction, utils){
        const target = interaction.options.getUser("user") || interaction.user;        
        const user = await utils.db.findUser(interaction, target.id,);
        let cardsPerPage = 5;
        let bots = await user.getBots();

        // Sort card collection by EXP, and take first 5
        let collection = await new BotCollection(bots, interaction, false);

        //Sort parameters
        collection.sortCollection({
            exp: "highest",
        });

        await collection.viewCollection(interaction, cardsPerPage);

    }
}