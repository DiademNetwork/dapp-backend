/* eslint-disable no-trailing-spaces */
import { Address, crypto } from 'qtumcore-lib'
import bs58 from 'bs58'

const isAddress = (address) => {
  return Address.isValid(address)
}

const isAccountOwner = async (fb, user, token) => {
  const userAccount = await fb.api('debug_token', { input_token: token })

  console.log(userAccount)

  if (userAccount.is_valid === true && userAccount.user_id === user) {
    return true
  } else {
    return false
  }
}

const isAddressOwner = async (users, address, account) => {
  const addressOwner = (await users.call('getAccountByAddress', [address])).outputs[0]

  return addressOwner === account
}

const toHexAddress = (address) => {
  const bytes = bs58.decode(address)
  const hexAddress = bytes.toString('hex').slice(2, 42)

  return hexAddress
}

const toContentHash = (link) => {
  // todo: retrive content by link and return hash from content (when app will be approved by facebook)
  return crypto.Hash.sha256(Buffer.from(link)).toString('hex')
}

const toUserProfileName = async (fb, user) => {
  const userProfile = await fb.api(`/${user}/`)

  return userProfile.name
}

export {
  isAddress,
  isAccountOwner,
  isAddressOwner,
  toHexAddress,
  toContentHash,
  toUserProfileName
}
