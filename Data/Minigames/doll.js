const Doll = require('../Minigames/Assets/Doll.js'); 
const { MessageActionRow, MessageButton } = require('discord.js');
const { v4: uuidv4 } = require('uuid');

const requirements = ["cute", "tough", "creepy", "fashionable"];

const parts = {
    "head": [{
        "cute": 0,
        "tough": 0,
        "creepy": 0,
        "fashionable": 10
    },
    {
        "cute": 0,
        "tough": 10,
        "creepy": 5,
        "fashionable": 0,
    },
    {
        "cute": 10,
        "tough": 0,
        "creepy": 5,
        "fashionable": 0,
    }],
    "body": [{
        "cute": 0,
        "tough": 10,
        "creepy": 0,
        "fashionable": 5
    },
    {
        "cute": 0,
        "tough": 0,
        "creepy": 10,
        "fashionable": 0,
    },
    {
        "cute": 5,
        "tough": 0,
        "creepy": 0,
        "fashionable": 10,
    }],
    "legs": [{
        "cute": 5,
        "tough": 0,
        "creepy": 0,
        "fashionable": 0
    },
    {
        "cute": 0,
        "tough": 0,
        "creepy": 10,
        "fashionable": 0,
    },
    {
        "cute": 0,
        "tough": 5,
        "creepy": 0,
        "fashionable": 5,
    }],
}

