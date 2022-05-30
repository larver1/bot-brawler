module.exports = {
    name: "balance",
    description: "View your total number of Machine Parts.",
    /**
     * @param {CommandInteraction} CommandInteraction
     * @param {Object} executeObj
     */
    async execute(interaction, utils) {

        //Displays amount of money
        if(utils.user)
            return interaction.editReply({ embeds: [ 
                new utils.embed(interaction, utils.user)
                    .setDescription(`Machine Parts: \`${utils.user.balance}\`\nEnergy: \`${utils.user.energy}/100\`\n\nGet more resources with \`/daily\``)] })
                        .catch((e) => utils.consola.error(e));

    }

}