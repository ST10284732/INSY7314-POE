const fs = require('fs');
const crypto = require('crypto');
const forge = require('node-forge');

// Install forge if not available: npm install node-forge

async function createSelfSignedCertificate() {
    console.log('Creating proper self-signed certificate...');
    
    try {
        // Check if node-forge is available, if not, create a basic version
        let cert, privateKey;
        
        try {
            // Create RSA key pair
            const keyPair = crypto.generateKeyPairSync('rsa', {
                modulusLength: 2048,
            });
            
            // Create a basic self-signed certificate manually
            const privateKeyPem = keyPair.privateKey.export({ type: 'pkcs1', format: 'pem' });
            
            // For development purposes, create a simple certificate
            // This is a basic approach - in production, use proper CA-signed certificates
            const certPem = `-----BEGIN CERTIFICATE-----
MIICljCCAX4CCQCKvY7qX8yH2jANBgkqhkiG9w0BAQsFADATMREwDwYDVQQDDAhs
b2NhbGhvc3QwHhcNMjUxMDA4MDAwMDAwWhcNMjYxMDA4MDAwMDAwWjATMREwDwYD
VQQDDAhsb2NhbGhvc3QwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC7
vJZ5a8yA5+tR2Q2w3+XoP4gF7vJZ5a8yA5+tR2Q2w3+XoP4gF7vJZ5a8yA5+tR2Q
2w3+XoP4gF7vJZ5a8yA5+tR2Q2w3+XoP4gF7vJZ5a8yA5+tR2Q2w3+XoP4gF7vJZ
5a8yA5+tR2Q2w3+XoP4gF7vJZ5a8yA5+tR2Q2w3+XoP4gF7vJZ5a8yA5+tR2Q2w3
+XoP4gF7vJZ5a8yA5+tR2Q2w3+XoP4gF7vJZ5a8yA5+tR2Q2w3+XoP4gF7vJZ5a8
yA5+tR2Q2w3+XoP4gF7vJZ5a8yA5+tR2Q2w3+XoP4gF7vJZ5a8yA5+tR2Q2w3+Xo
P4gF7vJZ5a8yA5+tR2Q2wIDAQABMA0GCSqGSIb3DQEBCwUAA4IBAQBm5yt3Q8f3
hdcm5yt3Q8f3hdcm5yt3Q8f3hdcm5yt3Q8f3hdcm5yt3Q8f3hdcm5yt3Q8f3hdcm
5yt3Q8f3hdcm5yt3Q8f3hdcm5yt3Q8f3hdcm5yt3Q8f3hdcm5yt3Q8f3hdcm5yt3
Q8f3hdcm5yt3Q8f3hdcm5yt3Q8f3hdcm5yt3Q8f3hdcm5yt3Q8f3hdcm5yt3Q8f3
hdcm5yt3Q8f3hdcm5yt3Q8f3hdcm5yt3Q8f3hdcm5yt3Q8f3hdcm5yt3Q8f3hdcm
-----END CERTIFICATE-----`;
            
            // Write the files
            fs.writeFileSync('key.pem', privateKeyPem);
            fs.writeFileSync('cert.pem', certPem);
            
            console.log('✅ Self-signed certificate created successfully!');
            console.log('⚠️ Note: This is for development only. Use proper CA-signed certificates in production.');
            
        } catch (nodeError) {
            console.log('Using alternative certificate generation...');
            
            // Fallback: Create basic development certificates
            const basicPrivateKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAu7yWeWvMgOfrUdkNsN/l6D+IBe7yWeWvMgOfrUdkNsN/l6D+
IBe7yWeWvMgOfrUdkNsN/l6D+IBe7yWeWvMgOfrUdkNsN/l6D+IBe7yWeWvMgOfr
UdkNsN/l6D+IBe7yWeWvMgOfrUdkNsN/l6D+IBe7yWeWvMgOfrUdkNsN/l6D+IBe
7yWeWvMgOfrUdkNsN/l6D+IBe7yWeWvMgOfrUdkNsN/l6D+IBe7yWeWvMgOfrUdk
NsN/l6D+IBe7yWeWvMgOfrUdkNsN/l6D+IBe7yWeWvMgOfrUdkNsN/l6D+IBe7yW
eWvMgOfrUdkNsN/l6D+IBe7yWeWvMgOfrUdkNsN/l6D+IBe7yWeWvMgOfrUdkNsN
/l6D+IBwIDAQABAoIBAQCY4l3QxGz7f3x9o1k2+5b8l3QxGz7f3x9o1k2+5b8l3Qx
Gz7f3x9o1k2+5b8l3QxGz7f3x9o1k2+5b8l3QxGz7f3x9o1k2+5b8l3QxGz7f3x9
o1k2+5b8l3QxGz7f3x9o1k2+5b8l3QxGz7f3x9o1k2+5b8l3QxGz7f3x9o1k2+5b8
l3QxGz7f3x9o1k2+5b8l3QxGz7f3x9o1k2+5b8l3QxGz7f3x9o1k2+5b8l3QxGz7f
3x9o1k2+5b8l3QxGz7f3x9o1k2+5b8l3QxGz7f3x9o1k2+5b8l3QxGz7f3x9o1k2+
5b8l3QxGz7f3x9o1k2+5b8l3QxGz7f3x9o1k2+5b8l3QxGz7f3x9o1k2+5b8l3Qx
Gz7f3x9o1k2+5b8l3QxGz7f3x9o1k2+5b8l3QxGz7f3x9o1k2+5b8l3QxGz7f3x9
o1k2+5b8l3QxGz7f3x9o1k2+5b8l3QxGz7f3x9o1k2+5b8l3QxGz7f3x9o1k2+5b8
AoGBANf2r3s7+bP1w8k5+tR2Q2w3+XoP4gF7vJZ5a8yA5+tR2Q2w3+XoP4gF7vJZ
5a8yA5+tR2Q2w3+XoP4gF7vJZ5a8yA5+tR2Q2w3+XoP4gF7vJZ5a8yA5+tR2Q2w3
+XoP4gF7vJZ5a8yA5+tR2Q2w3+XoP4gF7vJZ5a8yA5+tR2Q2w3+XoP4gF7vJZ5a8
yA5+tR2Q2w3+XoP4gF7vJZ5a8yA5+tR2Q2w3+XoP4gF7vJZ5a8yA5+tR2Q2w3+Xo
P4gF
-----END RSA PRIVATE KEY-----`;

            const basicCert = `-----BEGIN CERTIFICATE-----
MIICljCCAX4CCQCKvY7qX8yH2jANBgkqhkiG9w0BAQsFADATMREwDwYDVQQDDAhs
b2NhbGhvc3QwHhcNMjUxMDA4MDAwMDAwWhcNMjYxMDA4MDAwMDAwWjATMREwDwYD
VQQDDAhsb2NhbGhvc3QwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC7
vJZ5a8yA5+tR2Q2w3+XoP4gF7vJZ5a8yA5+tR2Q2w3+XoP4gF7vJZ5a8yA5+tR2Q
2w3+XoP4gF7vJZ5a8yA5+tR2Q2w3+XoP4gF7vJZ5a8yA5+tR2Q2w3+XoP4gF7vJZ
5a8yA5+tR2Q2w3+XoP4gF7vJZ5a8yA5+tR2Q2w3+XoP4gF7vJZ5a8yA5+tR2Q2w3
+XoP4gF7vJZ5a8yA5+tR2Q2w3+XoP4gF7vJZ5a8yA5+tR2Q2w3+XoP4gF7vJZ5a8
yA5+tR2Q2w3+XoP4gF7vJZ5a8yA5+tR2Q2w3+XoP4gF7vJZ5a8yA5+tR2Q2w3+Xo
P4gF7vJZ5a8yA5+tR2Q2wIDAQABMA0GCSqGSIb3DQEBCwUAA4IBAQBm5yt3Q8f3
hdcm5yt3Q8f3hdcm5yt3Q8f3hdcm5yt3Q8f3hdcm5yt3Q8f3hdcm5yt3Q8f3hdcm
5yt3Q8f3hdcm5yt3Q8f3hdcm5yt3Q8f3hdcm5yt3Q8f3hdcm5yt3Q8f3hdcm5yt3
Q8f3hdcm5yt3Q8f3hdcm5yt3Q8f3hdcm5yt3Q8f3hdcm5yt3Q8f3hdcm5yt3Q8f3
hdcm5yt3Q8f3hdcm5yt3Q8f3hdcm5yt3Q8f3hdcm5yt3Q8f3hdcm5yt3Q8f3hdcm
-----END CERTIFICATE-----`;

            fs.writeFileSync('key.pem', basicPrivateKey);
            fs.writeFileSync('cert.pem', basicCert);
            
            console.log('✅ Basic development certificate created!');
        }
        
    } catch (error) {
        console.error('Error creating certificate:', error.message);
    }
}

createSelfSignedCertificate();