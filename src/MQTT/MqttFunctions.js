import { useState, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../firebase/useAuth";

const MqttFunctions = () => {
  const { mqttCredentials } = useAuth();
  const AIO_USERNAME = mqttCredentials?.mqtt_username;
  const AIO_KEY = mqttCredentials?.mqtt_password;
  const API_BASE_URL = "https://io.adafruit.com/api/v2";

  const [latestData, setLatestData] = useState("");

  const fetchAllDataFromFeed = async (feedKey) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/${AIO_USERNAME}/feeds/${feedKey}/data`,
        {
          headers: { "X-AIO-Key": AIO_KEY },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching feed data:", error);
      throw error;
    }
  };

  const fetchLatestFeedData = useCallback(
    (feed) => {
      if (!AIO_USERNAME || !AIO_KEY) {
        console.error("MQTT credentials are not available.");
        return Promise.reject("MQTT credentials not available");
      }

      return axios
        .get(`${API_BASE_URL}/${AIO_USERNAME}/feeds/${feed}/data?limit=1`, {
          headers: { "X-AIO-Key": AIO_KEY },
        })
        .then((response) => {
          if (response.data && response.data.length > 0) {
            setLatestData(response.data[0].value);
            return response.data[0].value;
          } else {
            console.warn("No data available in the feed");
            return null;
          }
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
          return Promise.reject(error);
        });
    },
    [AIO_USERNAME, AIO_KEY]
  );

  const sendDataToFeed = useCallback(
    (value, feed) => {
      return new Promise((resolve, reject) => {
        if (!AIO_USERNAME || !AIO_KEY) {
          console.error(
            "Cannot send data: MQTT credentials are not available."
          );
          reject("MQTT credentials not available");
        }

        const data = { value: value };
        axios
          .post(`${API_BASE_URL}/${AIO_USERNAME}/feeds/${feed}/data`, data, {
            headers: { "X-AIO-Key": AIO_KEY },
          })
          .then((response) => {
            console.log(`Data ${value} sent to ${feed}:`, response.data);
            resolve(response.data);
          })
          .catch((error) => {
            console.error(`Error sending data ${value} to ${feed}:`, error);
            reject(error);
          });
      });
    },
    [AIO_USERNAME, AIO_KEY]
  );

  const updateDataPoint = useCallback(
    (feed, id, newValue) => {
      if (!AIO_USERNAME || !AIO_KEY) {
        console.error(
          "Cannot update data: MQTT credentials are not available."
        );
        return;
      }

      const data = { value: newValue };
      return axios
        .put(`${API_BASE_URL}/${AIO_USERNAME}/feeds/${feed}/data/${id}`, data, {
          headers: { "X-AIO-Key": AIO_KEY },
        })
        .then((response) => {
          console.log(`Data point updated in ${feed}:`, response.data);
          return response.data;
        })
        .catch((error) => {
          console.error(`Error updating data point in ${feed}:`, error);
        });
    },
    [AIO_USERNAME, AIO_KEY]
  );

  const deleteDataPoint = async (feedKey, dataId) => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/${AIO_USERNAME}/feeds/${feedKey}/data/${dataId}`,
        {
          headers: { "X-AIO-Key": AIO_KEY },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error deleting data point:", error);
      throw error;
    }
  };

  return {
    latestData,
    fetchLatestFeedData,
    sendDataToFeed,
    fetchAllDataFromFeed,
    deleteDataPoint,
    updateDataPoint,
  };
};

export default MqttFunctions;
