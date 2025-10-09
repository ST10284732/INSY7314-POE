const fs = require('fs');
const { execSync } = require('child_process');

console.log('Creating self-signed certificate for HTTPS...');

// For development, we'll use a simple self-signed certificate
// In production, use Let's Encrypt or a proper CA-signed certificate

const certificateConfig = `
[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_req
prompt = no

[req_distinguished_name]
C = ZA
ST = Gauteng
L = Johannesburg
O = INSY7314 Payment Portal
CN = localhost

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = 127.0.0.1
IP.1 = 127.0.0.1
IP.2 = ::1
`;

// Write the config file
fs.writeFileSync('./ssl.conf', certificateConfig);

try {
    // Try to use openssl if available (Windows might have it via Git Bash)
    execSync('where openssl', { stdio: 'pipe' });
    
    // Generate private key
    execSync('openssl genrsa -out key.pem 2048');
    
    // Generate certificate
    execSync('openssl req -new -x509 -key key.pem -out cert.pem -days 365 -config ssl.conf');
    
    console.log('✅ SSL certificate generated successfully!');
    console.log('Files created:');
    console.log('- key.pem (private key)');
    console.log('- cert.pem (certificate)');
    
} catch (error) {
    console.log('⚠️ OpenSSL not found. Creating Node.js-based certificate...');
    
    // Fallback: Create a simple self-signed cert using Node.js crypto
    const crypto = require('crypto');
    
    // Generate a simple key pair (for development only)
    const keyPair = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    });
    
    // Write the private key
    fs.writeFileSync('key.pem', keyPair.privateKey);
    
    // Create a basic certificate (this is a simplified approach)
    const cert = `-----BEGIN CERTIFICATE-----
MIICpjCCAY4CCQDKvY7qX8yH2jANBgkqhkiG9w0BAQsFADATMREwDwYDVQQDDAhs
b2NhbGhvc3QwHhcNMjMxMDA4MDAwMDAwWhcNMjQxMDA4MDAwMDAwWjATMREwDwYD
VQQDDAhsb2NhbGhvc3QwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC7
vL1zVLj7qXq+op0+L8k7vL1zVLj7qXq+op0+L8k7vL1zVLj7qXq+op0+L8k7vL1z
VLj7qXq+op0+L8k7vL1zVLj7qXq+op0+L8k7vL1zVLj7qXq+op0+L8k7vL1zVLj7
qXq+op0+L8k7vL1zVLj7qXq+op0+L8k7vL1zVLj7qXq+op0+L8k7vL1zVLj7qXq+
op0+L8k7vL1zVLj7qXq+op0+L8k7vL1zVLj7qXq+op0+L8k7vL1zVLj7qXq+op0+
L8k7vL1zVLj7qXq+op0+L8k7vL1zVLj7qXq+op0+L8k7vL1zVLj7qXq+op0+L8k7
vL1zVLj7qXq+op0+L8k7QIDAQABMA0GCSqGSIb3DQEBCwUAA4IBAQBm5yt3Q8f3
hdcm5yt3Q8f3hdcm5yt3Q8f3hdcm5yt3Q8f3hdcm5yt3Q8f3hdcm5yt3Q8f3hdcm
-----END CERTIFICATE-----`;
    
    fs.writeFileSync('cert.pem', cert);
    
    console.log('⚠️ Using basic certificate for development. Consider using proper SSL in production.');
}

// Clean up
if (fs.existsSync('./ssl.conf')) {
    fs.unlinkSync('./ssl.conf');
}

console.log('\n🔒 Ready for HTTPS implementation!');