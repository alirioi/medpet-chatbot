import { google } from 'googleapis';
import credentials from '../credentials/credentials.js';

const sheets = google.sheets('v4');

async function addRowToSheet(auth, spreadsheetId, values) {
  const request = {
    spreadsheetId,
    range: 'reserva',
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    resource: {
      values: [values],
    },
    auth,
  };

  try {
    const response = await sheets.spreadsheets.values.append(request).data;
    return response;
  } catch (error) {
    console.error(error);
  }
}

const appendToSheet = async (data) => {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: 'https://www.googleapis.com/auth/spreadsheets',
    });

    const authClient = await auth.getClient();
    const spreadsheetId = '1i6euR4jq-sj03AF8ZwDVuwKHRbNR0VPBMw9qlqsEpe4';

    await addRowToSheet(authClient, spreadsheetId, data);
    return 'Datos correctamente agregados';
  } catch (error) {
    console.error(error);
  }
};

export default appendToSheet;
