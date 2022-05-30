const powerEmoji = `<:power:965731751009849406>`;
const lifespanEmoji = `<:lifespan:965731750510727228>`;
const viralEmoji = `<:Viral_v1:965943499801382983>`;
const firewallEmoji = `<:firewall:965731750795935844>`;

module.exports = {
    name: "train",
    description: "Train a card for more EXP.",
    /**
     * @param {CommandInteraction} CommandInteraction
     * @param {Object} executeObj
     */
    async execute(interaction, utils) {

        // Get user challenges
        let userChallenge = await utils.db.getData(interaction, "currentChallenge");
        if(!userChallenge) {
            return utils.handler.info(interaction, new Error(`You don't have any training battles available. Try using \`/daily\` to get some.`));
        }

        // Find each bot from their IDs
        let challengerBots = [];
        let msg = `You have \`${5 - utils.user.challengesComplete} daily training battles\` left.\nUse \`/battle train\` to battle one of them.\n\n`;

        for(const id of userChallenge) {
            let bot = await utils.dbBots.findBotObj(interaction, id);
            challengerBots.push(bot);
            msg += `${bot.findColour().emoji}\`${bot.name}\`\n${powerEmoji}\`${bot.battleStats.power}\`${lifespanEmoji}\`${bot.battleStats.lifespan}\`${viralEmoji}\`${bot.battleStats.viral}\`${firewallEmoji}\`${bot.battleStats.firewall}\`\n\n`;
        }

        msg += `\nYou will gain EXP for winning a training battle, but you will not lose anything if you are defeated.`;

        console.log(challengerBots);

        // Display challenges
        const embed = new utils.embed(interaction, utils.user)
            .setTitle(`Professor Diriski's Lab Training`)
            .setDescription(`${msg}`)

        await interaction.editReply({ embeds: [embed] })
            .catch(e => utils.consola.error(e));

        
    }
    

}