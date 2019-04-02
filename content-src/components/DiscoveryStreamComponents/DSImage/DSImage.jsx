import React from "react";
import {cache} from "./cache";

export class DSImage extends React.PureComponent {
  constructor(props) {
    super(props);
  }

  // Change the image URL to request a size tailored for the parent container width
  // Also: force JPEG, quality 60, no upscaling, no EXIF data
  // Uses Thumbor: https://thumbor.readthedocs.io/en/latest/usage.html
  reformatImageURL(url, width) {
    return `https://pocket-image-cache.com/${width}x0/filters:format(jpeg):quality(60):no_upscale():strip_exif()/${encodeURIComponent(url)}`;
  }

  componentDidMount() {
    let parentMeasurement = ReactDOM.findDOMNode(this).parentNode.clientWidth;

    // Quirk: Whenever the `Network` tab is open in devtools this is sometimes too large (eg: resolves to window width)
    // This will keep it from ever being larger than the overall *container width* in these edge cases
    parentMeasurement = parentMeasurement > 936 ? 936 : parentMeasurement;

    this.setState({
      parentContainerWidth: parentMeasurement
    });
  }

  render() {
    const classNames = `ds-image${this.props.extraClassNames ? ` ${this.props.extraClassNames}` : ``}`;

    let source, source2x;

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
      img = (<img src={source} srcset={`${source2x} 2x`} />);
    }

    return (
      <picture className={classNames}>{img}</picture>
    );
  }
}

DSImage.defaultProps = {
  extraClassNames: null
}

/*

TODO:

+ switch over to Picture element
+ detect retina and use 1x if not present
+ memoize images so that smaller versions aren't fetched unnecissarily
+ 2 caches for 1x and 2x (because one set will not get loaded)
+ force jpeg (need cleaner img urls - in progress)
- force aspect ratio?
- enable lazy loading (probably follow-on ticket)

*/
