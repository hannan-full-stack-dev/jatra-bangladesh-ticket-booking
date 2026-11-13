# Jatra (যাত্রা)

Book intercity bus and train seats across Bangladesh, with real bus companies and Bangladesh Railway trains. A frontend portfolio project: search, pick seats on a live seat map, pay, get a ticket.

> This is a front-end demo. Bus company and train names are real, but departure times, fares, stops and seat availability are generated, and no payment is taken.

## The problem
Buying an intercity ticket in Bangladesh often means a counter queue, a phone call, or a clunky site where you cannot see which seats are left until you have paid. Jatra puts the seat map first.

> Add your own research here: who you asked (2-3 people who travel often), what annoyed them, and what you changed because of it.

## Flow
Search (bus or train) → Trips (filter by time of day, sort by earliest / cheapest / fastest) → Seat map (up to 4 seats, 5-minute hold) → Details and payment (promo code `JATRA10`) → Ticket (printable).

## Run
```bash
npm install
npm run dev
npm test        # booking rules, place data and the route on the map
```

## Motion
All motion is Framer Motion, and `MotionConfig reducedMotion="user"` switches movement off for people who ask for less motion.
- Screens slide in the direction you are travelling (forward or back).
- A map of Bangladesh drawn from the real boundaries of its 8 divisions. The route draws itself, a vehicle travels along it, and the two places you picked pulse. By train the line runs through the real stops of the first direct train; by bus it is an arc, because there is no road data in the app.
- A searchable place picker: by bus, all 64 districts and 544 upazilas; by train, all 425 railway stations, with the stations that have a direct train tagged. Train times and stops come from the real Bangladesh Railway timetable.
- Seat map rows cascade in; seats spring when chosen; the coach tab replays the cascade.
- Fares count up and down instead of jumping; trip cards re-order smoothly when you sort or filter.
- The seat hold is a countdown ring that turns red in the last minute.
- The ticket enters with a spring, the check mark draws itself, and a short burst of confetti follows.

## Distance and time
- **Train:** the distance, departure and arrival are the real Bangladesh Railway timetable for the first direct train of the day. The line on the map passes through that train's real stops.
- **Bus:** the distance is an estimate (straight line x 1.25, shown with a ≈), and departure times are generated. The preview and the first result card use the same trip, so the two never disagree.
- A road and a railway never follow the same line, so one pair of places has two different distances (Dhaka to Chattogram is about 264 km by road estimate and 295 km on the Parjatak line).
- Tests check that every place sits inside its own division on the map, so the gold dot always lands on the real place.

## Seats
Bangladesh style: row letter plus seat number. A 2+2 bus is `A1 A2 | A3 A4`, then `B1 B2 | B3 B4`, up to row J. Train seats carry the coach, like `KA-A1`.

## Notes on the page transition
Screens use a small hand-written transition in `App.jsx`, not `AnimatePresence mode="wait"`. A shared-layout animation (the sliding pill on Bus/Train) could leave AnimatePresence waiting forever, so the next screen never appeared. Now the old screen gets at most 600 ms to leave, and keeps its old data while leaving.

## Structure
```
src/
  lib/         pure rules: seats, pricing, filters, validation, booking id (all tested)
  data/        places (districts, upazilas, stations), train timetable and generated trips (seeded, so a search always gives the same result)
  state/       one reducer for the whole booking flow, and its tests
  hooks/       useHoldTimer
  components/  SeatMap, RouteArt, TripCard, SegmentedControl, AnimatedNumber, ...
  screens/     Search, Results, Seats, Checkout, Ticket
```

## Decisions
- **One reducer owns the flow.** Every step is a pure function, so rules like "max 4 seats", "hold starts on the first seat" and "cannot leave a finished ticket" are unit tested without a browser.
- **Seeded data.** The same search always shows the same trips and the same taken seats, so the demo is predictable and the tests are stable.
- **The seat hold stores a start time**, not a counter, so it stays correct if the tab is slow or hidden.
- **Accessibility.** Seats are real buttons with `aria-pressed` and a spoken label; selection changes are announced; form errors move focus to the first invalid field; colors keep readable contrast.
- **Responsive.** On phones the total and Continue button stay in a bottom bar; on desktop the summary sticks beside the seat map.

## Not built yet
A real backend (trips, seat locking so two people cannot take the same seat, payments), accounts, and Bangla language switching.
