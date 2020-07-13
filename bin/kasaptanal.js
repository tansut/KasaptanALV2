"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
console.log('Booting app ...');
app_1.default().bootstrap().then(() => console.log('success')).catch((err) => {
    console.log(err);
    process.exit(2);
});
