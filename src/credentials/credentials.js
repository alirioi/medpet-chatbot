import config from '../config/env.js';

const credentials = {
  type: 'service_account',
  project_id: 'melodic-agent-465622-j4',
  private_key_id: config.GOOGLE_SHEETS_PRIVATE_KEY_ID,
  private_key: config.GOOGLE_SHEETS_PRIVATE_KEY,
  client_email: 'medpet0@melodic-agent-465622-j4.iam.gserviceaccount.com',
  client_id: '113636614793033880042',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url:
    'https://www.googleapis.com/robot/v1/metadata/x509/medpet0%40melodic-agent-465622-j4.iam.gserviceaccount.com',
  universe_domain: 'googleapis.com',
};

export default credentials;
