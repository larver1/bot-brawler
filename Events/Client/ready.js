const consola = require("consola");
const { dbAccess } = require("../../dbAccess");

module.exports = {
    name: "ready",
    once: true,
     /**  
     * @param {Client} client
     */
    execute(client) {
        consola.success("The client is now ready!");
        console.log(dbAccess);
        client.user.setActivity("Beep Boop", {type: "WATCHING"})
    }
}