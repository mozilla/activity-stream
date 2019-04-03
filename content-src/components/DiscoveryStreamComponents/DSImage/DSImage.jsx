import {cache} from "./cache";
import React from "react";
import ReactDOM from "react-dom";

export class DSImage extends React.PureComponent {
  // Change the image URL to request a size tailored for the parent container width
  // Also: force JPEG, quality 60, no upscaling, no EXIF data
  // Uses Thumbor: https://thumbor.readthedocs.io/en/latest/usage.html
  reformatImageURL(url, width) {
    let image = `https://pocket-image-cache.com/${width}x0/filters:format(jpeg):quality(60):no_upscale():strip_exif()/${url}`;

    // Use Mozilla CDN:
    return `https://img-getpocket.cdn.mozilla.net/direct?url=${encodeURIComponent(image)}`;
  }

  measureParentElementWidth() {
    let parentMeasurement = ReactDOM.findDOMNode(this).parentNode.clientWidth;

    // Quirk: Whenever the `Network` tab is open in devtools this is sometimes too large (eg: resolves to window width)
    // This will keep it from ever being larger than the overall *container width* in these edge cases
    parentMeasurement = parentMeasurement > 936 ? 936 : parentMeasurement;

    return parentMeasurement;
  }

  setParentContainerWidth(width) {
    this.setState({
      parentContainerWidth: width,
    });
  }

  componentDidMount() {
    this.setParentContainerWidth(this.measureParentElementWidth());
  }

  render() {
    const classNames = `ds-image${this.props.extraClassNames ? ` ${this.props.extraClassNames}` : ``}`;

    let source;
    let source2x;

    if (this.state && this.state.parentContainerWidth) {
      source = this.reformatImageURL(
        this.props.source,
        cache.query(this.props.source, this.state.parentContainerWidth, `1x`)
      );

      source2x = this.reformatImageURL(
        this.props.source,
        cache.query(this.props.source, this.state.parentContainerWidth * 2, `2x`)
       );
    }

    let img;

    if (source && source2x) {
      img = (<img src={source} srcSet={`${source2x} 2x`} />);
    }

    return (
      <picture className={classNames}>{img}</picture>
    );
  }
}

DSImage.defaultProps = {
  extraClassNames: null,
};
