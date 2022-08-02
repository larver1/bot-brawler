const dbAccess = require('./Database/dbAccess.js');

let args = process.argv.slice(2);
let userId = args[0];

dbAccess.findUser(null, userId).then(function(user)
{
    //133,15,15,15,99,sy,0,0,Headbutt,${uuidv4()},0,0,SORRY <3|
    user.paused = false;
    user.save();
});

