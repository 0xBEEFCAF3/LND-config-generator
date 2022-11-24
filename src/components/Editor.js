import React, { Component } from "react";
import PropTypes from "prop-types";

import Section from "./Section";
import Item from "./Item";
import Select from "./controls/Select";

import { localPath, basePath, joinPath } from "../system";
import data from "../data.json";

class Editor extends Component {
  static propTypes = {
    settings: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
  };

  change = (data, name) => {
    return (value) => {
      data[name] = value;
      this.props.onChange({ ...this.props.settings });
    };
  };

  render() {
    const properties = [
      "app",
      "bitcoin",
      "btcd",
      "bitcoind",
      "neutrino",
      "autopilot",
    ];
    const { settings } = this.props;
    const platform = settings.__internal.platform;
    return (
      <div>
        {this.select("__internal", "platform")}
        {properties.map((property) => {
          const appConfigs = Object.keys(data[property]);
          return (
            <Section
              title={data[property].section}
              description={data[property].description}
            >
              {appConfigs.map((config) => {
                if (data[property][config].default == null) return null;
                if (data[property][config].values) {
                  return this.select(property, config);
                }

                if (typeof data[property][config].default === "boolean") {
                  return this.flag(property, config);
                }
                if (typeof data[property][config].default === "number") {
                  return this.number(property, config);
                }
                return this.text(property, config);
              })}
            </Section>
          );
        })}
      </div>
    );
  }

  select(section, prop, isEnabled = true) {
    check(section, prop);

    // TODO [ToDr] hacky
    const { configMode } = this;

    const { settings } = this.props;
    const value = or(settings[section][prop], data[section][prop].default);
    const description = fillDescription(
      data[section][prop].description[value],
      value,
      `${section}.${prop}`
    );

    return (
      <Item
        title={data[section][prop].name}
        description={description}
        disabled={!isEnabled}
      >
        <Select
          onChange={this.change(settings[section], prop)}
          value={value}
          values={data[section][prop].values.map(val)}
          id={`${configMode}_${prop}`}
          disabled={!isEnabled}
        />
      </Item>
    );
  }

  multiselect(section, prop, isEnabled = true) {
    check(section, prop);

    // TODO [ToDr] hacky
    const { configMode } = this;

    const { settings } = this.props;
    const current = settings[section][prop];
    var description;

    if (current === undefined || current.length === 0) {
      description = "";
    } else {
      description = fillDescription(data[section][prop].description, current);
    }

    const change = (val) => (ev) => {
      const { checked } = ev.target;
      const newValue = [...current];
      const idx = newValue.indexOf(val);

      if (checked) {
        newValue.push(val);
      } else if (idx !== -1) {
        newValue.splice(idx, 1);
      }
      this.change(settings[section], prop)(newValue);
    };

    return (
      <Item
        title={data[section][prop].name}
        description={description}
        disabled={!isEnabled}
        large
      >
        {data[section][prop].values.map(val).map((value) => {
          const id = `${configMode}_${section}_${prop}_${value.value}`;

          return (
            <label
              className="mdl-switch mdl-js-switch"
              htmlFor={id}
              key={value.name}
            >
              <input
                type="checkbox"
                id={id}
                className="mdl-switch__input"
                checked={current.indexOf(value.value) !== -1}
                disabled={!isEnabled}
                onChange={change(value.value)}
              />
              <span className="mdl-switch__label">{value.name}</span>
            </label>
          );
        })}
      </Item>
    );
  }

  number(section, prop, isEnabled = true) {
    check(section, prop);
    const { settings } = this.props;
    const value = or(settings[section][prop], data[section][prop].default);
    const description = fillDescription(data[section][prop].description, value);

    return (
      <Item
        title={data[section][prop].name}
        description={description}
        disabled={!isEnabled}
      >
        <div className="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
          <input
            className="mdl-textfield__input"
            type="number"
            value={value || 0}
            onChange={(ev) =>
              this.change(settings[section], prop)(Number(ev.target.value))
            }
            min={data[section][prop].min}
            max={data[section][prop].max}
            disabled={!isEnabled}
          />
          <span className="mdl-textfield__error">
            Please provide a valid number (min: {data[section][prop].min}, max:{" "}
            {data[section][prop].max})
          </span>
        </div>
      </Item>
    );
  }

  decimal(section, prop, isEnabled = true) {
    check(section, prop);
    const { settings } = this.props;
    const value = or(settings[section][prop], data[section][prop].default);
    const description = fillDescription(data[section][prop].description, value);

    return (
      <Item
        title={data[section][prop].name}
        description={description}
        disabled={!isEnabled}
      >
        <div className="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
          <input
            className="mdl-textfield__input"
            type="number"
            step="0.00000001"
            value={value || 0}
            onChange={(ev) =>
              this.change(settings[section], prop)(Number(ev.target.value))
            }
            min={data[section][prop].min}
            max={data[section][prop].max}
            disabled={!isEnabled}
          />
          <span className="mdl-textfield__error">
            Please provide a valid number (min: {data[section][prop].min}, max:{" "}
            {data[section][prop].max})
          </span>
        </div>
      </Item>
    );
  }

