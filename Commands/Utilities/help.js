module.exports = {
    name: "help",
    description: "Learn how to play!",
    usage: "`/commands name` allows you to get more information about a given command... Don't you already know how to do this?",
    /***
     * @param {CommandInteraction} interaction
     * @param {Object} utils
     */
    async execute(interaction, utils) {

        await utils.user.pause(false);
        await interaction.editReply({ 
            content: `Thanks for trying out Bot Brawler!\n-> If you want a guided walkthrough, try out \`/tutorial\`.\n-> If you would like a full list of commands, check out \`/commands\`.`,
            }).catch(e => { utils.consola.error(e)}).catch(e => { utils.consola.error(e)});
        return;

    }

}