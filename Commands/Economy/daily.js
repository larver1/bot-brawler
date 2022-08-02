const machinePartEmoji = "<:machine_parts:992728693799669801>";
const energyEmoji = "<:energy_v1:993195219224903832>";

module.exports = {
    name: "daily",
    description: "View your total number of Machine Parts.",
    /**
     * @param {CommandInteraction} CommandInteraction
     * @param {Object} executeObj
     */
    async execute(interaction, utils) {

        //Find hours since last daily
        let numHours = Math.abs(Date.now() - utils.user.daily) / 36e5;

        await utils.db.checkTutorial(interaction, "daily");

        //Displays amount of money
        if(numHours < 24) {
            await utils.user.pause(false);
            return interaction.editReply({ embeds: [ 
                new utils.embed(interaction, utils.user)
                    .setDescription(`You cannot claim your daily rewards yet. You can claim 24 hours after your last claim.\n\n⏰ \`${(24 - numHours).toFixed(2)} hours remaining\`.`)] })
                        .catch((e) => utils.consola.error(e));

        }

        //Daily command was successful
        let numParts = Math.ceil(Math.random() * 50) + 20;
        let numEnergy = 100;

        // Set new challenge
        let newChallenge = await utils.dbBots.setChallenge(interaction, utils.user.username, "Professor Diriski"); 
        if(!newChallenge)
            return;

        await utils.db.add(interaction, "currentChallenge", newChallenge);
        await utils.dbAchievements.setupTasks(interaction);

        await interaction.editReply({ embeds: [ 
            new utils.embed(interaction, utils.user)
                .setTitle(`${utils.user.username}, here are your daily rewards!`)
                .setDescription(`\`x${numParts}\` ${machinePartEmoji} Machine Parts!\n\`x${numEnergy}/100\` ${energyEmoji} Energy!\nYou got new \`/train\` challenges!\nYou got new daily \`/tasks\`!`)] })
                    .catch((e) => utils.consola.error(e));

        //Adds correct number of parts
        if(!await utils.db.add(interaction, "balance", numParts)) {
            await utils.user.pause(false);
            return;
        }
        //Adds correct number of energy
        if(!await utils.db.add(interaction, "energy", numEnergy)) {
            await utils.user.pause(false);
            return;
        }
        if(!await utils.db.remove(interaction, "challengesComplete"))  {
            await utils.user.pause(false);
            return;
        }
        
        //Resets daily to current time
        await utils.userFile.writeUserLog(utils.user.username, `collected their daily rewards.`);
        await utils.db.add(interaction, "daily");
        await utils.user.pause(false);

    }

}