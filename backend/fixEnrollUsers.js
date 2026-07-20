const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const config = require('./config/config');

async function main() {
    try {
        const caInfo = config.connectionProfile.certificateAuthorities['ca.org1.example.com'];
        const caTLSCACerts = caInfo.tlsCACerts.pem;
        const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        const adminIdentity = await wallet.get('admin');
        if (!adminIdentity) {
            console.log('Admin identity not found in wallet. Run enrollAdmin.js first.');
            return;
        }
        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, 'admin');

        const roles = [
            { name: 'manufacturer', role: 'manufacturer' },
            { name: 'wholesaler', role: 'wholesaler' },
            { name: 'distributor', role: 'distributor' },
            { name: 'pharmacy', role: 'pharmacy' },
            { name: 'customer', role: 'customer' }
        ];

        const identityService = ca.newIdentityService();
        const knownSecret = 'ResetPass123';

        for (const role of roles) {
            try {
                const userExists = await wallet.get(role.name);
                if (userExists) {
                    console.log(`Identity for "${role.name}" already exists in wallet, skipping.`);
                    continue;
                }

                // Reset the secret for the already-registered CA identity
                await identityService.update(role.name, { secret: knownSecret }, adminUser);
                console.log(`Reset secret for existing CA identity "${role.name}"`);

                // Enroll using the newly-set secret
                const enrollment = await ca.enroll({
                    enrollmentID: role.name,
                    enrollmentSecret: knownSecret
                });

                const x509Identity = {
                    credentials: {
                        certificate: enrollment.certificate,
                        privateKey: enrollment.key.toBytes(),
                    },
                    mspId: config.orgMspId,
                    type: 'X.509',
                };

                await wallet.put(role.name, x509Identity);
                console.log(`Successfully enrolled user "${role.name}" and imported it into the wallet`);
            } catch (error) {
                console.error(`Failed to fix/enroll user "${role.name}": ${error}`);
            }
        }
    } catch (error) {
        console.error(`Failed to fix users: ${error}`);
        process.exit(1);
    }
}

main();
