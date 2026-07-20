const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function main() {
  try {
    const ccpPath = path.resolve(__dirname, './config/connection-profile.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    const caInfo = ccp.certificateAuthorities['ca.org2.example.com'];
    const ca = new FabricCAServices(caInfo.url);

    const walletPath = path.join(__dirname, 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const userExists = await wallet.get('appUser-org2');
    if (userExists) {
      console.log('✔️ appUser-org2 already exists in the wallet');
      return;
    }

    const enrollment = await ca.enroll({
        enrollmentID: 'appUser-org2b',
        enrollmentSecret: 'NocJmgblCcNY'
      });
      

    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes()
      },
      mspId: 'Org2MSP',
      type: 'X.509'
    };

    await wallet.put('appUser-org2', x509Identity);
    console.log('✅ Successfully enrolled appUser-org2');

  } catch (error) {
    console.error(`❌ Failed to enroll appUser-org2: ${error}`);
  }
}

main();
