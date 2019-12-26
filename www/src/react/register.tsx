import * as React from 'react';
import ReactDOM from 'react-dom';
import Counter from './counter';
import PlacesList from "./placeslist"
import SignupForm from "./signup";
import { App } from '../lib/admin.app';

export default () => {
    App.ComponentMap["PlaceList"] = { class: PlacesList };
    App.ComponentMap["Counter"] = { class: Counter };
}

