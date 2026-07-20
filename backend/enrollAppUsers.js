'use strict';

const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        // load the network configuration
        const ccpPath = path.resolve(__dirname, 'config', 'connection-profile.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // load the users data
        const usersPath = path.resolve(__dirname, 'users.json');
        const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));

        // Create a new CA client for interacting with the CA.
        // Assuming Org1 CA for all users based on previous scripts. Adjust if needed.
        const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
        if (!caInfo) {
            console.error('Error: CA information for ca.org1.example.com not found in connection profile.');
            process.exit(1);
        }
        const caTLSCACerts = caInfo.tlsCACerts.pem;
        const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(__dirname, 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the admin user.
        const adminIdentity = await wallet.get('admin');
        if (!adminIdentity) {
            console.log('An identity for the admin user "admin" does not exist in the wallet.');
            console.log('Run the enrollAdmin.js application before retrying');
            return;
        }

        // Get the admin user context object
        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, 'admin');

        // Loop through users and enroll them
        for (const user of users) {
            const username = user.username;
            const userRole = user.role;
            const affiliation = 'org1.department1'; // Assuming default affiliation, adjust if needed

            try {
                // Check to see if we've already enrolled the user.
                const userIdentity = await wallet.get(username);
                if (userIdentity) {
                    console.log(`An identity for the user "${username}" already exists in the wallet`);
                    continue;
                }

                // Register the user, setting the role attribute
                // Use user.password as the enrollment secret if needed, otherwise CA generates one.
                // Using CA generated secret here.
                console.log(`Registering user "${username}" with role "${userRole}"...`);
                const secret = await ca.register({
                    affiliation: affiliation,
                    enrollmentID: username, // Use username from JSON
                    role: 'client', // Standard Fabric role for invoking chaincode
                    attrs: [{ name: 'role', value: userRole, ecert: true }] // Set the specific business role as an attribute
                }, adminUser);

                // Enroll the user.
                console.log(`Enrolling user "${username}"...`);
                const enrollment = await ca.enroll({
                    enrollmentID: username,
                    enrollmentSecret: secret
                });

                // Create the X.509 identity object
                const x509Identity = {
                    credentials: {
                        certificate: enrollment.certificate,
                        privateKey: enrollment.key.toBytes(),
                    },
                    mspId: 'Org1MSP', // Assuming Org1MSP, adjust if needed
                    type: 'X.509',
                };

                // Import the new identity into the wallet.
                await wallet.put(username, x509Identity);
                console.log(`Successfully enrolled user "${username}" and imported it into the wallet`);

            } catch (error) {
                console.error(`Failed to enroll user "${username}": ${error}`);
                // Continue with the next user even if one fails
            }
        }

    } catch (error) {
        console.error(`Failed overall enrollAppUsers script: ${error}`);
        process.exit(1);
    }
}

main(); 