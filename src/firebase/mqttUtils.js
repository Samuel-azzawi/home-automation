import { getFirestore, doc, getDoc } from 'firebase/firestore';
import app from './firebaseConfig';

const firestore = getFirestore(app);

export const getMQTTCredentials = async (userId) => {
  try {
    const mqttCredentialsDocRef = doc(firestore, 'mqtt_credentials', userId);
    const mqttCredentialsDoc = await getDoc(mqttCredentialsDocRef);
    
    if (mqttCredentialsDoc.exists()) {
      return mqttCredentialsDoc.data();
    } else {
      console.log("No MQTT credentials found");
      return null;
    }
  } catch (error) {
    console.error("Error fetching MQTT credentials: ", error);
    return null;
  }
};
