import * as express from "express";

export default class Middleware {

    constructor(protected app: express.IRouter) {

    }
}