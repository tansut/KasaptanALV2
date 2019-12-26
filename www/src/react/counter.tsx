import React, { Component } from 'react';

type Props = {
  initial: string;
}

export default class Counter extends React.Component<Props> {
  state = {
    count: this.props.initial ? parseInt(this.props.initial) : 0
  };


  componentDidMount() {

  }

  increment = () => {
    this.setState({
      count: (this.state.count + 1)
    });
  };

  decrement = () => {
    this.setState({
      count: (this.state.count - 1)
    });
  };

  render() {
    return (
      <div>
        <h1>{this.state.count}</h1>
        <button onClick={this.increment}>Increment</button>
        <button onClick={this.decrement}>Decrement</button>
      </div>
    );
  }
}