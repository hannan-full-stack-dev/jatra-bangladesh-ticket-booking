# Jatra (যাত্রা)

Book intercity bus and train seats across Bangladesh. Search a route, see the seat map before you pay, and get a printable ticket.

**Live demo:** https://jatra-bangladesh-ticket-booking.vercel.app/

<img width="760" height="470" alt="demo" src="https://github.com/user-attachments/assets/2d194775-09b1-4f4f-a681-a1ea935e4ea7" />


> This is a front-end portfolio project. Bus company and train names are real, and so is the Bangladesh Railway timetable. Bus departure times, fares and seat availability are generated, and no payment is taken.

## Why I built it

I wanted a project that has a real flow from start to finish, not a single screen. Ticket booking fits: you search, compare, pick a seat, hold it, pay and get a ticket, and each step has rules that can go wrong (seat limits, a hold that expires, a seat someone else took).

The idea I wanted to try is **seat map first**. The seat map is the screen people care about most, so Jatra makes it the centre of the flow instead of the last step.

I did not run user interviews for this project. The design choices below come from my own use of ticket sites and from thinking through what the booking rules need to be.

## What it does

- **Two modes.** By bus, pick any of 64 districts or 500+ upazilas. By train, pick any of 425 railway stations. Stations with a direct train are tagged.
- **Real map.** Bangladesh is drawn from the real boundaries of its 8 divisions. Your two places sit at their real coordinates, the route draws itself, and a vehicle travels along it. By train the line passes through the real stops of the first direct train.
- **Trips.** Filter by time of day, sort by earliest, cheapest or fastest.
- **Seat map.** Bangladesh-style seats (`A1 A2 | A3 A4`, trains like `KA-A1`). Up to 4 seats, with a 5-minute hold shown as a countdown ring.
- **Checkout.** Passenger details, a promo code (`JATRA10`), and a fare breakdown.
- **Ticket.** A printable ticket with a QR code and a confetti burst.

## Distance and time

- **Train:** distance, departure and arrival come from the real Bangladesh Railway timetable, for the first direct train of the day.
- **Bus:** the distance is an estimate (straight line × 1.25, shown with a ≈) because the app has no road network. Departure times are generated.
- The preview panel and the first result card use the same trip, so the two never disagree.
- A road and a railway never follow the same line, so one pair of places has two different distances. Dhaka to Chattogram is about 264 km by the road estimate and 295 km on the Parjatak line.

## Tech

React 18 · Vite · Tailwind CSS · Framer Motion · Vitest

## Run it

```bash
npm install
npm run dev
npm test        # booking rules, place data and the route on the map
```

## Motion

All motion is Framer Motion, and `MotionConfig reducedMotion="user"` switches movement off for people who ask for less motion.

- Screens slide in the direction you are travelling.
- The route draws itself and the vehicle follows it.
- Seat rows cascade in, and seats spring when chosen.
- Fares count up and down instead of jumping, and trip cards re-order smoothly.
- The hold ring turns red in the last minute.

## Decisions

- **One reducer owns the flow.** Every step is a pure function, so rules like "max 4 seats", "hold starts on the first seat" and "cannot leave a finished ticket" are unit tested without a browser.
- **Seeded data.** The same search always gives the same trips and the same taken seats, so the demo is predictable and the tests are stable.
- **The hold stores a start time**, not a counter, so it stays correct if the tab is slow or hidden.
- **Real boundaries, tested.** A test checks that every place sits inside its own division on the map, so a dot can never land in the wrong place. This caught several wrong coordinates in the data.
- **Accessibility.** Seats are real buttons with `aria-pressed` and a spoken label, selection changes are announced, form errors move focus to the first invalid field, and colours keep readable contrast.
- **Responsive.** On phones the total and Continue button stay in a bottom bar. On desktop the summary sticks beside the seat map.
- **Own page transition.** Screens use a small hand-written transition in `App.jsx` instead of `AnimatePresence mode="wait"`, because a shared-layout animation (the sliding Bus/Train pill) could leave it waiting forever. The old screen now gets at most 600 ms to leave.

## Structure

```
src/
  lib/         pure rules: seats, pricing, filters, validation, booking id, distance (all tested)
  data/        places, train timetable and generated trips (seeded)
  state/       one reducer for the whole booking flow, and its tests
  hooks/       useHoldTimer
  components/  SeatMap, RouteArt, TripCard, PlacePicker, SegmentedControl, ...
  screens/     Search, Results, Seats, Checkout, Ticket
```

## Not built yet

- A real backend: trips, seat locking so two people cannot take the same seat, and payments.
- Real road distances and bus times (for example from a routing service).
- Accounts, and Bangla language switching.

## Data sources

- Division boundaries: BBS / OCHA (CC BY 4.0)
- Upazilas: geoBoundaries (CC BY 4.0)
- Railway stations and timetable: [hussain-ahmed2/bd-railway-data](https://github.com/hussain-ahmed2/bd-railway-data) (MIT)

## Author

**Hannan Goljar**, Full Stack Developer, Dhaka
[GitHub](https://github.com/hannan-full-stack-dev) · [LinkedIn](https://www.linkedin.com/in/hannan-full-stack-dev/) · hghannan2@gmail.com