  path(section, prop, base, platform, isEnabled = true) {
    return this.text(section, prop, isEnabled, (value) => {
      if (!value) {
        return value;
      }
      value = value.replace("$LOCAL", localPath(platform));
      value = value.replace("$BASE", base);
      // normalize separators
      value = joinPath(value.split("\\"), platform);
      value = joinPath(value.split("/"), platform);
      return value;
    });
  }

  text(section, prop, isEnabled = true, processValue = (x) => x) {
    check(section, prop);
    const { settings } = this.props;
    const value = processValue(
      or(settings[section][prop], data[section][prop].default)
    );
    const description = fillDescription(data[section][prop].description, value);

    return (
      <Item
        title={data[section][prop].name}
        description={description}
        disabled={!isEnabled}
      >
        <div className="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
          <input
            className="mdl-textfield__input"
            type="text"
            value={value || ""}
            onChange={(ev) =>
              this.change(settings[section], prop)(ev.target.value)
            }
            disabled={!isEnabled}
          />
        </div>
      </Item>
    );
  }

  flag(section, prop, isEnabled = true) {
    check(section, prop);

    // TODO [ToDr] hacky
    const { configMode } = this;

    const { settings } = this.props;
    const value = or(settings[section][prop], data[section][prop].default);
    const description = fillDescription(data[section][prop].description, value);
    const id = `${configMode}_${section}_${prop}`;

    return (
      <Item
        title={data[section][prop].name}
        description={description}
        disabled={!isEnabled}
      >
        <label className="mdl-switch mdl-js-switch" htmlFor={id}>
          <input
            type="checkbox"
            id={id}
            className="mdl-switch__input"
            checked={value}
            disabled={!isEnabled}
            onChange={(ev) =>
              this.change(settings[section], prop)(ev.target.checked ? 1 : 0)
            }
          />
          <span className="mdl-switch__label" />
        </label>
      </Item>
    );
  }

  list(section, prop, isEnabled = true) {
    check(section, prop);
    const { settings } = this.props;
    const value = or(settings[section][prop], data[section][prop].default);
    const description = fillDescription(
      data[section][prop].description,
      value.toString()
    );

    return (
      <Item
        title={data[section][prop].name}
        description={description}
        disabled={!isEnabled}
      >
        <div className="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
          {value.map((v, idx) => (
            <input
              disabled={!isEnabled}
              key={idx}
              className="mdl-textfield__input"
              type="text"
              value={v || ""}
              onChange={(ev) => {
                const newValue = [...value];
                if (ev.target.value !== "") {
                  newValue[idx] = ev.target.value;
                } else {
                  delete newValue[idx];
                }
                this.change(settings[section], prop)(newValue);
              }}
            />
          ))}
          <br />
          <button
            style={{ bottom: 0, right: 0, zIndex: 10, transform: "scale(0.5)" }}
            className="mdl-button mdl-js-button mdl-button--fab mdl-button--mini-fab mdl-js-ripple-effect"
            onClick={() =>
              this.change(settings[section], prop)(value.concat([""]))
            }
            disabled={!isEnabled}
          >
            <i className="material-icons">add</i>
          </button>
        </div>
      </Item>
    );
  }
}

export function fillDescription(description, value, key) {
  if (!description) {
    console.warn(`Cant find description for: value:${value} at ${key}`);
    return "unknown entry";
  }

  if (typeof description === "object") {
    // If the description value is an array, concatenate the descriptions
    if (Array.isArray(value)) {
      var formatted = "";
      for (var val in value) {
        if ({}.hasOwnProperty.call(value, val)) {
          formatted += description[value[val]] + ",";
        }
      }
      // remove trailing comma
      formatted = formatted.replace(/(,$)/g, "");
      return formatted;
    }
    // If there is a single value and it exists in the description mapping, return it
    if (description[value] !== undefined) {
      return description[value];
    }
    return description.value;
  }
  return description.replace(/{}/g, value || "");
}

function or(value, def) {
  if (value === undefined) {
    return def;
  }
  return value;
}

function check(section, prop) {
  if (!data[section][prop]) {
    throw new Error(`Can't find data for ${section}.${prop}`);
  }
}

function val(data) {
  const match = data.match(/(.+)\s+\[(.+)]/);
  if (!match) {
    return { name: data, value: data };
  }

  return {
    name: match[1],
    value: match[2],
  };
}

export default Editor;
