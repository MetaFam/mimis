class Settings {
  ipfsConversion = $state('http://localhost:8080/ipfs/{cid}')
}
export const settings = new Settings()
