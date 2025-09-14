## Dot Matrix Tool

Generate character or image byte arrays for monochrome dot‑matrix OLED/LCD displays directly in the browser. Draw on a pixel grid, choose byte ordering and endianness, and export in multiple formats ready to paste into firmware.

### Live demo
[dotmatrixtool.com](http://dotmatrixtool.com)

### Background
See the blog post: [Build icons and characters for monochrome LCD matrix displays](http://www.stefangordon.com/build-icons-and-characters-for-monochrome-lcd-matrix-displays/)

## Features
- **Interactive pixel editor**: Left‑click to draw, right‑click (or Ctrl+Left) to erase; click‑and‑drag supported.
- **Adjustable canvas**: Width options `4, 6, 8, 16, 24, 32`; Height options `8, 16, 24, 32`.
- **Layout control**:
  - **Byte order**: Row‑major or Column‑major.
  - **Endianness**: Big‑endian (MSB first) or Little‑endian (LSB first).
- **Multiple output formats**:
  - **C/C++**: `static const uint8_t data[] = { ... }` with hex bytes.
  - **Binary**: `0bxxxxxxxx` byte literals.
  - **ASCII art**: Human‑readable `#` and `.` grid.
- **Copy to clipboard**: One click to copy generated output.
- **Pretty printing**: Syntax‑highlighted C output for easy reading.
- **Persistent settings**: Remembers last used size, format, and options via `localStorage`.

## How it works (at a glance)
The grid you draw populates an internal matrix. Depending on the selected options:
- **Row‑major** packs pixels left→right, top→bottom.
- **Column‑major** packs pixels top→bottom by columns (paged in 8‑pixel tall groups typical of many controllers).
- **Endianness** selects whether the first bit written into each byte is MSB or LSB.

## Usage
1. Open the app (link above) or run it locally (see below).
2. **Draw**: Left‑click to toggle pixels on; right‑click or Ctrl+Left to turn them off. Drag to paint.
3. **Set size**: Choose Width and Height from the dropdowns.
4. **Choose layout**: Select Byte Order (Row/Column) and Endian (Big/Little) to match your display/driver.
5. **Pick format**: C/C++, Binary, or ASCII.
6. **Copy**: Click Copy to put the output on your clipboard.

### Example outputs
```c
static const uint8_t data[] =
{
    0x00, 0x18, 0x3C, 0x66, /* ... */
};
```

```text
..##....
.####...
##..##..
... (ASCII art continues)
```

## Running locally
This is a static site—no build step required.

- **Open the file directly**: Double‑click `index.html`.
- **Or serve locally** (recommended for best clipboard behavior):

```bash
# Python 3
python -m http.server 8000

# Node.js (one option)
npx serve -l 8000
```

Then visit `http://localhost:8000`.

## Development
The app is just three files:
- `index.html` – markup and UI
- `app.js` – interaction, state, and exporters
- `cover.css` – styling

Libraries (via CDN):
- **jQuery** `3.7.1`
- **Bootstrap** `3.4.1`
- **Google Code Prettify** (loader)

There is no build tooling; edit and refresh.


## License
MIT © Stefan Gordon. See `LICENSE` for details.
