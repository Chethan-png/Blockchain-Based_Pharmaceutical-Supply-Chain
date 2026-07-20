const path = require('path');

module.exports = {
    // JWT configuration
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    
    // Fabric network configuration
    connectionProfile: require('./connection-profile.json'),
    
    // Chaincode configuration
    chaincodeId: 'drugcontract',
    channelName: 'mychannel',
    
    // Wallet path
    walletPath: path.join(process.cwd(), 'wallet'),
    
    // Organization MSP ID
    orgMspId: 'Org1MSP',
    
    // Gateway configuration
    gatewayDiscovery: {
        enabled: true,
        asLocalhost: true
    }
}; 