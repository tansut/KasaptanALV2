import React, { useState } from 'react';
import ReactDOM from 'react-dom';

const e = React.createElement;
export default function SignupForm() {
    // Declare a new state variable, which we'll call "count"
    const [count, setCount] = useState(0);

    let handleSignIn = (e) => {
        e.preventDefault()
        let username = this.refs.username.value
        let password = this.refs.password.value
        //this.props.onSignIn(username, password)
    }

    return (

        <form className="needs-validation " autoComplete="off" noValidate onSubmit={handleSignIn}>
            <div className="form-group">
                <label htmlFor="su-email">Cep Telefonunuz</label>
                <input className="form-control" type="tel" id="phone" placeholder="05xxxxxxxxx" required />
                <div className="invalid-feedback">Lütfen cep telefonunuzu girin</div>
            </div>


            <button className="btn btn-primary btn-block btn-shadow" type="submit">Şifremi Gönder</button>
        </form>

    );
}

const domContainer = document.querySelector('#signupform');
ReactDOM.render(e(SignupForm), domContainer);

