const consola = require("consola");

module.exports = {
    name: "ready",
    once: true,
     /**
     * Sets up client when ready is fired 
     * @param {Client} client
     */
    async execute(client) {

        consola.success(`Logged in as ${client.user.tag}!`);
        client.user.setActivity("PLAY NOW! /register /help", {type: "WATCHING"});
    }
}