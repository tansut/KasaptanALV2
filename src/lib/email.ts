import config from '../config';
import * as nodemailer from 'nodemailer';
import * as smtpTransport from 'nodemailer-smtp-transport';
import * as ejs from 'ejs';
import * as http from './http'
import * as path from 'path';
import Helper from './helper';


class EmailManager {
    static transporter: nodemailer.Transporter;

    static initTransport() {
        this.transporter = nodemailer.createTransport(smtpTransport({
            host: config.emailHost,
            port: config.emailPort,
            secure: false,
            auth: {
                user: config.emailUsername,
                pass: config.emailPass
            }
        }));

    }



    send(to: string, subject: string, template: string, data: { [key: string]: any }, reason: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (reason != 'error') return resolve();
            ejs.renderFile(path.join(config.projectDir, 'src/views/email/' + template), data, {

            }, (err, res) => {
                if (err) return reject(err);
                var mailOptions = {
                    to: (config.nodeenv == 'production' ? to: "tansuturkoglu@gmail.com"),
        
                    from: `KasaptanAl.com <${config.emailUsername}>`,
                    subject: subject,
                    html: res
                }

                EmailManager.transporter.sendMail(mailOptions, (error, info) => {
                    error && Helper.logError(error, null, null, false)
                });

                resolve()

            });

        })
    }

}

EmailManager.initTransport();

export default (new EmailManager());