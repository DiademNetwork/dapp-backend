import { Address } from 'qtumcore-lib'
import bs58 from 'bs58'

const isAddress = (address) => {
  return Address.isValid(address)
}

const isAccountOwner = async (fb, user, token) => {
  const userAccount = await fb.api('debug_token', { input_token: token })

  if (userAccount.is_valid === true && userAccount.user_id === user) {
    return true
  } else {
    return false
  }
}

const toHexAddress = (address) => {
  const bytes = bs58.decode(address)
  const hexAddress = bytes.toString('hex').slice(2, 42)

  return hexAddress
}

const toContentHash = (link) => {
  // todo: retrive content by link and return hash from content
  return link
}

export {
  isAddress,
  isAccountOwner,
  toHexAddress,
  toContentHash
}
