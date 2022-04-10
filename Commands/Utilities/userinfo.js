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
        const user = await utils.db.findUser(interaction, target.id);

        let bots = await user.getBots();

        // Sort card collection by EXP, and take first 5
        let collection = await new BotCollection(bots, interaction);
        collection.sortCollection({
            exp: "highest",
        });

        // Display top 5 cards
        collection = collection.objs.slice(0, 5);
        const cards = await new CardsView(interaction, collection);
        await cards.createCards();

        // Display user info
        const Response = new utils.embed(interaction, utils.user)
            .setTitle("User Info")
            .setAuthor({ name: target.tag, iconURL: target.avatarURL({ dynamic: true, size: 512 }) })
            .setThumbnail(target.avatarURL({ dynamic: true, size: 512 }))
            .addField("ID", `${target.id}`, true)
            .addField("Member Since", `<t:${parseInt(target.joinedTimestamp / 1000)}:R>`, true)
            .addField("Discord User Since", `<t:${parseInt(target.createdTimestamp / 1000)}:R>`, true)

        interaction.editReply({ content: `__**${user.username}'s Stats**__`, files: [cards.getCards()] })
            .catch((e) => utils.consola.error(e));;
    }
}