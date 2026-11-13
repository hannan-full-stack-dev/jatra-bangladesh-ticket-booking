export const PERIODS = {
  all: () => true,
  morning: (t) => t.departMin < 12 * 60,
  afternoon: (t) => t.departMin >= 12 * 60 && t.departMin < 18 * 60,
  night: (t) => t.departMin >= 18 * 60,
}

export const SORTS = {
  earliest: (a, b) => a.departMin - b.departMin,
  cheapest: (a, b) => a.pricePerSeat - b.pricePerSeat || a.departMin - b.departMin,
  fastest: (a, b) => a.durationMin - b.durationMin || a.departMin - b.departMin,
}

export const selectTrips = (trips, { period, sort }) => trips.filter(PERIODS[period]).sort(SORTS[sort])
