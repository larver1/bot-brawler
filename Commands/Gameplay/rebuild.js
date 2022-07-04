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
        await collection.inspectCollection(interaction, 1);

        //When a card is selected, display it
        collection.selectedEvent.on(`selected`, async () => {
            
            let energyCost = 25;
            let moneyCost = 10 + Math.round(collection.selected.exp);

            const deadCard = await new utils.card(interaction, collection.selected);
            if(!await deadCard.createCard())
                return;

            await utils.messageHelper.confirmChoice(interaction, interaction.user, `Do you wish to rebuild your \`${collection.selected.name}\` for \`x${moneyCost} ${machinePartEmoji} Machine Parts\` and \`x${energyCost} Energy\`?`, deadCard.getCard());
            utils.messageHelper.replyEvent.on(`accepted`, async() => {
                
                // Not enough energy
                if(utils.user.energy < energyCost) {
                    return utils.handler.info(interaction, new Error(`You don't have enough ${energyEmoji} Energy to do this...`));
                }

                // Not enough parts
                if(utils.user.balance < moneyCost) {
                    return utils.handler.info(interaction, new Error(`You don't have enough ${machinePartEmoji} Machine Parts to do this...`));
                }

                //Removes correct number of parts
                if(!await utils.db.remove(interaction, "balance", moneyCost))
                    return;

                //Removes correct number of energy
                if(!await utils.db.remove(interaction, "energy", energyCost))
                    return;

                //Revive and display
                await utils.dbBots.revive(interaction, collection.selected.botObj.bot_id);
                const card = await new utils.card(interaction, collection.selected);
                if(!await card.createCard())
                    return;

                await interaction.editReply({ 
                    files: [card.getCard()], 
                    content: `\`${collection.selected.name}\` was rebuilt for \`x${moneyCost} ${machinePartEmoji} Machine Parts\` and \`x${energyCost} ${energyEmoji} Energy\``,
                    embeds: [],
                    components: []
                 }).catch(e => utils.consola.error(e));

            });

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