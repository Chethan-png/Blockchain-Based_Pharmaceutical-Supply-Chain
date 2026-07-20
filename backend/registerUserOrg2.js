const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function main() {
  try {
    const ccpPath = path.resolve(__dirname, './config/connection-profile.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    const caURL = ccp.certificateAuthorities['ca.org2.example.com'].url;
    const ca = new FabricCAServices(caURL);

    const walletPath = path.join(__dirname, 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const adminIdentity = await wallet.get('admin-org2');
    if (!adminIdentity) {
      console.log('Admin identity for Org2 not found');
      return;
    }

    const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, 'admin-org2');

    // Register new user
    const secret = await ca.register({
      affiliation: '',
      enrollmentID: 'appUser-org2b',
      role: 'client'
    }, adminUser);

    console.log('✅ Registered appUser-org2b with secret:', secret);

  } catch (error) {
    console.error(`❌ Failed to register: ${error}`);
  }
}

main();
