const { Client, MessageEmbed, MessageActionRow, MessageSelectMenu, MessageButton } = require("discord.js");
const BotBuilder = require("../../Helpers/BotBuilder");
const BotObj = require("../../Data/Bots/BotObj");
const BotCollection = require("../../Helpers/BotCollection");

module.exports = {
    name: "battle",
    description: "Battle your bot with another player.",
    options: [{
        name: "user",
        description: "Battle with another user on the server.",
        required: false,
        type: "SUB_COMMAND",
        options: [{
            name: "user",
            description: "Mention the person's @tag.",
            required: true,
            type: "USER"
        },
        {
            name: "wager",
            description: "Choose the wager involved.",
            required: true,
            type: "STRING",
            choices: [{
                name: "Destroy",
                value: "destroy"
            },
            {
                name: "Collect",
                value: "collect"
            },
            {
                name: "Damage",
                value: "damage"
            },
            {
                name: "Friendly",
                value: "friendly"
            }
            ]
        },
        ]
    }],
    /**
     * @param {CommandInteraction} CommandInteraction
     * @param {Object} executeObj
     */
    async execute(interaction, utils) {

        let bots = await utils.user.getBots();
        let collection = await new BotCollection(bots, interaction);
        const otherUser = await utils.db.findUser(interaction, interaction.options.getUser("user").id);

        if(!collection || !otherUser)
            return;

        let otherBots = await otherUser.getBots();
        let otherCollection = await new BotCollection(otherBots, interaction);

        //Inspect the collection
        await collection.inspectCollection(interaction, 1);

        //When a card is selected, display it
        collection.selectedEvent.on(`selected`, async () => {

            let yourBot = collection.selected;
            const yourCard = await new utils.card(interaction, yourBot);

            await interaction.editReply({ content: ``, files: [yourCard.getCard()] })
                .catch(e => utils.consola.error(e));

            await otherCollection.inspectCollection(interaction, 1);

            otherCollection.selectedEvent.on(`selected`, async() => {

                let otherBot = otherCollection.selected;
                const otherCard = await new utils.card(interaction, otherBot);

                console.log(`first bot selected: ${yourBot.botObj.bot_id}`);
                console.log(`second bot selected: ${otherBot.botObj.bot_id}`);

                let results = await yourBot.battle(otherBot);
                let msg = `Your ${yourBot.bot_type} has a ${results.yourPercent}% chance of winning.\nOpponent ${otherBot.bot_type} has a ${results.otherPercent}% chance of winning.\n${results.winner <= results.yourPercent ? yourBot.bot_type + " is the winner" : yourBot.bot_type + " is the loser"}`;
                let wager = interaction.options.getString("wager");
                let loserBot, winnerBot, loserUser, winnerUser, exp;

                //Determine winner
                if(results.winner <= results.yourPercent){
                    winnerBot = yourBot;
                    winnerUser = utils.user;
                    loserBot = otherBot;
                    loserUser = otherUser;
                } else {
                    loserBot = yourBot;
                    loserUser = utils.user;
                    winnerBot = otherBot;
                    winnerUser = otherUser;
                }

                switch(wager) {
                    case "destroy":
                        //Loser bot is destroyed and is no longer usable
                        msg += `\nLoser bot gets destroyed by winner for EXP.`;
                        exp = Math.ceil(loserBot.exp);
                        if(!await utils.dbBots.addExp(interaction, winnerBot.botObj.bot_id, exp + 1))
                            return;
                        if(!await utils.dbBots.destroy(interaction, loserBot.botObj.bot_id))
                            return;
                        break;
                    case "collect":
                        //The loser bot owner changes to winner username
                        msg += `\nLoser bot gets collected by winner.`;
                        if(!await utils.dbBots.changeOwner(interaction, loserBot.botObj.bot_id, winnerUser.username))
                            return;
                        break;
                    case "damage":
                        //Pass EXP over to winner
                        msg += "\nLoser bot gives winner bot some EXP.";
                        exp = Math.ceil(loserBot.exp / 5);

                        if(exp == 0) 
                            msg += "\nLoser had no EXP left to give, so was destroyed for scrap metal...";

                        if(!await utils.dbBots.removeExp(interaction, loserBot.botObj.bot_id, exp)) 
                            return;
                        if(!await utils.dbBots.addExp(interaction, winnerBot.botObj.bot_id, exp + 1))
                            return;
                        break;
                    case "friendly":
                        msg += "\nThe bots shake hands and go their separate ways.";
                        break;
                    default:
                        break;
                }

                await interaction.editReply({ content: msg });

            });

        });

    }

}