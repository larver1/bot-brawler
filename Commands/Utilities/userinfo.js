const BotCollection = require("../../Helpers/BotCollection");
const machinePartEmoji = "<:machine_parts:992728693799669801>";
const energyEmoji = "<:energy_v1:993195219224903832>";

module.exports = {
    name: "userinfo",
    description: "View a user's profile.",
    usage: "`/userinfo user` allows you to view the profile of another user on the server.\n`/userinfo username` allows you to view the profile of any user.",
    options: [{
        name: "user",
        description: "Check a user's profile profile by @user.",
        required: false,
        type: "SUB_COMMAND",
        options: [{
            name: "user",
            description: "The user's profile to view.",
            required: true,
            type: "USER"
        }]
    },
    {
        name: "username",
        description: "Check a user's profile by username.",
        required: false,
        type: "SUB_COMMAND",
        options: [{
            name: "username",
            description: "The username's profile to view.",
            required: true,
            type: "STRING"
        }]
    }],
    /***
     * @param {ContextMenuInteraction} interaction
     * @param {Object} utils
     */
    async execute(interaction, utils){
        const subCommand = await interaction.options.getSubcommand();
        let userToView;

        if(subCommand == "user") {
            userToView = await utils.db.findUser(interaction, interaction.options.getUser("user").id);
        } else if(subCommand == "username") {
            userToView = await utils.db.findUsername(interaction, await interaction.options.getString("username"));
        }

        if(!userToView) {
            await utils.user.pause(false); 
            return;
        }

        // Sort card collection by EXP, and take first 5
        let cardsPerPage = 5;
        let bots = await userToView.getBots();
        let collection = await new BotCollection(bots, interaction, false);
        collection.sortCollection({
            exp: "highest",
        });

        let userMsg = `__**${userToView.username}'s Profile**__\n\n`
        userMsg += `${machinePartEmoji} Machine parts: \`${userToView.balance}\`\n${energyEmoji} Energy: \`${userToView.energy}\`\n\n`;

        await collection.viewCollection(interaction, cardsPerPage, userMsg, true);
        await utils.user.pause(false);     

    }
}