import {cache} from "./cache";
import React from "react";
import ReactDOM from "react-dom";

export class DSImage extends React.PureComponent {
  reformatImageURL(url, width) {
    // Change the image URL to request a size tailored for the parent container width
    // Also: force JPEG, quality 60, no upscaling, no EXIF data
    // Uses Thumbor: https://thumbor.readthedocs.io/en/latest/usage.html
    let image = `https://pocket-image-cache.com/${width}x0/filters:format(jpeg):quality(60):no_upscale():strip_exif()/${encodeURIComponent(url)}`;

    // Use Mozilla CDN:
    return encodeURI(`https://img-getpocket.cdn.mozilla.net/direct?url=${image}`);
  }

  measureElementWidth() {
    let width = ReactDOM.findDOMNode(this).clientWidth;

    // Quirk: Whenever the `Network` tab is open in devtools this is sometimes too large (eg: resolves to window width)
    // This will keep it from ever being larger than the overall *container width* in these edge cases
    width = width > 936 ? 936 : width;

    return width;
  }

  setContainerWidth(width) {
    this.setState({
      containerWidth: width,
    });
  }

  componentDidMount() {
    if (this.props.optimize) {
      this.setContainerWidth(this.measureElementWidth());
    }
  }

  render() {
    const classNames = `ds-image${this.props.extraClassNames ? ` ${this.props.extraClassNames}` : ``}`;

    let img;

    if (this.props.optimize && this.props.rawSource) {
      let source;
      let source2x;

      if (this.state && this.state.containerWidth) {
        let baseSource = this.props.rawSource;

        source = this.reformatImageURL(
          baseSource,
          cache.query(baseSource, this.state.containerWidth, `1x`)
        );

        source2x = this.reformatImageURL(
          baseSource,
          cache.query(baseSource, this.state.containerWidth * 2, `2x`)
        );

        img = (<img src={source} srcSet={`${source2x} 2x`} />);
      }
    } else {
      console.log(`no raw source`);

      img = (<img src={this.props.source} />);
    }

    return (
      <picture className={classNames}>{img}</picture>
    );
  }
}

DSImage.defaultProps = {
  source: null, // The current source style from Pocket API – always 450px
  rawSource: null, // Unadulterated image URL to filter through Thumbor
  extraClassNames: null, // Additional classnames to append to component

  // TODO: Turn this on once raw source is available and sanitized
  optimize: true // Measure parent container to request exact sizes
};
