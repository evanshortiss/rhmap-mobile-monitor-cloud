# rhmap-mobile-monitor-cloud

Cloud application that provides mobile platform statistics to its companion app.
Use FHC to gather data.

## Prerequisites
* node v.4.4.3
* npm
* mongodb >= 2.4.6

## Notes
Only tested locally so far. Running on RHMAP might have quirks to iron out.

## Running
To run this application you need to set some environment variables.

* FH_MILLICORE - RHMAP host, e.g acme.redhatmobile.com. Is passed to fhc target
* FHC_USER - Used for fhc login
* FHC_PASS - Used for fhc login

Once these are set just run `npm start` after you've finished an `npm install`.
