const machinePartEmoji = "<:machine_parts:992728693799669801>";
const energyEmoji = "<:energy_v1:993195219224903832>";

module.exports = {
    name: "rebuild",
    description: "Rebuild a destroyed Battle Bot.",
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
            
            let energyCost = 25;
            let moneyCost = 10 + Math.round(collection.selected.exp);

            moneyCost = 0;
            energyCost = 0;

            const deadCard = await new utils.card(interaction, collection.selected);
            if(!await deadCard.createCard()) {
                await utils.user.pause(false); 
                return;
            }

            await utils.messageHelper.confirmChoice(interaction, interaction.user, `Do you wish to rebuild your \`${collection.selected.name}\` for \`x${moneyCost}\` ${machinePartEmoji} Machine Parts and \`x${energyCost}\` ${energyEmoji} Energy?`, deadCard.getCard());
            utils.messageHelper.replyEvent.on(`accepted`, async() => {
                
                // Not enough energy
                if(utils.user.energy < energyCost) {
                    await utils.user.pause(false); 
                    return utils.handler.info(interaction, new Error(`You don't have enough ${energyEmoji} Energy to do this...`));
                }

                // Not enough parts
                if(utils.user.balance < moneyCost) {
                    await utils.user.pause(false); 
                    return utils.handler.info(interaction, new Error(`You don't have enough ${machinePartEmoji} Machine Parts to do this...`));
                }

                //Removes correct number of parts
                if(!await utils.db.remove(interaction, "balance", moneyCost)) {
                    await utils.user.pause(false); 
                    return;
                }

                //Removes correct number of energy
                if(!await utils.db.remove(interaction, "energy", energyCost)) {
                    await utils.user.pause(false); 
                    return;
                }

                //Revive and display
                await utils.dbBots.revive(interaction, collection.selected.botObj.bot_id);
                
                await utils.dbAchievements.checkTask(interaction, utils.user.username, "Mechanic");

                const card = await new utils.card(interaction, collection.selected);
                if(!await card.createCard()) {
                    await utils.user.pause(false); 
                    return;
                }

                await utils.user.pause(false); 
                await interaction.editReply({ 
                    files: [card.getCard()], 
                    content: `\`${collection.selected.name}\` was rebuilt for \`x${moneyCost}\` ${machinePartEmoji} Machine Parts and \`x${energyCost}\` ${energyEmoji} Energy`,
                    embeds: [],
                    components: []
                 }).catch(e => utils.consola.error(e));

            });

            await utils.user.pause(false);             
            utils.messageHelper.replyEvent.on(`rejected`, async() => {
                await interaction.editReply({ 
                    content: `The rebuild was cancelled...`,
                    components: [],
                    embeds: []    
                }).catch((e) => utils.consola.error(e));
            })

        });

    }

}