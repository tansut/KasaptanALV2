import * as common from './common';
import config from '../config';
import * as nodemailer from 'nodemailer';
import * as smtpTransport from 'nodemailer-smtp-transport';
import * as ejs from 'ejs';
import * as http from './http'
import * as path from 'path';


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



    send(to: string, subject: string, template: string, data?: { [key: string]: any }): Promise<any> {
        return new Promise((resolve, reject) => {
            ejs.renderFile(path.join(config.projectDir, 'src/views/email/' + template), data, {

            }, (err, res) => {
                if (err) return reject(err);
                var mailOptions = {
                    to: to,
                    from: 'Kasap Burada <noreply@kasaptanal.com>',
                    subject: subject,
                    html: res
                }
                EmailManager.transporter.sendMail(mailOptions, (error, info) => {
                    // error ? reject(error) : resolve(info.response)
                });

                resolve()

            });

        })
    }

}

EmailManager.initTransport();

export default (new EmailManager());