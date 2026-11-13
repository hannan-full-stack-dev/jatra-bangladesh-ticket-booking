import { createContext, useContext, useReducer } from 'react'
import { bookingReducer, createInitialState } from './bookingReducer'

export const BookingContext = createContext(null)

export function BookingProvider({ children }) {
  const value = useReducer(bookingReducer, undefined, createInitialState)
  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
}

/** Returns [state, dispatch]. */
export const useBooking = () => useContext(BookingContext)
