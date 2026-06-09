const SEPOLIA_EXPLORER = 'https://sepolia.etherscan.io'

export const etherscanLinks = {
  tx: (txHash: string) => `${SEPOLIA_EXPLORER}/tx/${txHash}`,
  block: (blockNumber: number) => `${SEPOLIA_EXPLORER}/block/${blockNumber}`,
  address: (address: string) => `${SEPOLIA_EXPLORER}/address/${address}`,
  token: (contractAddress: string, tokenId?: number) =>
    tokenId ? `${SEPOLIA_EXPLORER}/token/${contractAddress}?a=${tokenId}` : `${SEPOLIA_EXPLORER}/token/${contractAddress}`,
}

export const truncateHash = (hash: string, start = 6, end = 4) => {
  if (hash.length <= start + end) return hash
  return `${hash.slice(0, start)}...${hash.slice(-end)}`
}
