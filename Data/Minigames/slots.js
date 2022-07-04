const { promisify } = require('util');
const sleep = promisify(setTimeout);
const { v4: uuidv4 } = require('uuid');
const { MessageActionRow, MessageButton } = require("discord.js");

const icons = [
    {
        "name": "bar",
        "emoji": "<:BAR:992735917687189514>",
        "value": 5,
    },
    {
        "name": "bell",
        "emoji": "<:BELL:992735919302000710>",
        "value": 10,
    },
    {
        "name": "horseshoe",
        "emoji": "<:HORSESHOE:992735926553956423>",
        "value": 15,
    },
    {
        "name": "heart",
        "emoji": "<:HEART:992735924775559168>",
        "value": 20,
    },
    {
        "name": "seven",
        "emoji": "<:SEVEN:992735929083121704>",
        "value": 25,
    },
    {
        "name": "diamond",
        "emoji": "<:DIAMOND:992735922896511006>",
        "value": 30,
    },
    {
        "name": "lemon",
        "emoji": "<:LEMON:992735927673819196>",
        "value": 3,
    },
    {
        "name": "watermelon",
        "emoji": "<:WATERMELON:992735930806964234>",
        "value": 5,
    },
    {
        "name": "cherries",
        "emoji": "<:CHERRIES:992735921168457819>",
        "value": 10,
    },
]

module.exports = {
    name: "slots",
    async execute(interaction, utils, level, difficulty, finishedEvent) {
        let selection = [];
        let msg = ``;
        let selectionIndex = 0;
        let selectId = uuidv4();
        let finished = false;
        let score = 0;
        let width = 3;
        let maxTime = 60;
        let currentTime;

        // Level determines how many rows
        switch(level[0]) {
            case "3 Rows":
                width = 3;
                break;
            case "5 Rows":
                width = 5;
                break;
            case "7 Rows":
                width = 7;
                break;
            default:
                break;
        }

        // Difficulty determines how much time allowed
        switch(difficulty) {
            case "Easy":
                maxTime = 60;
                break;
            case "Normal":
                maxTime = 30;
                break;
            case "Hard":
                maxTime = 20;
                break;
            default:
                break;
        }

        currentTime = maxTime;

        // Initialize icons to random
        for(let i = 0; i < width; i++) {
            selection[i] = Math.ceil(Math.random() * icons.length);
        }

        msg = this.getIcons(selection);

        const playButton = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId(selectId)
                .setLabel('Select')
                .setStyle('PRIMARY'),
        );

        const finishEmbed = new utils.embed(interaction, utils.user)
            .setTitle(`Slot Machine`)
            .setDescription(`Time left: \`${currentTime}\``)

        await interaction.editReply({ 
            content: `${msg}`,
            components: [playButton],
            embeds: [finishEmbed]
        }).catch((e) => utils.consola.error(e));

        const filter = i => (i.user.id === interaction.user.id && (i.customId == selectId));
        const collector = interaction.channel.createMessageComponentCollector({ filter });
        collector.on('collect', async i => {

            // Logic to permanently add icon
            await i.deferUpdate();

            selectionIndex++;              
            if(selectionIndex >= selection.length && !finished) {
                finished = true;
                collector.emit('end');
            }
        });

        collector.on('end', async () => {
            // Finishing message
            score = this.calcScore(selection);

            let parts = Math.floor((score / 20) + (currentTime / maxTime));

            switch(difficulty) {
                case "Normal":
                    parts *= 2;
                    break;
                case "Hard":
                    parts *= 3;
                    break;
                default:
                    break;
            } 

            finishedEvent.emit('finished', parts);

        });

        // Scroll through icons
        while(!finished) {
            selection = await this.cycleIcons(selection, selectionIndex);
            msg = this.getIcons(selection);
            finishEmbed.setDescription(`Time left: \`${currentTime}\``)

            await interaction.editReply({ 
                content: msg,
                embeds: [finishEmbed], 
            }).catch((e) => utils.consola.error(e));
            
            await sleep(1000);
            currentTime--;

            if(currentTime <= 0 && !finished) {
                finished = true;
                collector.emit('end');
            }
        }

    },
    async cycleIcons(selection, selectionIndex) {
        for(let i = selectionIndex; i < selection.length; i++) {
            selection[i] = selection[i] + 1 >= icons.length ? 1 : selection[i] + 1;
        }

        return selection;
    },
    getIcons(selection) {
        let msg = ``;
        for(let i = 0; i < selection.length; i++) {
            let icon = selection[i];
            switch(icon) {
                case 0:
                    msg += `⬛`;
                    break;
                default:
                    msg += icons[icon - 1].emoji;
                    break;
            }
        }

        return msg;
    },
    checkOccurrence(array, element) {
        let counter = 0;
        for (let i = 0; i <= array.length; i++) {
            if (array[i] == element) {
                counter++;
            }
        }

        return counter;
    },
    calcScore(selection) {
        let score = 0;

        for(let i = 0; i < icons.length; i++) {
            let occurrences = this.checkOccurrence(selection, i + 1);
            score += (5 * (occurrences > 0 ? occurrences - 1 : 0)) * icons[i].value;
        }

        return score;
    } 
}