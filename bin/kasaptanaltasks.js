"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tasksapp_1 = require("./tasksapp");
console.log('Booting tasks app ...');
setTimeout(() => {
    tasksapp_1.default().bootstrap().then(() => console.log('success-taks')).catch((err) => {
        console.log(err);
        process.exit(2);
    });
}, 30000);
