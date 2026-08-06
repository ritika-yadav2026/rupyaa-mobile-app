# Google Tag Manager Container Files

Place your GTM container JSON files here.

## How to download your container:

1. Sign in to [Google Tag Manager](https://tagmanager.google.com/)
2. Select your **mobile container** (iOS or Android)
3. Click **Versions** in the top navigation bar
4. Click the container version you wish to use
5. Click **Download**
6. Save the file here with the name matching your container ID (e.g., `GTM-XXXXXXX.json`)

## Configuration

Update `app.json` with your actual container ID:

```json
[
  "./plugins/withGoogleTagManager.js",
  {
    "androidContainerId": "GTM-XXXXXXX",
    "iosContainerId": "GTM-XXXXXXX",
    "tagManagerVersion": "18.3.0",
    "androidContainerFile": "./assets/gtm-containers/GTM-XXXXXXX.json",
    "iosContainerFile": "./assets/gtm-containers/GTM-XXXXXXX.json"
  }
]
```

## Note

With `@react-native-firebase/analytics` already installed, your Firebase events automatically flow to GTM when you link Firebase to Tag Manager in the GTM console. The container file is only needed if you want to use GTM's offline/default container functionality.
