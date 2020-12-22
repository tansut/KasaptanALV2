import moment = require('moment');

function Now() {
    let now = new Date();
    let res = moment(now).add(now.getTimezoneOffset(), 'minutes').add(3, 'hour');
    return res.toDate();
}

const nDate = new Date().toLocaleString('tr-TR', {
    timeZone: 'Europe/Istanbul'
  });

let n = Now();
let sn = new Date();
console.log(n);
console.log(sn);

