# Getting Started

This application was built using Braintree's Node.js SDK

### Prerequisites

Please make sure you have node installed on your machine. Use `node -v` in terminal to see if it is installed.

```
Node installation: https://nodejs.org/en/download/
```

### Installing
After node has been installed, please use the following steps to run the application.

1. Navigate to the project folder in terminal and install the required packages using the following command

```
npm install
```

2. Create a new file called `.env` in the project folder. Copy the contents of `credentialsInput.env` into your new `.env` file. Fill the `.env` file with your Braintree sandbox credentials.

3. To start the application, make sure you are in the project folder and run the following command in terminal

```
npm start
```
4. Visit `localhost:3000` in your browser to view the application

### Navigating the Application

Once the application is launched you will be brought to a page where the Hosted Fields integration will be displayed.

Use the navigation bar to head to both parts of the integration.

`Create Transactions` will bring you back to the Hosted Fields checkout page

`Transaction Search` will display the last 3 months of transactions for the connected sandbox account

### Testing

Use the following test cards and amounts to generate different responses from the Hosted Fields integration.

1. Test Cards

```Valid Card Number: 4111111111111111
  Card Number to test card verification decline: 4000111111111115
```
2. Test values
```
Transaction Processor Decline: $2046
```

Visit [Braintree's Developer Documentation](https://developers.braintreepayments.com/reference/general/testing/node) for more test cases.
