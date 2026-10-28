VICENTINA BEACH RESORT — ROOM CARD UPDATE

Files: index.html, style.css, script.js, assets/room1.jpg through room4.jpg

Open index.html with VS Code Live Server. Room cards now include descriptions, amenities, rates (sample), guest capacity, Book Now buttons, and date-specific booking status labels.

Prototype behavior: new booking requests are stored in localStorage in the same browser/origin. Status counts update on the booking page. A booking marked PAID in this browser's localStorage causes the room to display ROOM OCCUPIED for overlapping selected dates and disables booking form fields for that date range.

Important: This is not a shared database. Bookings do not sync between devices or browsers, and this website cannot securely verify payments or automatically know status changes made in a separate scanner website. For live multi-device status, connect customer and staff sites to a shared backend/database and add staff authentication. Sample prices and room descriptions must be confirmed by the resort.
