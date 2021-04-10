"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../config");
const nodemailer = require("nodemailer");
const smtpTransport = require("nodemailer-smtp-transport");
const ejs = require("ejs");
const path = require("path");
const helper_1 = require("./helper");
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
                    to: (config_1.default.nodeenv == 'production' ? to : "tansuturkoglu@gmail.com"),
                    from: 'KasaptanAl.com <noreply2@kasaptanal.com>',
                    subject: subject,
                    html: res
                };
                EmailManager.transporter.sendMail(mailOptions, (error, info) => {
                    error && helper_1.default.logError(error, null, null, false);
                });
                resolve();
            });
        });
    }
}
EmailManager.initTransport();
exports.default = (new EmailManager());
