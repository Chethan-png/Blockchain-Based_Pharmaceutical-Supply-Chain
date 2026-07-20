const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const config = require('../config/config');

async function enrollUser(username, role) {
    try {
        // Create a new CA client for interacting with the CA
        const caInfo = config.connectionProfile.certificateAuthorities['ca.org1.example.com'];
        const caTLSCACerts = caInfo.tlsCACerts.pem;
        const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

        // Create a new file system based wallet for managing identities
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // Check if the user already exists in the wallet
        const userExists = await wallet.get(username);
        if (!userExists) {
            // Get the admin identity
            const adminIdentity = await wallet.get('admin');
            if (!adminIdentity) {
                throw new Error('Admin identity not found in wallet. Please run enrollAdmin.js first.');
            }

            // Get the admin user context
            const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
            const adminUser = await provider.getUserContext(adminIdentity, 'admin');

            // Register the user
            const secret = await ca.register({
                affiliation: 'org1.department1',
                enrollmentID: username,
                role: 'client',
                attrs: [{ name: 'role', value: role, ecert: true }]
            }, adminUser);

            // Enroll the user
            const enrollment = await ca.enroll({
                enrollmentID: username,
                enrollmentSecret: secret
            });

            // Create a new identity for the user
            const x509Identity = {
                credentials: {
                    certificate: enrollment.certificate,
                    privateKey: enrollment.key.toBytes(),
                },
                mspId: config.orgMspId,
                type: 'X.509',
            };

            // Save the identity to the wallet
            await wallet.put(username, x509Identity);
            console.log(`Successfully enrolled user "${username}" and imported it into the wallet`);
        }

        // Return user information
        return {
            username,
            role,
            mspId: config.orgMspId
        };

    } catch (error) {
        console.error(`Failed to enroll user "${username}": ${error}`);
        throw error;
    }
}

module.exports = { enrollUser }; 