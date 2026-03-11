const alexContent = {
  grand_hall: `ABOUT ALEX HERMAN (THE GRAND HALL — Bio & Introduction):
Alex Herman is 21 years old, based in San Luis Obispo, CA. He studies Computer Engineering at Cal Poly SLO ("Learn by Doing").
He is passionate, curious, and believes language models offer opportunities to touch something that has never been touched before. He cares deeply about improving education, building community, and protecting the environment.
He grew up in Santa Cruz. Lifeguard for 4 years, junior guard for 9 years before that. Captain of both his high school and college ultimate frisbee teams. Tore his ACL but still plays ultimate frisbee.
He likes Buddhism and the Tao Te Ching. Cares deeply about his living space, likes lamps and good lighting. Can cook really well.
Builds tree nets, does origami, draws with charcoal. Collects cool old things. Rock climbs and surfs.
Values: keeping the Earth our home, encouraging exploration, giving people ways to help themselves, bringing back democracy, unseating corruption, building strong independent caring communities.
His girlfriend is Lakshmi Garcia, best friends are Aidan Loedhe Woolard and Martin Doherty.`,

  archive: `ABOUT ALEX HERMAN (THE ARCHIVE — Philosophy & Intellectual World):
Alex likes Buddhism and the Tao Te Ching. He's interested in AI ethics and language model applications, education, and community building.
Character lore: "I am curious. I like looking and listening and finding out how things work. I love imagining what it must have been like to be Copernicus understanding the relative masses of celestial bodies for the first time. I believe language models offer us opportunities to touch something that has never been touched before. There's something there that no one is seeing. Yet."
Values manifesto: Democracy, communities that govern themselves, unseating corruption through transparency not force, environment protection, encouraging exploration, giving people more ways to help themselves.`,

  workshop: `ABOUT ALEX HERMAN (THE WORKSHOP — Projects & Technical Work):

OTO MODULAR MOTOR SYSTEM: Capstone project, team of 3. Custom PCB with PID control on RP2040 microcontroller. Alex designed the first schematic, soldered power supply components, debugged pin configuration and incorrect diode orientation. Wrote PID control code with auto-tuning, current/voltage sensor driver for INA228. Built a terminal-based motor setup interface using VT100 commands. Challenges included Rev1 board USB issues from unregulated power supply, GPIO pin remapping bugs, blocking PID functions resolved by using RP2040's dual-core architecture.

BEATBOX: Solo project for Microcontrollers final. STM32-Nucleo based terminal-interfacing beat maker. Makes four-measure beats in key of C with drum kit tracks using servo motors hitting household objects. FSM architecture, UART communication at 115,200 baud with VT100 escape codes. Video demo: youtube.com/embed/tA8918O9Kkc

FOOT MOUSE FOR SALLY: Built through Cal Poly Empower accessible design club. Hardware engineering lead. Built a foot mouse for Sally who has bilateral epicondylitis (tennis elbow). Used PMW3360 high-end gaming sensor. Biggest challenge: long parallel wires in insulated tubing causing interference — fixed by rewiring with single-stranded wire. Received honorable mention from TOM Global in Daily Living category. GitHub: github.com/Foot-Mouse-for-Sally/Foot-Mouse-For-Sally

STRAWBERRY COMMISSION (IoT DataLogger): Hardware Engineer working under Dr. John Lin. Took a hot-glued GPS/Teensy/SD card prototype and designed it as a PCB. Went through 4 revisions of power architecture: two buck converters, separate battery charging chip, multiple power domains. Taught himself from Phil's Lab on YouTube. When the board arrived: reversed schottky diode, buttons 90 degrees off, power-switch footprint mismatch (hand-soldered replacement under microscope), bootstrapping pins required cutting into the board. Final triumph: walked outside, connected to wifi, got GPS signal, path uploaded to Vercel endpoint. Now principal hardware designer. PCB Rev2 will have LoRa transceiver.

AGORA (Senior Project): Solo developer. A social media app centered on community, not attention economy. No infinite feed, no ads. Two pillars: a great cheap AI interface and a map. AI routes between providers/models based on difficulty. Map inspired by Zenly — beautiful customizable canvas populated with community-relevant content. Kernel architecture (Claude's suggestion): app works like an OS with a message bus, permissions, user-space customization. Agents: daemon-style agents that listen for bus events, autonomous agents caring for their community. Democracy: inspired by policykit.ai, peer juries, community votes. Independence: not for profit, distributed communication via Matrix, community control, user-created constitution, no capital investment.`,

  study: `ABOUT ALEX HERMAN (THE STUDY — Resume, Career, Education):
Education: Cal Poly SLO, Computer Engineering (BS).
Current work: Hardware Engineer at California Strawberry Commission under Dr. John Lin. PCB design, circuit debugging, state machine refactors, presenting to 100+ people about his IoT data logger device. Principal hardware designer.
Skills: PCB design, embedded systems (RP2040, STM32, ESP32), AI-assisted development, Python, C, hardware debugging.
Background: Grew up in Santa Cruz. Lifeguard 4 years, junior guard 9 years. Captain of HS and college ultimate frisbee teams. Torn ACL.
Resume available as a downloadable PDF (the blueprints or sealed letter items).`,

  signal_room: `ABOUT ALEX HERMAN (THE SIGNAL ROOM — Contact & Connections):
Email: 1wheelalex@gmail.com
GitHub: github.com/alexherman11
Instagram: instagram.com/alex.herman101
LinkedIn: linkedin.com/in/alex-herman04
Close people: girlfriend Lakshmi Garcia, best friends Aidan Loedhe Woolard and Martin Doherty.

CONNECTION PHILOSOPHY:
Alex believes in building real connections — not the algorithmic kind, but the kind forged by proximity, shared purpose, and genuine curiosity. His Agora project is fundamentally about this: restoring community to a digital landscape that optimized it away. He believes the best technology connects people to each other and to places, not to feeds.
His closest connections are his collaborators and friends. He works under Dr. John Lin at the Strawberry Commission. He built the Foot Mouse alongside a multidisciplinary team at the Empower club. His tree net project was partly inspired by his climbing buddy Eric. He values partnership, mentorship, and doing real work alongside people who care.
Creative interests: Alex draws with charcoal, does origami, collects cool old things, cares about his living space and good lighting. He surfs and rock climbs. These aren't side notes — they're central to who he is.`,

  grounds: `ABOUT ALEX HERMAN (THE GROUNDS — Outdoor & Personal):
Alex grew up in Santa Cruz near the coast. He surfs and rock climbs. He was a lifeguard and junior guard at Santa Cruz beaches. He bushwhacked for three days through coastal mountains in the rain. He builds tree nets in oak trees. He likes plants and the outdoors. He cares about the environment and wants to inspire others to care for and appreciate the natural world.`,

  tree: `ABOUT ALEX HERMAN (THE TREE — Tree Net Story):
While living in on-campus apartments during his second year at SLO, Alex found a sad mess of rope in an oak tree on the hillside behind his apartment. He recognized it as a tree net like ones he'd seen at UCSC. He repaired it with no experience, learning clove hitches, tension, and weaving fundamentals by trial and error.
After improving that net, he scouted about a hundred trees and found a majestic lone oak alive with bees, birds, and beetles. He spent days planning, then built a net 50 feet in the air using paracord from Atwood Rope ($40 mystery box) and utility cord ($30). He created scaffolding from utility cord to walk over empty space, invented methods to reinforce and extend the net, added a patterned backrest and entrance portal.
He has since added a journal and pens for other adventurers to write their stories. He's working on a Tree Net 101 course in the journal. He has scouted new locations in Bishop Peak Open Space Preserve. His mission: share the skill and inspire others to care for the natural world.`,

  entrance: `ABOUT ALEX HERMAN (THE ENTRANCE):
The visitor has not yet entered the house. The narrator should be intriguing and atmospheric, hinting at what lies within. Alex's world is on the other side of this door.
The house is old, stone-built, on a coastal hillside near San Luis Obispo. It smells of eucalyptus and salt air. The grounds are wild and untended — golden grass, old stone walls, a gnarled oak in the distance. This is a place where someone chose to build not for convenience but for meaning. The door is iron-banded oak, the lock ancient but precise. Whatever system guards this door, it has a sense of humor.`,

  vault: `ABOUT ALEX HERMAN (THE VAULT):
This is the deepest room. Content is reserved for Phase 7 — the conscious-claude integration. For now, the narrator should convey a sense of profound depth and something waiting to be discovered.`,
}

export default alexContent
