module.exports = {
    name: "botinfo",
    description: "View a Bot on the database (e.g. 'Bostrom M-00001').",
    required: true,
    type: "STRING",
    options: [{
        name: "name",
        description: "The bot's name (e.g. 'Constant').",
        required: true,
        type: "STRING"
    },
    {
        name: "modelno",
        description: "The bot's model number (e.g. 00004).",
        required: true,
        type: "STRING"
    }
],
    /***
     * @param {ContextMenuInteraction} interaction
     * @param {Object} utils
     */
    async execute(interaction, utils){
        
        await utils.user.pause(false);     

        const botToView = await utils.dbBots.findBotObjByName(interaction, 
            interaction.options.getString("name"),
            interaction.options.getString("modelno"));
        
        if(!botToView) {
            return;
        }

        let botHistory = botToView.botObj.logs.split("\n");
        botHistory = botHistory.slice(-10);
        botHistory = botHistory.join("\n");

        const card = await new utils.card(interaction, botToView);
        if(!await card.createCard())  {
            await utils.user.pause(false);
            return;
        } 

        await interaction.editReply({ 
            content: `Owner: \`${botToView.botObj.owner_username}\`\nOriginal owner: \`${botToView.botObj.owner_original_username}\`\nRecent History:\n${botHistory}`,
            files: [card.getCard()]})

    }
}