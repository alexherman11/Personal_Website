const projects = [
  {
    id: 'agora',
    name: 'Agora',
    tagline: 'A place-based social media app built on LLMs and maps',
    description:
      'Agora is a revolutionary social media platform centered on two things: a great, cheap AI interface and a beautiful customizable map. No infinite feed, no ads, no attention economy. Instead, place-based communities where club meetings show up on a college campus next to a cool mural someone pinned. Features smart model routing between AI providers, a kernel architecture that works like an OS with a message bus for user-customizable apps and agents, digital democracy with peer juries and community votes, and full user control over their interface. Built to be a new public good for digital commons and community building.',
    status: 'Active — Senior Project',
    role: 'Solo Developer',
    links: [],
  },
  {
    id: 'oto',
    name: 'OTO Modular Motor System',
    tagline: 'Modular motor control for robotics — PID, I2C, RP2040',
    description:
      'A modular motor control solution designed for robotics applications from classroom learning to assembly line automation. Custom hardware and firmware on RP2040 with current/voltage sensors (INA228), quadrature encoder input, PID control with auto-tuning, and I2C daisy-chaining for multi-motor setups. Includes a terminal-based motor setup interface using VT100 commands. Built in a team of three — my first experience with PCB design and AI-enhanced coding.',
    status: 'Complete',
    role: 'Hardware & Software Co-developer',
    links: [
      { label: 'Design Report', url: '/pdf/alpha_design_report.pdf' },
    ],
  },
  {
    id: 'strawberry',
    name: 'IoT DataLogger — Strawberry Commission',
    tagline: 'Production PCB design for agricultural IoT device',
    description:
      'Took a hot-glued prototype (GPS, Teensy, SD card) and designed a production PCB. Engineered the power architecture with two buck converters, a battery charging chip, and multiple power domains. Debugged a reversed schottky diode, bootstrapping pin conflicts, and mismatched footprints — hand-soldering replacements under the microscope. The device logs field data and auto-uploads via WiFi. Now principal hardware designer. PCB Rev2 includes a LoRa transceiver for long-range communication.',
    status: 'Active',
    role: 'Hardware Engineer',
    links: [],
  },
  {
    id: 'beatbox',
    name: 'BeatBox',
    tagline: 'STM32 terminal beat-maker with servo percussion',
    description:
      'A terminal-interfacing device for making four-measure beats in the key of C with drum kit tracks. Built on an STM32-Nucleo using a finite state machine, UART at 115,200 baud, and VT-100 escape codes for an interactive terminal UI. Features looping, three selectable preset drum kits, and servo-driven percussion on household objects. Solo project for my Microcontrollers final.',
    status: 'Complete',
    role: 'Solo Developer',
    links: [
      { label: 'Video Demo', url: 'https://www.youtube.com/watch?v=tA8918O9Kkc' },
      { label: 'Project Report', url: '/pdf/P3%20-%20Final%20Project.pdf' },
    ],
  },
  {
    id: 'foot_mouse',
    name: 'Foot Mouse for Sally',
    tagline: 'Accessible foot mouse — TOM Global honorable mention',
    description:
      'Built a foot mouse for Sally, who has bilateral epicondylitis that prevents pain-free computer use. Designed and prototyped click, scroll, and cursor-move functionality using a PMW3360 high-end gaming sensor with custom housing. Debugged signal interference from parallel wires in sheathing by rewiring with single-stranded wire. Received an honorable mention in the TOM Global Maker Challenge Daily Living category.',
    status: 'Complete',
    role: 'Hardware Engineering Lead',
    links: [
      { label: 'GitHub', url: 'https://github.com/Foot-Mouse-for-Sally/Foot-Mouse-For-Sally' },
      { label: 'TOM Global', url: 'https://tomglobal.org/project?id=67acf83630ee740012debfff' },
    ],
  },
  {
    id: 'the_depths',
    name: 'The Depths',
    tagline: 'This website — a Zork-style text adventure portfolio',
    description:
      'A text adventure portfolio site where visitors explore rooms, solve puzzles, and converse with an AI dungeon master powered by Claude Sonnet. Features a CRT terminal aesthetic, procedural room generation, five different entrance puzzles, ambient audio soundscapes, and ASCII art throughout. Built with React, Vite, Node.js, and the Anthropic API. You\'re looking at it right now.',
    status: 'Active',
    role: 'Solo Developer',
    links: [],
  },
]

export default projects
