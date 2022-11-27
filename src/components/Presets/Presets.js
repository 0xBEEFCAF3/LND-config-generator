import React, { Component } from "react";
import PropTypes from "prop-types";

import "./Presets.css";

import Select from "../controls/Select";
import Item from "../Item";

function toVal(val) {
  return { name: val, value: val };
}

// Determine which value to use, the default (a) or non-default (b)
function mix(a, b) {
  if (typeof a !== "object" || typeof b !== "object") {
    if (b !== undefined) {
      return b;
    }
    return b || a;
  }

  Object.keys(a).forEach((key) => {
    a[key] = mix(a[key], b[key]);
  });

  return a;
}

const presets = {
  Defaults: {},
};

class Presets extends Component {
  static propTypes = {
    preset: PropTypes.string,
    defaults: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
  };

  static defaultProps = {
    preset: "Defaults",
  };

  change = (preset) => {
    if (!window.confirm("Do you want to overwrite current config?")) {
      this.forceUpdate();
      return;
    }

    const data = mix(clone(this.props.defaults), clone(presets[preset] || {}));
    this.props.onChange(preset, data);
  };

  render() {
    const { preset } = this.props;

    return (
      <div className="presets">
        <Item title={""} description={"Load predefined config."}>
          <Select
            onChange={this.change}
            value={preset}
            values={Object.keys(presets).map(toVal)}
            id={"presets"}
            disabled={false}
          />
        </Item>
      </div>
    );
  }
}

function clone(val) {
  return JSON.parse(JSON.stringify(val));
}

export default Presets;
