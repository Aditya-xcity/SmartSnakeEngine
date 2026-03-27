# Noodle Chaos 3000

A browser-based Snake game with a custom main menu, multiple snake skins, manual and auto-play modes, and a gameplay HUD that showcases DAA concepts in real time.

## Features

- Main menu for:
  - Player name
  - Snake preset/skin
  - Game mode (`manual` or `auto`)
  - Speed (`Cruise`, `Arcade`, `Turbo`, `Hyper`)
- Gameplay arena with:
  - Score, length, level, and profile panels
  - Runtime algorithm log and complexity notes
  - Keyboard controls for movement, pause, hint, auto mode, and sound
- Audio system:
  - Background music and sound effects
  - Runtime sound toggle

## Algorithms Used

The game references and applies data structures/algorithms in `js/algorithms.js` and runtime logic:

- `Deque` for snake body management
- `Hash Set` for fast collision checks
- `Fisher-Yates` sampling for spawn/randomization
- `BFS` for hint pathfinding
- `Greedy` heuristic for auto-play direction choices
- `Priority Queue` / min-heap for timed item behavior

## Project Structure

- `index.html` - Main menu (player settings, mode, speed, snake preset)
- `game.html` - Game arena UI and panels
- `styles.css` - Shared styles
- `js/config.js` - Board/grid sizing and speed constants
- `js/audio.js` - Music and SFX handling
- `js/algorithms.js` - Core algorithm/data structure utilities
- `js/game.js` - Main game loop and mechanics
- `js/input.js` - Keyboard input handling
- `Sound_Effect/` - Audio assets

## Run Locally

No build tools or package installs are required.

1. Open `index.html` in a modern browser.
2. Configure your profile and settings.
3. Click **START RUN** to launch `game.html`.

Notes:
- If audio does not start immediately, click/tap once on the page (browser autoplay policy).
- A lightweight local server (optional) can improve asset loading consistency.

## Controls

- `W` / `Arrow Up`: Move up
- `S` / `Arrow Down`: Move down
- `A` / `Arrow Left`: Move left
- `D` / `Arrow Right`: Move right
- `P`: Pause / resume
- `H`: BFS hint path
- `T`: Toggle auto-play
- `M`: Toggle sound

## Customization

- Snake presets are defined in menu and game scripts (`index.html`, `js/game.js`).
- Speed tiers are set in `js/config.js` via the `SPEEDS` array.

## License

No license file is currently included in this repository.
