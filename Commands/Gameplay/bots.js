module.exports = {
    name: "bots",
    description: "Check all of your bots.",
    usage: "`/bots exp` allows you to sort your Bots by EXP.\n`/bots destroyed` allows you to view all of your destroyed Bots.\n`/bots name` allows you to filter your Bots by name.",
    options: [{
        name: "exp",
        description: "Sorts your bot collection based on EXP.",
        required: false,
        type: "STRING",
        choices: [
            {
                name: "Highest",
                value: "highest",
            }, 
            {
                name: "Lowest",
                value: "lowest",
            },
        ]
    },
    {
        name: "destroyed",
        description: "Filters your bot collection to show dead/destroyed bot.",
        required: false,
        type: "BOOLEAN",
    },
    {
        name: "name",
        description: "Filters your bot collection based on Bot Name.",
        required: false,
        type: "STRING",
    }],
    /**
     * @param {CommandInteraction} CommandInteraction
     * @param {Object} executeObj
     */
    async execute(interaction, utils) {

        let bots = await utils.user.getBots();
        let showDead = await interaction.options.getBoolean("destroyed");
        let collection = await new utils.botCollection(bots, interaction, showDead);
        
        //Filter parameters
        collection.filterCollection({
            destroyed: showDead,
            bot_type: interaction.options.getString("name"),
            specificLevel: interaction.options.getInteger("level"),
        });

        //Sort parameters
        collection.sortCollection({
            exp: interaction.options.getString("exp"),
        });

        //Inspect the collection
        if(!await collection.inspectCollection(interaction, utils.user)) {
            await utils.user.pause(false);
            return;
        }

        //When a card is selected, display it
        collection.selectedEvent.on(`selected`, async () => {
            const card = await new utils.card(interaction, collection.selected);
            
            if(!await card.createCard())  {
                await utils.user.pause(false);
                return;
            } 

            let msg = `*${collection.selected.obj.ability}:* ${collection.selected.obj.abilityDescription}`;

            if(collection.selected.botObj.powerBoost > 0)
                msg += `\nBonus Power: ${collection.selected.botObj.powerBoost}`;
            if(collection.selected.botObj.lifespanBoost > 0)
                msg += `\nBonus Lifespan: ${collection.selected.botObj.lifespanBoost}`;
            if(collection.selected.botObj.viralBoost > 0)
                msg += `\nBonus Viral: ${collection.selected.botObj.viralBoost}`;
            if(collection.selected.botObj.firewallBoost > 0)
                msg += `\nBonus Firewall: ${collection.selected.botObj.firewallBoost}`;

            await utils.user.pause(false);
            await interaction.editReply({ 
                files: [card.getCard()],
                content: msg })
            .catch(e => utils.consola.error(e));

            return;

        });

    }

}