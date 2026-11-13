const PHONE = /^(?:\+?88)?01[3-9]\d{8}$/
const EMAIL = /^\S+@\S+\.\S+$/

/** Returns { fieldId: message }. Field ids match the input ids so the first error can be focused. */
export function validateCheckout({ passengers, contact }) {
  const errors = {}
  passengers.forEach((p, i) => {
    if (p.name.trim().length < 2) errors[`name-${i}`] = 'Enter the passenger’s full name.'
  })
  if (!PHONE.test(contact.phone.replace(/[\s-]/g, ''))) errors.phone = 'Enter a valid mobile number, like 01712-345678.'
  if (contact.email && !EMAIL.test(contact.email.trim())) errors.email = 'Enter a valid email, or leave it empty.'
  return errors
}
