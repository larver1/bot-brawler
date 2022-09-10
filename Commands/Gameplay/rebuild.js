const machinePartEmoji = "<:machine_parts:992728693799669801>";

module.exports = {
    name: "rebuild",
    description: "Rebuild a destroyed Bot.",
    /**
     * @param {CommandInteraction} CommandInteraction
     * @param {Object} executeObj
     */
    async execute(interaction, utils) {

        let bots = await utils.user.getBots();
        let collection = await new utils.botCollection(bots, interaction, true);
        
        //Sort parameters
        collection.sortCollection({
            exp: interaction.options.getString("exp"),
        });

        //Inspect the collection
        if(!await collection.inspectCollection(interaction, utils.user, 1)) {
            await utils.user.pause(false);
            return;
        }

        //When a card is selected, display it
        collection.selectedEvent.on(`selected`, async () => {
            
            let moneyCost = 10 + (Math.round(collection.selected.exp) * 2);

            const deadCard = await new utils.card(interaction, collection.selected);
            if(!await deadCard.createCard()) {
                await utils.user.pause(false); 
                return;
            }

            await utils.messageHelper.confirmChoice(interaction, interaction.user, `Do you wish to rebuild your \`${collection.selected.name}\` for \`x${moneyCost}\` ${machinePartEmoji} Machine Parts?`, deadCard.getCard());
            utils.messageHelper.replyEvent.on(`accepted`, async() => {
                
                // Not enough parts
                if(utils.user.balance < moneyCost) {
                    await utils.user.pause(false); 
                    return utils.handler.info(interaction, new Error(`You don't have enough ${machinePartEmoji} Machine Parts to do this...`));
                }

                // Removes correct number of parts
                if(!await utils.db.remove(interaction, "balance", moneyCost)) {
                    await utils.user.pause(false); 
                    return;
                }

                // Revive and display
                await utils.dbBots.revive(interaction, collection.selected.botObj.bot_id);
                
                await utils.dbAchievements.checkTask(interaction, utils.user.username, "Mechanic");

                const card = await new utils.card(interaction, collection.selected);
                if(!await card.createCard()) {
                    await utils.user.pause(false); 
                    return;
                }
                
                await utils.userFile.writeUserLog(utils.user.username, `rebuilt their destroyed ${collection.selected.bot_type.toUpperCase()} with ID ${collection.selected.botObj.bot_id} for ${moneyCost} parts.`);
                await utils.dbBots.addLogs(interaction, collection.selected.botObj.bot_id, `was rebuilt for x${moneyCost} Machine Parts.`);

                await utils.user.pause(false); 
                await interaction.editReply({ 
                    files: [card.getCard()], 
                    content: `\`${collection.selected.name}\` was rebuilt for \`x${moneyCost}\` ${machinePartEmoji} Machine Parts.`,
                    embeds: [],
                    components: []
                 }).catch(e => utils.consola.error(e));

            });
            
            utils.messageHelper.replyEvent.on(`rejected`, async() => {
                await utils.user.pause(false);      
                await interaction.editReply({ 
                    content: `The rebuild was cancelled...`,
                    components: [],
                    embeds: []    
                }).catch((e) => utils.consola.error(e));
            })

        });

    }

}