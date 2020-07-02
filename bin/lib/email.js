"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../config");
const nodemailer = require("nodemailer");
const smtpTransport = require("nodemailer-smtp-transport");
const ejs = require("ejs");
const path = require("path");
class EmailManager {
    static initTransport() {
        this.transporter = nodemailer.createTransport(smtpTransport({
            host: config_1.default.emailHost,
            port: config_1.default.emailPort,
            secure: false,
            auth: {
                user: config_1.default.emailUsername,
                pass: config_1.default.emailPass
            }
        }));
    }
    send(to, subject, template, data) {
        return new Promise((resolve, reject) => {
            ejs.renderFile(path.join(config_1.default.projectDir, 'src/views/email/' + template), data, {}, (err, res) => {
                if (err)
                    return reject(err);
                var mailOptions = {
                    to: to,
                    cc: 'archive@kasaptanal.com',
                    from: 'kasaptanAl.com <noreply@kasaptanal.com>',
                    subject: subject,
                    html: res
                };
                EmailManager.transporter.sendMail(mailOptions, (error, info) => {
                    // error ? reject(error) : resolve(info.response)
                });
                resolve();
            });
        });
    }
}
EmailManager.initTransport();
exports.default = (new EmailManager());