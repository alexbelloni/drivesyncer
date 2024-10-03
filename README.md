# DriveSyncer
Google Drive Sync via Node.js  

## Base Tutorial
https://developers.google.com/drive/api/quickstart/nodejs  

After it:  
 
- Add yourself as a test user on https://console.cloud.google.com/apis/credentials/consent?project=<PROJECT-NAME> 

- Delete token.json  
- Change line 6 in your quickstart code to be: const SCOPES = ['https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/drive.metadata.readonly'];
- Change the fileId inside downloadFile function
- Run node index.js
- Accept the app access




