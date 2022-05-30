module.exports = {
    name: "daily",
    description: "View your total number of Machine Parts.",
    /**
     * @param {CommandInteraction} CommandInteraction
     * @param {Object} executeObj
     */
    async execute(interaction, utils) {

        //Find hours since last drop
        let numHours = Math.abs(Date.now() - utils.user.daily) / 36e5;

        numHours = 25;

        //Displays amount of money
        if(numHours < 24)
            return interaction.editReply({ embeds: [ 
                new utils.embed(interaction, utils.user)
                    .setDescription(`You cannot claim your daily rewards yet. You can claim 24 hours after your last claim.\n\n⏰ **${(24 - numHours).toFixed(2)} hours remaining**...`)] })
                        .catch((e) => utils.consola.error(e));

        //Daily command was successful
        let numParts = Math.ceil(Math.random() * 50) + 20;
        let numEnergy = 100;

        // Set new challenge
        let newChallenge = await utils.dbBots.setChallenge(interaction, utils.user.username, "Professor Diriski");
        await utils.db.add(interaction, "currentChallenge", newChallenge);
        console.log(newChallenge);

        await interaction.editReply({ embeds: [ 
            new utils.embed(interaction, utils.user)
                .setTitle(`${utils.user.username}, here are your daily rewards!`)
                .setDescription(`\`x${numParts}\` Machine Parts!\n\`x${numEnergy}/100\` Energy!\nYou got new \`/train\` challenges!`)] })
                    .catch((e) => utils.consola.error(e));

        //Adds correct number of parts
        if(!await utils.db.add(interaction, "balance", numParts))
            return;
        //Adds correct number of energy
        if(!await utils.db.add(interaction, "energy", numEnergy))
            return;
        if(!await utils.db.remove(interaction, "challengesComplete"))
            return;
        
        //Resets daily to current time
        await utils.db.add(interaction, "daily");

    }

}