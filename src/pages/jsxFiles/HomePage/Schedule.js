import { useState, useEffect } from "react";
import { useData } from "../../DataContext";
import "../../css/Schedule.css";
import { Trash } from "react-bootstrap-icons";
import MqttFunctions from "../../../MQTT/MqttFunctions";
import { DNA } from "react-loader-spinner";

function Schedule() {
  const { data, updateData } = useData();
  const [scheduledMessages, setScheduledMessages] = useState([]);
  const [timeLeft, setTimeLeft] = useState({});
  const [action, setAction] = useState("Turn On");
  const [isLoading, setIsLoading] = useState(false);

  const {
    sendDataToFeed,
    fetchAllDataFromFeed,
    deleteDataPoint,
  } = MqttFunctions();

  const fetchAndUpdateMessages = () => {
    setIsLoading(true);
    fetchAllDataFromFeed("schedule")
      .then((data) => {
        const newScheduledMessages = data.map((item) => {
          const message = JSON.parse(item.value);
          message.key = item.id;
          return message;
        });
        setScheduledMessages(newScheduledMessages);
        setIsLoading(false);
      })
      .catch((error) => console.error("Error fetching data:", error));
  };

  const calculateTimeLeft = () => {
    const newTimeLeft = {};
    const now = new Date();
    scheduledMessages.forEach((message, index) => {
      const [hours, minutes] = message.time.split(":");
      const scheduledDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        hours,
        minutes,
        0
      );

      if (scheduledDate < now) {
        scheduledDate.setDate(scheduledDate.getDate() + 1);
      }

      const timeDiff = scheduledDate.getTime() - now.getTime();

      newTimeLeft[index] =
        timeDiff >= 0
          ? `${Math.floor(timeDiff / (1000 * 60 * 60))}h ${Math.floor(
              (timeDiff % (1000 * 60 * 60)) / (1000 * 60)
            )}m left`
          : "Done";
    });
    setTimeLeft(newTimeLeft);
  };

  useEffect(() => {
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [scheduledMessages]);

  const handleTimeChange = (event) => {
    updateData("scheduledTime", event.target.value);
  };

  const handleActionChange = (event) => {
    setAction(event.target.value);
  };

  const handleSetSchedule = () => {
    if (
      !data.scheduledTime ||
      scheduledMessages.some((message) => message.time === data.scheduledTime)
    ) {
      return;
    }
    const state = action === "Turn On" ? 1 : 0;

    const newmqttdata = JSON.stringify({
      time: data.scheduledTime,
      state,
      method: "1",
    });
    sendDataToFeed(newmqttdata, "handleschedule")
      .then((d) => {
        const mqttData = JSON.stringify({
          time: data.scheduledTime,
          state,
          fakeKey: d.id,
        });
        sendDataToFeed(mqttData, "schedule").then(() => {
          fetchAndUpdateMessages();
        });
      })
      .catch((error) => console.error("Error in sending data:", error));
  };

  const removeMessage = (index) => {
    const key = scheduledMessages[index].key;
    const mqttData = JSON.stringify({
      time: scheduledMessages[index].time,
      state: scheduledMessages[index].state,
      method: "0",
    });
    sendDataToFeed(mqttData, "handleschedule")
      .then(() => {
        deleteDataPoint("schedule", key)
          .then(() => {
            const updatedMessages = scheduledMessages.filter(
              (_, i) => i !== index
            );
            setScheduledMessages(updatedMessages);
          })
          .catch((error) => console.error("Error in removing message:", error));
        console.log(data);
      })
      .catch((error) => console.error("Error in sending message:", error));
  };

  useEffect(() => {
    fetchAndUpdateMessages();
  }, []);

  return (
    <div className="scheduleContainer">
      <div className="inputContainer">
        <label className="scheduleLabel">
          Schedule Time:
          <input
            type="time"
            className="timeInput"
            value={data.scheduledTime || ""}
            onChange={handleTimeChange}
          />
        </label>
        <select
          className="actionSelect"
          onChange={handleActionChange}
          defaultValue="Turn On"
        >
          <option value="Turn On">Turn On</option>
          <option value="Turn Off">Turn Off</option>
        </select>
        <button className="setScheduleButton" onClick={handleSetSchedule}>
          Set Schedule
        </button>
      </div>
      <div className="messagesContainer">
        {isLoading ? (
          <DNA />
        ) : (
          scheduledMessages.map((message, index) => (
            <div key={index} className="message">
              <span className="messageContent">
                {message.time} - {message.state === 1 ? "Turn On" : "Turn Off"},{" "}
                {timeLeft[index] || "Calculating..."}
              </span>
              <Trash
                className="removeButton"
                onClick={() => removeMessage(index)}
              />
            </div>
          ))
        )}
        {scheduledMessages.length === 0 && !isLoading && (
          <div>No scheduled messages</div>
        )}
      </div>
    </div>
  );
}

export default Schedule;
