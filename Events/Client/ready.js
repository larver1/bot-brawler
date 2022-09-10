const consola = require("consola");
const { token, topgg } = require("../../config.json");
const { AutoPoster } = require('topgg-autoposter');

module.exports = {
    name: "ready",
    once: true,
     /**
     * Sets up client when ready is fired 
     * @param {Client} client
     */
    async execute(client) {
        const ap = AutoPoster(topgg, client);

        ap.on('posted', () => {
            console.log('Posted stats to Top.gg!');
        });

        consola.success("The client is now ready!");
        client.user.setActivity("PLAY NOW! /register /help", {type: "WATCHING"});
    }
}