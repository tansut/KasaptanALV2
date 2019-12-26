import { App } from "../lib/admin.app"
import { Backend } from "../lib/backend"
import React, { Component } from 'react';

export default class PlacesList extends React.Component {
    state = {
        data: [],
        q1: '',
        q2: '',
        addresult: null
    }

    handleChange = event => {
        this.setState({ q1: event.target.value });
    }

    handleChange2 = event => {
        this.setState({ q2: event.target.value });
    }

    handleSubmit = event => {
        event.preventDefault();
        this.doSearch()
    }

    doSearch() {
        Backend.get(`butcher/googlesearch`, { q: this.state.q1 + ' ' + this.state.q2 })
            .then(res => {
                const data = res.data;
                this.setState({ data: data });
            })
    }

    componentDidMount() {


    }

    handleAdd = (event, place_id) => {
        event.target.innerText = "ekleniyor ...";
        ((event) => {
            Backend.post(`butcher/googlesync`, { place_id: place_id })
                .then(res => {
                    this.setState({
                        addresult: res
                    })
                    event.target.innerText = "Eklendi"
                    //window.location.href = "/pages/admin/butcher/" + res.slug
                    //window.location.href = "/" + res.slug
                })
        })(event)

    }

    render() {
        return (
            <div>
                <form onSubmit={this.handleSubmit}>
                    <div className="row">
                        <div className="col-md-6">
                            <input type="text" onChange={this.handleChange2} className="form-control" id="firstName" placeholder="bulmak istediğiniz kasap" required></input>
                        </div>
                        <div className="col-md-6">
                            <input type="text" onChange={this.handleChange} className="form-control" id="firstName" placeholder="nerede"></input>

                        </div>
                    </div>
                    <hr className="mb-4"></hr>
                    <button className="btn btn-primary btn-lg btn-block" type="submit">Arama Yap</button>
                    {
                        this.state.addresult ?
                            <div>

                                <a onClick={event => this.setState({ addresult: null })} href={`/pages/admin/butcher/${this.state.addresult.slug}`} target="_blank">Eklendi, düzenlemek için tıkla: {this.state.addresult.slug}</a>
                            </div>

                            : null
                    }
                    <hr className="mb-4"></hr>

                </form>
                {
                    this.state.data.length > 0 ?
                        <div className="mt-2">
                            {this.state.data.map((d, i) =>
                                <div className="rounded border mb-2 py-2 shadow-sm border-light row" key={d.place_id}>
                                    <div className="col-md-9 themed-grid-col">
                                        <h4 >{d.name}</h4>
                                        <p>{d.formatted_address}</p>
                                    </div>

                                    <div className="col-md-3 themed-grid-col"><button className="btn btn-secondary btn-block" onClick={event => this.handleAdd(event, d.place_id)}>Aktar ve Düzenle</button></div>
                                </div>)}
                        </div> : null
                }
            </div >

        )
    }
}

