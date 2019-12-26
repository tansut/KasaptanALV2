import { Auth } from '../../lib/common';
import { ApiRouter } from '../../lib/router';
import * as express from "express";
import * as maps from "@google/maps"
import Butcher from '../../db/models/butcher';
import moment = require('moment');
import { ValidationError } from '../../lib/http';

export default class Route extends ApiRouter {




    static SetRoutes(router: express.Router) {

    }
}

