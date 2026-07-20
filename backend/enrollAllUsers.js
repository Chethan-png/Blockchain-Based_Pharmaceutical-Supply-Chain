const { Wallets, X509WalletMixin } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const fs = require('fs');
const path = require('path');
const config = require('./config/config');

async function main() {
    try {
        // Create a new CA client for interacting with the CA.
        const caInfo = config.connectionProfile.certificateAuthorities['ca.org1.example.com'];
        const caTLSCACerts = caInfo.tlsCACerts.pem;
        const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);


        // Check to see if we've already enrolled the admin user.
        const adminExists = await wallet.get('admin');
        if (!adminExists) {
            console.log('An identity for the admin user "admin" does not exist in the wallet');
            console.log('Run the enrollAdmin.js application before retrying');
            return;
        }

        // Create a new CA client for the admin
        const adminIdentity = await wallet.get('admin');
        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, 'admin');

        // Define the roles and their attributes
        const roles = [
            { name: 'manufacturer', role: 'manufacturer' },
            { name: 'wholesaler', role: 'wholesaler' },
            { name: 'distributor', role: 'distributor' },
            { name: 'pharmacy', role: 'pharmacy' },
            { name: 'customer', role: 'customer' }
        ];

        // Enroll each role
        for (const role of roles) {
            try {
                // Check if the user already exists
                const userExists = await wallet.get(role.name);
                if (userExists) {
                    console.log(`An identity for the user "${role.name}" already exists in the wallet`);
                    continue;
                }

                // Register the user
                const secret = await ca.register({
                    affiliation: 'org1.department1',
                    enrollmentID: role.name,
                    role: 'client',
                    attrs: [{ name: 'role', value: role.role, ecert: true }]
                }, adminUser);

                // Enroll the user
                const enrollment = await ca.enroll({
                    enrollmentID: role.name,
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
                await wallet.put(role.name, x509Identity);
                console.log(`Successfully enrolled user "${role.name}" and imported it into the wallet`);

            } catch (error) {
                console.error(`Failed to enroll user "${role.name}": ${error}`);
            }
        }

    } catch (error) {
        console.error(`Failed to enroll users: ${error}`);
        process.exit(1);
    }
}

main(); 