module.exports = {
    name: "doll",
    async execute(interaction, utils, level, difficulty, finishedEvent) {

        let chosenHead = Math.ceil(Math.random() * 3);
        let chosenBody = Math.ceil(Math.random() * 3);
        let chosenLegs = Math.ceil(Math.random() * 3);
        let headId = uuidv4();
        let bodyId = uuidv4();
        let legsId = uuidv4();
        let finishId = uuidv4();
        let turns = 10;
        
        let stats = {
            "cute": 0,
            "tough": 0,
            "creepy": 0,
            "fashionable": 0
        }

        switch(difficulty) {
            case "Easy":
                turns = 10;
                break;
            case "Normal":
                turns = 8;
                break;
            case "Hard":
                turns = 5;
                break;
            default:
                turns = 10;
                break;
        }

        let firstRequirement, secondRequirement, prohibitedRequirement;

        switch(level) {
            case "Fussy":
                firstRequirement = requirements[Math.floor(Math.random() * requirements.length)];
                while(!secondRequirement || firstRequirement == secondRequirement)
                    secondRequirement = requirements[Math.floor(Math.random() * requirements.length)];
                break;
            case "Exquisite":
                firstRequirement = requirements[Math.floor(Math.random() * requirements.length)];
                while(!prohibitedRequirement || firstRequirement == prohibitedRequirement)
                    prohibitedRequirement = requirements[Math.floor(Math.random() * requirements.length)];
                break;
            case "Simple":
            default:
                firstRequirement = requirements[Math.floor(Math.random() * requirements.length)];
                break;
        }

        stats = this.pickNewPart("head", chosenHead, stats, true);
        stats = this.pickNewPart("body", chosenBody, stats, true);
        stats = this.pickNewPart("legs", chosenLegs, stats, true);

        // Draw doll on screen
        let doll = new Doll(interaction, chosenHead, chosenBody, chosenLegs);
        if(!await doll.createDoll())
            return;

        const Start = new utils.embed(interaction, utils.user)
            .setTitle(`Doll House`)
            .setDescription(`Constant: Hey, I need a new playmate. Make me a \`${firstRequirement}\` doll. ${secondRequirement ? `Oh, can you also make it \`${secondRequirement}\`?` : ``}${prohibitedRequirement ? `Also, if you make it \`${prohibitedRequirement}\`, there will be consequences ❤️` : ``}\n\nTurns left: \`${turns}\``)

        const HeadButton = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId(headId)
                .setLabel('Change Head')
                .setStyle('SECONDARY')
                .setEmoji(`➡️`),
        );
      
        const BodyButton = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId(bodyId)
                .setLabel('Change Body')
                .setStyle('SECONDARY')
                .setEmoji(`➡️`),
        );
        
        const LegsButton = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId(legsId)
                .setLabel('Change Legs')
                .setStyle('SECONDARY')
                .setEmoji(`➡️`),
        );

        const FinishButton = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId(finishId)
                .setLabel('Finish')
                .setStyle('DANGER'),
        );

        await interaction.editReply({ 
            content: ` `,
            embeds: [Start],
            files: [doll.getImage()],
            components: [HeadButton, BodyButton, LegsButton, FinishButton]
        }).catch((e) => utils.consola.error(e));

        const filter = i => (i.user.id === interaction.user.id && (i.customId == headId || i.customId == bodyId || i.customId == legsId || i.customId == finishId));
        const collector = interaction.channel.createMessageComponentCollector({ filter,  time: 600000, errors: ['time'] });
        
        collector.on('collect', async i => {
            await i.deferUpdate().catch(e => utils.consola.error(e));

            if(turns <= 0) {
                collector.emit('end');
                return;
            }

            // Different behaviour depending on button press
            switch(i.customId) {
                case finishId:
                    collector.emit('end');
                    return;
                case headId:
                    stats = this.pickNewPart("head", chosenHead, stats);
                    chosenHead = chosenHead < 3 ? chosenHead + 1 : 1;
                    break;
                case bodyId:
                    stats = this.pickNewPart("body", chosenBody, stats);
                    chosenBody = chosenBody < 3 ? chosenBody + 1 : 1;
                    break;
                case legsId:
                    stats = this.pickNewPart("legs", chosenLegs, stats);
                    chosenLegs = chosenLegs < 3 ? chosenLegs + 1 : 1;
                    break;
                default:
                    break;
            }

            // Decrease turns and display
            turns--;
            Start.setDescription(`Constant: Hey, I need a new playmate. Make me a \`${firstRequirement}\` doll. ${secondRequirement ? `Oh, can you also make it \`${secondRequirement}\`?` : ``}${prohibitedRequirement ? `Also, if you make it \`${prohibitedRequirement}\`, there will be consequences ❤️` : ``}\n\nTurns left: \`${turns}\``)

            // Update doll parts
            doll.head = chosenHead;
            doll.body = chosenBody;
            doll.legs = chosenLegs;

            await doll.createDoll();
            await interaction.editReply({ 
                embeds: [Start],
                files: [doll.getImage()],
            }).catch((e) => utils.consola.error(e));

        });

        collector.on('end', async () => {

            let finalScore = 0;
            finalScore += stats[firstRequirement];
            if(secondRequirement)
                finalScore += stats[secondRequirement];
            if(prohibitedRequirement)
                finalScore -= stats[prohibitedRequirement];
            
            let won = finalScore < 15 ? false : true;
                
            finalScore *= 10;
            let parts = (finalScore / 50) + (turns * 2);

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

            switch(level) {
                case "Fussy":
                    parts *= 2;
                    break;
                case "Exquisite":
                    parts *= 3;
                    break;
                default:
                    break;
            }

            if(finalScore <= 0) {
                await utils.dbAchievements.checkTask(interaction, utils.user.username, "Spoilt Brat");
            }

            finishedEvent.emit('finished', { parts: parts, won: won });
        });

    },
    pickNewPart(partName, number, stats, initialise) {

        let index = Math.max(0, number - 1);

        if(!initialise) {
            stats["cute"] -= parts[partName][index]["cute"];
            stats["tough"] -= parts[partName][index]["tough"];
            stats["creepy"] -= parts[partName][index]["creepy"];
            stats["fashionable"] -= parts[partName][index]["fashionable"];    
        
            number = number < 3 ? number + 1 : 1;
            index = Math.max(0, number - 1);
        
        }

        stats["cute"] += parts[partName][index]["cute"];
        stats["tough"] += parts[partName][index]["tough"];
        stats["creepy"] += parts[partName][index]["creepy"];
        stats["fashionable"] += parts[partName][index]["fashionable"];

        return stats;
    }

}