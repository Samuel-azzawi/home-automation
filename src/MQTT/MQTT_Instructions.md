
# Using MQTT with Adafruit IO

To utilize MQTT with your project, follow these steps:

## 1. Create an Account on Adafruit IO

- Visit [Adafruit IO](https://io.adafruit.com) and sign up for an account.
- Once logged in, create a new feed. You can name it `data` or any name of your choice. If you choose a different name, remember to update it in the code.
- Take note of your username and your Adafruit IO Key. You can find the IO Key in the side menu under 'My Key'.

## 2. Set Up Environment Variables

- In the root folder of your project (named `the-web-site`), create a file named `.env`.
- Inside the `.env` file, add the following lines:

  ```
  REACT_APP_MQTT_USERNAME=<Your Adafruit IO Username>
  REACT_APP_MQTT_PASSWORD=<Your Adafruit IO Key>
  ```

  Replace `<Your Adafruit IO Username>` and `<Your Adafruit IO Key>` with the actual username and key you obtained from Adafruit IO. Ensure there are no spaces before or after the `=` sign.

## 3. Install Necessary Packages

- If you encounter any problems, or if this is your first time running the project, run `npm i` in the terminal while in the project directory. This command will install all the necessary Node.js packages as defined in your `package.json` file.

By following these instructions, you should be able to set up and use MQTT with Adafruit IO in your project.
