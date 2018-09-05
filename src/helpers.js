import { Address } from 'qtumcore-lib'

const isAddress = (address) => {
  return Address.isValid(address)
}

export {
  isAddress
}
