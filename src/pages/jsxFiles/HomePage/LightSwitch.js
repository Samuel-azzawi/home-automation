import { useState, useEffect, useRef } from "react";
import MqttFunctions from "../../../MQTT/MqttFunctions";
import "../../css/LightSwitch.css";
import { DNA } from "react-loader-spinner";
import OpenCurtainIcon from "../../../icons/open.svg";
import ClosedCurtainIcon from "../../../icons/closed.svg";

const LightSwitch = () => {
  const { sendDataToFeed, fetchLatestFeedData } = MqttFunctions();
  const [lightSwitchState, setLightSwitchState] = useState(null);
  const [sensitivity, setSensitivity] = useState(null);
  const [localSensitivity, setLocalSensitivity] = useState(null);
  const [autoMode, setAutoMode] = useState(null);
  const [showAutoModeMessage, setShowAutoModeMessage] = useState(false);
  const [curtainsState, setCurtainsState] = useState(0);
  const sensitivityTimeoutRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchLatestFeedData("sensor").then((data) => {
        if (data !== null) {
          const sensValueArray = data.split(":");
          if (sensValueArray.length === 2) {
            const sensValue = parseInt(sensValueArray[1], 10);
            if (!isNaN(sensValue)) {
              setSensitivity(sensValue);
              setLocalSensitivity((prevLocal) =>
                prevLocal === null ? sensValue : prevLocal
              );
            }
          }
        }
      });

      fetchLatestFeedData("automanual").then((data) => {
        if (data !== null) {
          setAutoMode(data);
        }
      });

      fetchLatestFeedData("curtains").then((data) => {
        if (data !== null) {
          setCurtainsState(data);
        }
      });

      fetchLatestFeedData("lightswitchstate").then((data) => {
        if (data !== null) {
          setLightSwitchState(data);
        }
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchLatestFeedData]);

  const handleLightSwitchChange = () => {
    if (autoMode === "1") {
      setShowAutoModeMessage(true);
      setTimeout(() => setShowAutoModeMessage(false), 5000);
      return;
    }
    setShowAutoModeMessage(false);
    const newState = lightSwitchState === "1" ? "0" : "1";
    setLightSwitchState(newState);
    sendDataToFeed(newState, "lightswitch");
    sendDataToFeed(newState, "lightswitchstate");
  };

  const handleSensitivityChange = (e) => {
    const newSensitivity = e.target.value;
    setLocalSensitivity(newSensitivity);
    if (sensitivityTimeoutRef.current) {
      clearTimeout(sensitivityTimeoutRef.current);
    }
    sensitivityTimeoutRef.current = setTimeout(() => {
      sendDataToFeed(`sensitivity:${newSensitivity}`, "sensor");
      setSensitivity(newSensitivity);
    }, 1500);
  };

  const handleAutoManualToggle = () => {
    const newMode = autoMode === "0" ? "1" : "0";
    setAutoMode(newMode);
    sendDataToFeed(newMode, "automanual");
  };

  return (
    <div className="container">
      {lightSwitchState !== null &&
      localSensitivity !== null &&
      autoMode !== null &&
      curtainsState !== null ? (
        <>
          <div className="toggleLightCon">
            <input
              className="toggleLight"
              type="checkbox"
              checked={lightSwitchState === "1"}
              onChange={handleLightSwitchChange}
            />
            {showAutoModeMessage && (
              <p className="autoModeMessage">
                Auto mode is on, manual control is disabled.
              </p>
            )}
          </div>
          <div className="sensitivity">
            <label>Sensitivity:</label>
            <input
              className="sensitivityinput"
              type="range"
              id="sensitivity"
              name="sensitivity"
              min="0"
              max="100"
              value={localSensitivity}
              onChange={handleSensitivityChange}
            />
            <span>{localSensitivity}</span>
          </div>
          <div className="curtainsState">
            {curtainsState === "closed" ? (
              <img
                src={ClosedCurtainIcon}
                alt="Curtains are closed"
                className="curtainIcon"
              />
            ) : (
              <img
                src={OpenCurtainIcon}
                alt="Curtains are open"
                className="curtainIcon"
              />
            )}
          </div>
          <div className="checkboxCon">
            <p>Auto mode</p>
            <input
              type="checkbox"
              className="checkbox-style"
              checked={autoMode === "1"}
              onChange={handleAutoManualToggle}
            />
          </div>
        </>
      ) : (
        <DNA />
      )}
    </div>
  );
};

export default LightSwitch;
