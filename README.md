# Sample application to demonstrate UiPath - Watson integration

This Node.js app demonstrates the Watson Assistant service in a simple chat interface simulating a cognitive car dashboard.



## Before you begin

* Create an IBM Cloud account
    * [Sign up](https://console.ng.bluemix.net/registration/?target=/catalog/%3fcategory=watson) in IBM Cloud, or use an existing account. Your account must have available space for at least 1 app and 1 service.
* Make sure that you have the following prerequisites installed:
    * The [Node.js](https://nodejs.org/#download) runtime, including the [npm][npm_link] package manager
    * The [Cloud Foundry][cloud_foundry] command-line client

      Note: Ensure that you Cloud Foundry version is up to date


### Setting up the Watson Assistant service

You can use an exisiting instance of the Watson Assistant service. Otherwise, follow these steps.

1. At the command line, go to the local project directory (`assistant-simple`).

1. Connect to IBM Cloud with the Cloud Foundry command-line tool. For more information, see the Watson Developer Cloud [documentation][cf_docs].
    ```bash
    cf login
    ```

1. Create an instance of the Watson Assistant service in IBM Cloud (our CLI is being updated, for now, use the `create-service` conversation command). For example:

    ```bash
    cf create-service conversation free my-watson-assistant-service
    ```

### Configuring the app environment

1. Copy or rename the `.env.example` file to `.env` (nothing before the dot).

1. Create a service key in the format `cf create-service-key <service_instance> <service_key>`. For example:

    ```bash
    cf create-service-key my-watson-assistant-service myKey
    ```

1. Retrieve the credentials from the service key using the command `cf service-key <service_instance> <service_key>`. For example:

    ```bash
    cf service-key my-watson-assistant-service myKey
    ```

   The output from this command is a JSON object, as in this example:

    ```JSON
    {
      "password": "87iT7aqpvU7l",
      "url": "https://gateway.watsonplatform.net/conversation/api",
      "username": "ca2905e6-7b5d-4408-9192-e4d54d83e604"
    }
    ```

1. Paste  the `password` and `username` values (without quotation marks) from the JSON into the `ASSISTANT_PASSWORD` and `ASSISTANT_USERNAME` variables in the `.env` file. For example:

G    ```
    ASSISTANT_USERNAME=ca2905e6-7b5d-4408-9192-e4d54d83e604
    ASSISTANT_PASSWORD=87iT7aqpvU7l
    ```

### Installing and starting the app locally

1. Install the demo app package into the local Node.js runtime environment:

    ```bash
    npm install
    ```

1. Start the app:

    ```bash
    npm start
    ```

1. Point your browser to http://localhost:3000 to try out the app.


## Deploying to IBM Cloud

You can use Cloud Foundry to deploy your local version of the app to IBM Cloud.

1. In the project root directory, open the `manifest.yml` file:

  * In the `applications` section of the `manifest.yml` file, change the `name` value to a unique name for your version of the demo app.
  * In the `services` section, specify the name of the Watson Assistant service instance you created for the demo app. If you do not remember the service name, use the `cf services` command to list all services you have created.

  The following example shows a modified `manifest.yml` file:

  ```yml
  ---
  declared-services:
   my-watson-assistant-service:
     label: conversation
     plan: free
  applications:
  - name: conversation-simple-app-test1
   command: npm start
   path: .
   memory: 256M
   instances: 1
   services:
   - my-watson-assistant-service
   env:
     NPM_CONFIG_PRODUCTION: false
  ```

1. Push the app to IBM Cloud:

  ```bash
  cf push
  ```
  Access your app on IBM Cloud at the URL specified in the command output.


## License

This sample code is licensed under Apache 2.0.
Full license text is available in [LICENSE](LICENSE).
