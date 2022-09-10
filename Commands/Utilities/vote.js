module.exports = {
    name: "vote",
    description: "Vote for the bot and reset your energy!",
    /***
     * @param {CommandInteraction} interaction
     * @param {Object} utils
     */
    async execute(interaction, utils) {

        await utils.user.pause(false);

        let timeSinceLastVote = Date.now() - utils.user.voteTime;
        let numHours = timeSinceLastVote / 36e5;

        if(numHours < 12)
        {
            await interaction.editReply({ 
                content: `You only just voted \`${numHours.toFixed(1)} hours ago\`. You may vote once every 12 hours.`,
                }).catch(e => { utils.consola.error(e)}).catch(e => { utils.consola.error(e)});
            return;
        } else 
        {
            await interaction.editReply({ 
                content: `You can vote for the bot using this link: https://top.gg/bot/920035616060751932/vote`,
                }).catch(e => { utils.consola.error(e)}).catch(e => { utils.consola.error(e)});
            return; 
        }

    }

}