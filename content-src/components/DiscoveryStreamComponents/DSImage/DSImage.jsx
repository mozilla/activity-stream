import React from "react";

export class DSImage extends React.PureComponent {
  constructor(props) {
    super(props);
  }

  // Change the image URL to request a size tailored for the parent container width
  reformatImageURL(url, width) {
    // Determine if URL matches Thumbor spec
    // https://thumbor.readthedocs.io/en/latest/usage.html
    if (url && width && url.match(/&resize=[^&]*/)) {
      url = url.replace(/&resize=[^&]*/, `&resize=w${width}`);
    }

    return url;
  }

  componentDidMount() {
    this.setState({
      parentContainerWidth: ReactDOM.findDOMNode(this).parentNode.clientWidth
    });
  }

  render() {
    const classNames = `ds-image${this.props.extraClassNames ? ` ${this.props.extraClassNames}` : ``}`;

    let element;
    let source;

    if (this.state && this.state.parentContainerWidth) {
      console.log(`parentContainerWidth is defined: ${this.state.parentContainerWidth}`);
      source = this.reformatImageURL(this.props.source, this.state.parentContainerWidth);
    }

    if (this.props.asBackground) {
      element = (
        <div className={classNames} style={{border: `1px solid red`, backgroundImage: `url(${source})`}} />
      )
    } else {
      element = (
        <img className={classNames} src={source} />
      )
    }

    return element;
  }
}

DSImage.defaultProps = {
  extraClassNames: null,
  asBackground: false
}

/*

TODO:

- switch over to Picture element
- detect retina and use 1x if not present
- force jpeg (?)
- enable lazy loading
- memoize images so that smaller versions aren't fetched unnecissarily

*/
