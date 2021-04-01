require('dotenv').config();

var config = {
    version: 'v1',
    network: process.env.NETWORK || 'jungle',
    signing: {
        account: process.env.SIGNING_ACCOUNT || null,
        key: process.env.SIGNING_KEY || null,
        permission: process.env.SIGNING_PERMISSION || 'active',
    },
    max_fee: process.env.MAX_FEE || 0.1000,
    networks: {
        eos: {
            host: 'eos.greymass.com',
            port: 443,
            protocol: 'https',
            chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906',            
            charge: {
                endpoint: process.env.EOS_CHARGE_ENDPOINT || 'https://eos-signing.eosauthority.com'
            }
        },        
        jungle: {
            host: 'api.jungle3.alohaeos.com',
            port: 443,
            protocol: 'https',
            chainId: '2a02a0053e5a8cf73a56ba0fda11e4d92e0238a4a2aa74fccf46d5a910746840',            
            charge: {
                endpoint: process.env.JUNGLE_CHARGE_ENDPOINT || 'https://jungle-signing.eosauthority.com'
            }
        }
    }

};

module.exports = config;