// Configuration constants for IPFS deployment

export const IPFS_GATEWAYS = {
    DWEB: 'dweb.link'
};

export const DEPLOYMENT = {
    // CID-based gateway URL (subdomain format)
    CID_GATEWAY: (cid) => `https://${cid}.ipfs.${IPFS_GATEWAYS.DWEB}/`,
    // Path-based gateway URL
    DWEB_DIRECT: (cid) => `https://${IPFS_GATEWAYS.DWEB}/ipfs/${cid}/`
};

