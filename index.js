const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/drive.metadata.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
    try {
        const content = await fs.readFile(TOKEN_PATH);
        const credentials = JSON.parse(content);
        return google.auth.fromJSON(credentials);
    } catch (err) {
        return null;
    }
}

/**
 * Serializes credentials to a file compatible with GoogleAuth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
    const content = await fs.readFile(CREDENTIALS_PATH);
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
        type: 'authorized_user',
        client_id: key.client_id,
        client_secret: key.client_secret,
        refresh_token: client.credentials.refresh_token,
    });
    await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
    let client = await loadSavedCredentialsIfExist();
    if (client) {
        return client;
    }
    client = await authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_PATH,
    });
    if (client.credentials) {
        await saveCredentials(client);
    }
    return client;
}

let service = null;

authorize().then(execute).catch(e => console.log(e.code, e.message));

async function execute(authClient) {
    const fileDetails = await listFiles(authClient);
    console.log('Files:');
    console.log(fileDetails.map(f => `${f[0]}) ${f[1]}`))
    const fileNumber = await prompt("Which file to download? (just binary files)");
    await downloadBinaryFile(fileDetails[fileNumber][2], fileDetails[fileNumber][1])
}

/**
 * Lists the names and IDs of up to 10 files.
 * @param {OAuth2Client} authClient An authorized OAuth2 client.
 */
async function listFiles(authClient) {
    service = google.drive({ version: 'v3', auth: authClient });
    const res = await service.files.list({
        pageSize: 10,
        fields: 'nextPageToken, files(id, name)',
    });
    const files = res.data.files;
    if (files.length === 0) {
        console.log('No files found.');
        return;
    }


    return files.map((file, index) => [`${index}`, `${file.name}`, `${file.id}`]);
}

const readline = require("readline/promises");

/**
 * Take sentence input, until you press 'Enter'
 * Like C++ cin
 *
 * @param {String} message
 * @returns {String}
 */
const prompt = async (message) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const answer = await rl.question(message);

    rl.close(); // stop listening
    return answer;
};

/**
 * Downloads a binary file
*/

async function downloadBinaryFile(fileId, fileName) {
    try {
        const file = await service.files.get({
            fileId,
            alt: 'media',
        });
        fs.appendFile(fileName, file.data);
        return file.status;
    } catch (err) {
        // TODO(developer) - Handle error
        throw err;
    }
}
