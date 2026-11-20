# C3 Restaurant

A fresh, responsive restaurant website and complete menu for C3 Restaurant, Ujjain. This folder is self-contained; it does not use the previous demo's files.

## Start the website

In a terminal, enter these as two separate commands:

```sh
cd ~/Downloads/C3-Family-Restaurant
python3 -m http.server 8000
```

Then open <http://127.0.0.1:8000/>. Keep the terminal window open while using the website. To stop the server, press `Ctrl+C` in that terminal.

Then open <http://127.0.0.1:8000/> for the home page or <http://127.0.0.1:8000/menu.html> for the menu. Keep the terminal window open while using the website. To stop the server, press `Ctrl+C` in that terminal. If port 8000 is already busy, use `python3 -m http.server 8001` and open <http://127.0.0.1:8001/> instead.

The menu page also explains this if it is opened directly as a file. The browser needs the local server to load the menu data file.

## Change a dish price

Open `data/menu.json`. Each dish is on its own line, so change just the number beside `price`, `half`, or `full`.

```json
{ "name": "Pizza Margarita", "price": 210 }
```

For half/full prices, edit the matching value on that dish's line. For Sada/Butter roti options, edit the matching value under `variants`. Save the file and refresh the browser.

Restaurant name, phone, WhatsApp number, Instagram profile URL, address and hours are in `config.js`.

## Menu notes

All 193 dish entries supplied in the menu chart are included across 19 categories. The few unreadable dish names are marked “Name unclear”; the Chana Masala half price is marked to confirm because the chart showed `135?`. The restaurant's delivery number and Ujjain address are included from the supplied card. Opening hours were not supplied, so the page says to call to confirm.
