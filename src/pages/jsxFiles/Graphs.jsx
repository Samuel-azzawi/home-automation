import { useEffect, useState } from "react";
import "../css/Graph.css";
import MqttFunctions from "../../MQTT/MqttFunctions";
import { Line, Bar } from "react-chartjs-2";
import "chart.js/auto";
import { useAuth } from "../../firebase/useAuth";
import { Chart } from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";

function Graphs() {
  Chart.register(zoomPlugin);
  const { mqttCredentials } = useAuth();
  const { fetchAllDataFromFeed } = MqttFunctions();
  const [currentTab, setCurrentTab] = useState("lightSwitchState");

  const [graphData, setGraphData] = useState({
    labels: [],
    datasets: [
      {
        label: "Light Switch State (0=Off, 1=On)",
        data: [],
        fill: false,
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
      },
    ],
  });
  const [consumptionData, setConsumptionData] = useState({
    labels: [],
    datasets: [
      {
        label: "Daily Electricity Consumption (Wh)",
        data: [],
        backgroundColor: "rgba(53, 162, 235, 0.5)",
      },
    ],
  });
  const [sensorData, setSensorData] = useState({
    labels: [],
    datasets: [
      {
        label: "Sensor Data",
        data: [],
        backgroundColor: "rgba(153, 102, 255, 0.2)",
        borderColor: "rgba(153, 102, 255, 1)",
        borderWidth: 1,
      },
    ],
  });
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      zoom: {
        zoom: {
          wheel: {
            enabled: true,
            speed: 0.1,
          },
          pinch: {
            enabled: true,
          },
          mode: "xy",
        },
        pan: {
          enabled: true,
          mode: "xy",
        },
        limits: {
          x: { min: "original", max: "original", minRange: 1 },
          y: { min: "original", max: "original", minRange: 1 },
        },
      },
    },
  };

  useEffect(() => {
    if (
      mqttCredentials &&
      mqttCredentials.mqtt_username &&
      mqttCredentials.mqtt_password
    ) {
      fetchAllDataFromFeed("lightswitchstate")
        .then((data) => {
          const labels = data.map((item) =>
            new Date(item.created_at).toLocaleString()
          );
          const values = data.map((item) => item.value);
          setGraphData({
            labels: labels,
            datasets: [{ ...graphData.datasets[0], data: values }],
          });

          calculateDailyConsumption(data);
        })
        .catch((err) => {
          console.error(err);
        });

      fetchAllDataFromFeed("data")
        .then((sensorDataResponse) => {
          const sensorLabels = sensorDataResponse.map((item) =>
            new Date(item.created_at).toLocaleString()
          );
          const sensorValues = sensorDataResponse.map((item) =>
            parseFloat(item.value)
          );

          setSensorData((prevSensorData) => ({
            labels: sensorLabels,
            datasets: [
              {
                ...prevSensorData.datasets[0],
                data: sensorValues,
              },
            ],
          }));
        })
        .catch((err) => {
          console.error(err);
        });
    }
  }, [mqttCredentials]);

  const calculateDailyConsumption = (data) => {
    const consumption = {};
    let lastState = null;
    let lastTime = null;

    data.forEach((entry) => {
      const dateTime = new Date(entry.created_at);
      const date = dateTime.toLocaleDateString();
      const time = dateTime.getTime();
      const state = parseInt(entry.value);

      if (lastState === 1 && state === 0 && consumption[date] !== undefined) {
        const onTime = (lastTime - time) / 1000 / 3600;
        console.log(onTime);
        consumption[date] += onTime * 15;
      }

      lastState = state;
      lastTime = time;

      if (state === 1 && !(date in consumption)) {
        consumption[date] = 0;
      }
    });

    setConsumptionData({
      labels: Object.keys(consumption),
      datasets: [
        { ...consumptionData.datasets[0], data: Object.values(consumption) },
      ],
    });
  };

  return (
    <div  className="containergraph">
      <div className="tabs">
        <button
          className="optionsButton"
          onClick={() => setCurrentTab("lightSwitchState")}
        >
          Light Switch State
        </button>
        <button
          className="optionsButton"
          onClick={() => setCurrentTab("electricityConsumption")}
        >
          Electricity Consumption
        </button>
        <button
          className="optionsButton"
          onClick={() => setCurrentTab("sensorData")}
        >
          Sensor Data
        </button>
      </div>
      <div className="content">
        {currentTab === "lightSwitchState" && (
          <div className="graphImage">
            <Line data={graphData} options={lineChartOptions} />
          </div>
        )}
        {currentTab === "electricityConsumption" && (
          <div className="graphImage">
            <Bar data={consumptionData} options={lineChartOptions} />
          </div>
        )}
        {currentTab === "sensorData" && (
          <div className="graphImage">
            <Line data={sensorData} options={lineChartOptions} />
          </div>
        )}
      </div>
    </div>
  );
}

export default Graphs;
