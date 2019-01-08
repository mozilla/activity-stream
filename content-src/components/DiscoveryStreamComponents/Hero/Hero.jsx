import React from "react";

export class Hero extends React.PureComponent {
  constructor(props) {
    super(props);

    console.log(this.props);
  }

  // TODO: Un-hardcode all these values
  render() {
    return (
      <div className={`ds-hero ds-hero-${this.props.style}`}>
        <div className="wrapper">
          <img src="https://placekitten.com/576/324"/>
          <div className="meta">
            <header>Lorem Ipsum</header>
            <p>Lorem ipsum dolor, sit amet consectetur adipisicing elit. Vel quod, adipisci culpa ad ex officia totam quas animi non esse in quaerat consectetur sint at veritatis! Voluptatibus incidunt quidem facere!</p>
            <p>Source</p>
          </div>
        </div>
      </div>
    );
  }
}

Hero.defaultProps = {
  style: `border`,
  items: 1
};
