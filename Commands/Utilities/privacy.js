const { Client, MessageEmbed } = require("discord.js");
const { Users } = require('../../Database/dbObjects');

const privacySettings = {
    "public": "Anyone with your username can send battle/trade requests. Your username can appear in the global leaderboard.",
    "moderate": "Only friends can send you battle/trade requests. But your username will appear in the global leaderboard.",
    "private": "Only friends can send battle/trade requests. Your username will not appear in the global leaderboard.",
    "locked": "You will not receive any requests, this means that the bot will be unable to DM you and you will be locked out of most commands until this setting is changed."
}

module.exports = {
    name: "privacy",
    description: "Manage your privacy settings in the bot.",
    options: [ 
        {
            name: "options",
            description: "View the privacy options available.",
            type: "SUB_COMMAND",
        },
        {
            name: "set",
            description: "Set your privacy level.",
            type: "SUB_COMMAND",
            options: [{
                name: "level",
                description: "Select a privacy level.",
                required: true,
                type: "STRING",
                choices: [
                    {
                        name: "Public",
                        value: "public",
                    }, 
                    {
                        name: "Moderate",
                        value: "moderate",
                    },
                    {
                        name: "Private",
                        value: "private", 
                    },
                    {
                        name: "Locked",
                        value: "locked"
                    }
                ]
            }],
    }],
    /**
     * @param {CommandInteraction} CommandInteraction
     * @param {Object} executeObj
     */
    async execute(interaction, utils) {
        let privacyLevel = interaction.options.getString("level"); 

        //If they didn't select a privacy level, display all of them
        if(!privacyLevel)
            return interaction.editReply({ embeds: [
                new utils.embed(interaction, utils.user)
                    .setTitle(`${utils.user.username}'s Privacy Settings`)
                    .setDescription(`Your privacy setting is \`${utils.user.privacy}\`.\n\n**Public:** ${privacySettings["public"]}\n\n**Moderate:** ${privacySettings["moderate"]}\n\n**Private:** ${privacySettings["private"]}\n\n**Locked:** ${privacySettings["locked"]}`)] })
                        .catch((e) => utils.consola.error(e));

        //Cancel if privacy level is the same
        if(privacyLevel == utils.user.privacy)
            return utils.handler.info(interaction, new Error(`Your privacy setting is already set to \`${utils.user.privacy}\`.\n${privacySettings[utils.user.privacy]}`)); 

        //Change the privacy level
        if(!await utils.db.add(interaction, "privacy", privacyLevel))
            return;

        //Display changed privacy level
        return interaction.editReply({ embeds: [
            new utils.embed(interaction, utils.user)
                .setTitle(`${utils.user.username}'s Privacy Settings`)
                .setDescription(`Your privacy settings have been changed to \`${privacyLevel}\`.\n\n${privacySettings[privacyLevel]}`)] })
                    .catch((e) => utils.consola.error(e));
            
    }
}