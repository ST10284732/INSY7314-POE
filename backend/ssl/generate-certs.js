const fs = require('fs');
const path = require('path');
const selfsigned = require('selfsigned');

console.log('🔐 Generating SSL certificates for Payment Portal...');

// Certificate attributes
const attrs = [
  { name: 'commonName', value: 'localhost' },
  { name: 'countryName', value: 'US' },
  { shortName: 'ST', value: 'CA' },
  { name: 'localityName', value: 'San Francisco' },
  { name: 'organizationName', value: 'Payment Portal' },
  { shortName: 'OU', value: 'IT Department' }
];

// Certificate options
const opts = {
  keySize: 4096, // 4096-bit key for strong security
  days: 365,     // Valid for 1 year
  algorithm: 'sha256',
  extensions: [
    {
      name: 'basicConstraints',
      cA: true
    },
    {
      name: 'keyUsage',
      keyCertSign: true,
      digitalSignature: true,
      nonRepudiation: true,
      keyEncipherment: true,
      dataEncipherment: true
    },
    {
      name: 'extKeyUsage',
      serverAuth: true,
      clientAuth: true,
      codeSigning: true,
      timeStamping: true
    },
    {
      name: 'subjectAltName',
      altNames: [
        {
          type: 2, // DNS
          value: 'localhost'
        },
        {
          type: 2,
          value: '*.localhost'
        },
        {
          type: 7, // IP
          ip: '127.0.0.1'
        },
        {
          type: 7,
          ip: '::1'
        }
      ]
    }
  ]
};

try {
  // Generate the certificate
  const pems = selfsigned.generate(attrs, opts);
  
  // Write to files
  fs.writeFileSync(path.join(__dirname, 'key.pem'), pems.private);
  fs.writeFileSync(path.join(__dirname, 'cert.pem'), pems.cert);
  
  console.log('✅ SSL certificates generated successfully!');
  console.log('📁 Certificate files created:');
  console.log('   📄 key.pem  (4096-bit RSA private key)');
  console.log('   📄 cert.pem (X.509 certificate, valid for 365 days)');
  console.log('');
  console.log('🔒 Certificate Details:');
  console.log('   Common Name: localhost');
  console.log('   Alt Names: localhost, *.localhost');
  console.log('   IP Addresses: 127.0.0.1, ::1');
  console.log('   Algorithm: SHA-256 with RSA');
  console.log('   Key Size: 4096 bits');
  console.log('');
  console.log('⚠️  Browser Security Notice:');
  console.log('   Browsers will show "Not Secure" for self-signed certificates.');
  console.log('   Click "Advanced" → "Proceed to localhost" to continue.');
  console.log('   For production, use Let\'s Encrypt or a trusted CA.');
  
} catch (error) {
  console.error('❌ Failed to generate SSL certificates:', error.message);
  process.exit(1);
}