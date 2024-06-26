import { useState, useEffect, useRef } from "react";
import MqttFunctions from "../../../MQTT/MqttFunctions";
import "../../css/LightSwitch.css";
import { DNA } from "react-loader-spinner";

const LightSwitch = () => {
  const { sendDataToFeed, fetchLatestFeedData } = MqttFunctions();
  const [lightSwitchState, setLightSwitchState] = useState(null);
  const [sensitivity, setSensitivity] = useState(null);
  const [autoMode, setAutoMode] = useState(null);
  const [showAutoModeMessage, setShowAutoModeMessage] = useState(false);
  const sensitivityTimeoutRef = useRef(null);

  useEffect(() => {
    fetchLatestFeedData("lightswitchstate").then((data) => {
      console.log(data);
      if (data !== null) {
        setLightSwitchState(data);
      }
    });

    fetchLatestFeedData("sensor").then((data) => {
      console.log(data);
      if (data !== null) {
        const sensValueArray = data.split(":");
        if (sensValueArray.length === 2) {
          const sensValue = parseInt(sensValueArray[1], 10);
          if (!isNaN(sensValue)) {
            setSensitivity(sensValue);
          }
        }
      }
    });

    fetchLatestFeedData("automanual").then((data) => {
      console.log(data);
      if (data !== null) {
        setAutoMode(data);
      }
    });
  }, [fetchLatestFeedData]);

  useEffect(() => {
    let interval;
    if (autoMode === "1") {
      interval = setInterval(() => {
        fetchLatestFeedData("lightswitchstate").then((data) => {
          console.log(data);
          if (data !== null) {
            setLightSwitchState(data);
          }
        });
      }, 5000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [autoMode, fetchLatestFeedData]);

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
    setSensitivity(newSensitivity);
    if (sensitivityTimeoutRef.current) {
      clearTimeout(sensitivityTimeoutRef.current);
    }
    sensitivityTimeoutRef.current = setTimeout(() => {
      sendDataToFeed(`sensitivity:${newSensitivity}`, "sensor");
    }, 3000);
  };

  const handleAutoManualToggle = () => {
    const newMode = autoMode === "0" ? "1" : "0";
    setAutoMode(newMode);
    sendDataToFeed(newMode, "automanual");
  };

  return (
    <div className="container">
      {lightSwitchState !== null &&
      sensitivity !== null &&
      autoMode !== null ? (
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
              max="500"
              value={sensitivity}
              onChange={handleSensitivityChange}
            />
            <span>{sensitivity}</span>
          </div>
          <div className="checkboxCon">
            <p>auto mode</p>
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
