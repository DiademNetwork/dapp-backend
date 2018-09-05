import { Address } from 'qtumcore-lib'

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

export {
  isAddress,
  isAccountOwner
}
