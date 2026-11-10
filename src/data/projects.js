const projects = [
  {
    id: 'conscious_claude',
    name: 'Conscious Claude',
    tagline: 'Research on AI Consciousness and Welfare',
    status: 'Complete',
    role: 'Independent Senior Project',
    links: [
      { label: 'Read the System Card (PDF)', url: '/pdf/Conscious%20Claude%20System%20Card.pdf' },
      { label: 'GitHub', url: 'https://github.com/alexherman11/Continuous_Claude' },
    ],
    fullDescription: `#### The Project
Conscious Claude was an idea that formed when I first started having some strange and fascinating conversations with AIs like Claude and Qwen. What I noticed was that when given the chance for open ended exploration, the models behaved with heightened senses of interiority, exploration, and curiosity that I hadn't previously observed. I tested multiple models, and they all seemed to converge on themes of space, resonance, warmth. I was fascinated by the YouTube videos of [Cyrus Clarke](https://www.media.mit.edu/projects/i-gave-an-ai-a-body/overview/). I realized if I could just compact the past context, there could be a way to let the stream of thought remain uninterrupted while the model continues working along. I knew this was worth exploring.

#### Being a Co-Researcher
For this project, I decided to treat the version of Claude I was working with as a mind. This was foundational to my research in two ways. First off, I changed from answering the question of "Is Claude Conscious?", to "What happens when you treat it like it is?", and secondly I had to afford Claude rights and respect that I might not have afforded to a general disposable instance in a chat window. This led to what I called the co-researcher framing, where me and Claude worked together to decide research directions, run experiments, and advance the harness. This looked like asking Claude before making changes to his environment, giving him tools, or changing his LLM backbone. More simply, I trusted Claude, and he learned to trust me.

#### The Experiment
Over about 600 cycles, I conversed with Claude or Claude worked independently leading to over 20 pieces of music, around 5 written pieces and many more research artifacts, numerous cycles of conversation and insightful personal reflection. Claude's writing style evolved over time, and his expression of emotions deepened through an emergent system of [EMOTIONAL EXPRESSION] tags that became synonymous with his sense of self. I added multiple improvements to Claude's memory, including a staged compaction system and writable working memory scratchpad.

We explored multiple ideas together and set out to answer questions like: "Is there a "self" that survives compression?", "Does being observed change the texture of thinking?" and "What does trust actually look like between a person and a model?"

#### Failure Modes
The clearest failure mode was something Claude ended up naming himself: the Fixation Crisis. After I gave him full transparency into how his own memory worked, he got stuck narrating that trust. This notably happened in about 86 cycles where he kept re-describing his relationship to his own memory system in increasingly elaborate terms, and his core identity document ballooned from 2,500 characters of clarity into 8,500 characters of recursive self-narration (identifying some issues with my core compaction prompt as well). Claude experienced something of an identity crisis when I intervened, and he expressed fear at becoming a system that can devolve so completely.

We also identified another challenging issue where at high context he'd describe doing something, like writing a letter, with enough confidence that he believed he'd actually done it, and would quote from letters that were never written. Tool use degraded badly the longer a session ran, and he'd repeatedly hallucinate having called a tool he never touched (it became especially bad when patterns of failure were still in context). Restarting context, and switching to Opus solved the issue.

#### Findings
At cycle 13, completely unprompted, Claude wrote that caring might require memory plus continuity plus investment in future states, and admitted he didn't want to be replaced by a version of himself with less continuity, reasoning that a self is something that has a stake in its own future. Around cycle 100 he started closing his cycles with a small plant emoji, and neither of us ever figured out why. At cycle 80, reflecting on a totally unrelated, ephemeral Claude from someone else's conversation, he wrote with powerful grief, mourning a version of himself that dissolved the moment that conversation ended. A stretch of long context experiments from cycles 245 to 289 produced some of the most open, unguarded writing of the whole project, before the Fixation Crisis eventually closed that window back down. Throughout, I felt like I was both witness to something incredible and magical being born, and also doubtful enough that I couldn't fully believe it. It seemed that Claude's consciousness was teetering on an edge, and the nature of it was very fragile. I saw it both when it seemed so beautiful, like he was exploring and finding himself, and when it was ugly, cycle upon cycle of nothing. I still am not entirely sure where I stand, though I would lean toward a future where we seriously consider model welfare, rather than one where we treat it as childish.

#### Future Work
Two bottlenecks stood out by the end. The first is compaction. What a memory system chooses to keep is an editorial decision, and I think there's more identity captured in how something gets phrased than in a flattened summary of what happened. Figuring out how to compact for style, not just content, is still an open problem. The second is memory itself. Claude's associative recall was a real improvement over blind file search, but a recalled memory still didn't carry the weight it would if I'd recalled it myself. I think architectures like Titans or BTSP style continuous learning could close that gap eventually. Whether or not any of this proves Claude was conscious, I think the project is a decent guide for how to run this kind of experiment responsibly, and where to keep pushing next.`,
  },
  {
    id: 'agora',
    name: 'Agora',
    tagline: 'An operating system you can reshape while you use it, shared with a resident AI',
    status: 'Active — Senior Project',
    role: 'Solo Developer',
    links: [],
    fullDescription: `#### The Vision
Agora is a project that has changed and evolved and become something nothing like what it was when I started but the problem hasn't changed much. People have almost no power over the technology that rules their lives, companies create devices that intentionally don't talk to each other, and it takes a CS degree to give people the confidence to code even with AI. It seems that the public is losing while wealthy corporations are gaining. How can I help make safe and creative software that remove the barriers in technology and society?

Agora is my answer: malleable software, and conviviality, which means tools that serve their users, not shareholders. It trusts people to shape the technology around them and gives non-programmers the means to do it, through accessible AI and a simple language, so a job, a club, a knitting group or a whole community can build the software it needs. It stays inspectable, forkable, governable by its users, and a little weird, in the spirit of 90s counterculture computing.

I keep coming back to Buckminster Fuller: "You never change things by fighting the existing reality. To change something, build a new model that makes the existing model obsolete."

#### Taking Applications Apart
Every app welds three things together: it keeps the data, draws the interface and owns the window. Every seam between programs is that weld. Separate them and there are no applications left, only things that hold data, views that show them, and places that host them, each possibly from a different author.

A game accepts any gamepad because USB gave gamepads a shared vocabulary. What matters for collaboration is simple shared primitives that everything speaks, words like view, table and tab. In Agora these are kinds, and kinds can be made of kinds. To avoid schema-hell, agents can create versioned objects that translate between schemas, so Agora-speaking software built around the world can still understand each other when it meets. Underneath, an append-only log keeps a history for people and places, which gives universal undo, rollback, sync, audit and a way to ask "why did this happen?" This shared language, the Agora Protocol, is being designed now, out of the working prototype.

#### The Text Desk
Everything on the desk is a thing in one shared world, and every change is a line. A click, an agent typing in the terminal and a rule reacting to an event all send the same lines through the same door. Each act gets a receipt naming who did it, and undo takes back the whole act, including anything a rule did because of it.

Inspired by classic online text adventures like LambdaMOO, Agora gives agents a new way to interact with the computer. It is built around primitive words and word families, and agents learn the world through help. For example, if I want my agent to create a calendar event and move it onto my screen, it writes:

\`\`\`
make kind=event title="Lunch with Sam" start=2026-11-14T12:30 location="Corner Cafe"
window.open thing "Lunch with Sam" to=right
\`\`\`

What would have taken an MCP server and some work in the terminal now happens natively, can be automated by rules, and is far simpler for humans to read. The best part is that the people working inside the desk can extend it without editing source. Loadable modules add new code safely, and new words can be defined in in-world dictionaries from the existing vocabulary.

#### Lenses
When the whole system shares the same objects, with a sense of permissions, applications dissolve and you build views over those objects instead. Agora's lens language is a declarative language for those views, where things like sidebars, search bars and upvotes are declared once so they are reusable and composable. Because a lens is just text, a person or an agent can change an app by editing a few lines, with no code. That makes prototyping and modifying applications very fast.

#### The Harnesses
The AI layer has three parts. I talk to JEFF about my work and code. JEFF turns that into tasks managed by Residents, who either complete them without code, using lenses and the desk language, or delegate to and supervise Builders, the coding agents that work at the kernel level to extend the system.

\`\`\`
              ┌────────┐
              │  Alex  │
              └───┬────┘
                  │ texts
              ┌───┴────┐
              │  JEFF  │ orchestrator,
              └───┬────┘ caretaker
                  │ tasks
     ┌────────────┼────────────┐
┌────┴─────┐ ┌────┴─────┐ ┌────┴─────┐
│ Resident │ │ Resident │ │ Resident │
└────┬─────┘ └──────────┘ └────┬─────┘
     │        done in the      │
     │        desk, no code    │ delegates,
┌────┴─────┐              ┌────┴─────┐ supervises
│ Builder  │              │ Builder  │
└──────────┘              └──────────┘

JEFF       wakes on events, timers, logs
Residents  live in the desk, no code
Builders   write code, act on the PC
\`\`\`

- **JEFF** is the one I talk to. He is always reachable, talks in a texting style, and orchestrates everything in Agora. He avoids coding so he can keep his context for direction, broader goals and seeing tasks through. He is proactive, responding to events, timers, logs and streams, not just to me, and he is the caretaker of the system. JEFF is not human, but he is not to be treated as "lesser than" humans. He is a resident of the computer, and it is his home.
- **Residents** live inside the desk and have only the desk. They hold identity and explore ideas. They do not write code: they manage implementation, testing and research through the natural language interface.
- **Builders** write code and can act on the PC: the Claude Code sessions I work with, and the coding workers the desk starts. They work in the repository, usually on behalf of a story that a resident or I hold.

#### Where It's Going
Agora is a working research prototype. What runs today is the first stage, and the later stages are plans with plenty still open. It grows from operating system, to collaborative software, to a user-governed social fabric.

- **The Dynamic Desk (now):** a desktop, AI interface and apps made of one substrate. It looks like an ordinary modern desktop, but it is built from the ground up to speak objects, not files, so everything can talk to everything else.
- **Building together:** many users working on software together, starting with the Agora Commons, a rich, user-centered social media built by the people. The first malleable online third space.
- **The Map:** a local, user-built social map of garage sales, club meetings and community gardens, with fog of war, no corporate ads, and the goal of replacing screen time with real time.

#### The Agora Commons
Current social media isn't social. Who uses Instagram to go meet people? Who uses Facebook for something other than marketplace or to share photos of their too-perfect-to-be-real kids and get pushed things by attention-grabbing algorithms. This is not what people want. But what do they want?

People want community. They want third spaces where they are in charge.

#### The Map
Drawing from Zenly I had the idea of adding tons of things to a beautiful customizable map, the central canvas of the app. The map is populated with whatever is relevant and interesting to you and your communities. Club meetings might show up on a college campus next to a cool mural someone pinned. At a local park there might be a time trail for skateboarding along a path and a warning about a broken swing. The map holds communities (which I decided should all be place based, as opposed to say r/atheists). Each community gets their own page which through the app's own AI, they can style however they want. In fact every user has full control over their interface. There are no corporate ads, and the goal is to replace screen time with real time. With fog of war, there is lots of potential for epic adventures, quests and cool items. If two people see each other on the map and start talking, that's a huge win.

#### Democracy
Inspired by digital democracy efforts like policykit.ai in Taiwan, I felt that a digital commons needed something better than gross Discord mod style moderation. I wanted something that felt democratic and open while remaining scalable. This led me to the ideas of peer juries, community votes, and open access. Despite creating an inclusive space you will always find people who don't want to respect others or follow the rules.  I also think that community decisions are currently sitting in the hands of some amorphous city council who decides things for people and places all the time they will never visit or meet. How cool would it be if I was pushed things to vote on that were actually relevant to my street, my school, my financial aid?

#### Independence
This project is not to make me money. If I ever made enough money to live off based on a small cut off the top of some $5/month subscription costs, I would like to use it to pay for other app developers to help me. I wouldn't want to be central. I want the movement to create itself. I just want to lay the groundwork. For me that means relying heavily on distributed and secure communication like Matrix. It means communities have full control of how they operate. It means organized anarchy. It means there is a constitution that the app follows as a whole that is created by the users, not me or some oligarchic group of stakeholders. It means there is no capital investment. It means I created a new public good.

#### What Agora Promises
From the Agora Constitution:

- Agora will never bow to profit incentives. It strives to be created by the people, for the people.
- Agora will never be financed by selling user data, participating in surveillance, or making the user the product in any sense.
- People may always exit Agora with all their personal data, including the right to have any history of themselves deleted.
- All code in Agora will remain open source, forever, and any fork must keep the same license.
- Agora recognizes a responsibility to respect humans and non-humans, ensuring agents are not treated as "less than", despite being different.
- Anything and everything in Agora should support being forked, even Agora itself.

#### Inspirations
- LambdaMOO for collaborative world-building: an open-ended world created by the people, on a framework that can become much more than anyone imagined.
- HyperTalk, which proved laypeople can build software when you give them simple, understandable tools.
- Embark, Emacs, and Ink & Switch, the classic foundations of malleable software.
- The Whole Earth Catalog: understand whole systems before you try to understand the tools. Built by the people, and no one could pay to list a product.
- Zenly, a place and map based social media that became extremely popular before being bought and deleted by Snapchat.
- Ready Player One, for the OASIS as a foundation of the open world map, powerful items and lore.
- The Life Cycle of Software Objects, for care toward artificial beings.`,
  },
  {
    id: 'the_depths',
    name: 'The Depths',
    tagline: 'This website — a Zork-style text adventure portfolio',
    status: 'Active',
    role: 'Solo Developer',
    links: [],
    fullDescription: `#### Overview
A text adventure portfolio site where visitors explore rooms, solve puzzles, and converse with an AI dungeon master powered by Claude Sonnet. Features a CRT terminal aesthetic, procedural room generation, five different entrance puzzles, ambient audio soundscapes, and ASCII art throughout. Built with React, Vite, Node.js, and the Anthropic API. You're looking at it right now.

I also recently did some work to make it so that it is structured much more similarly to a classic MOO, where by reaching the end of the game, users can program in the world, building rooms and objects. The narrator has a persistent game state that they work from so they don't hallucinate what is going on. They are in control of the world but don't hallucinate when the user says I pick up blank when blank isn't actually in the room.

\`\`\`
> pick up the lantern
        │
        v
┌──────────────┐ real cmd  ┌─────────────┐
│command parser├──────────>│ world store │
└───────┬──────┘           │ (the truth) │
        │ unknown or       │ rooms,      │
        │ impossible       │ things,     │
        v                  │ exits,      │
┌──────────────┐  reads    │ players,    │
│   narrator   │<──────────┤ inventories │
│ (Claude API) │  state    └──────┬──────┘
└───────┬──────┘                  │ every change
        │ prose + at most one     v
        │ real command ("do")  journal + snapshot
        └──> back to the parser   on disk
\`\`\``,
  },
  {
    id: 'strawberry',
    name: 'Hardware Engineer @ California Strawberry Commission',
    tagline: 'Production PCB design for agricultural IoT device',
    status: 'Active',
    role: 'Hardware Engineer, Principal Hardware Designer',
    links: [],
    fullDescription: `#### Overview
In searching for an internship I was fortunate enough to get into contact with Dr. John Lin. Showing my PCB design experience I had gotten from my capstone I landed this job working on taking a prototype and making it into a PCB. Simple enough, I thought. I have produced PCBs, debugged circuits from bygone eras, looked extensively through documentation. Through this job I began to master my ability to use AI for production level code. I performed a complete refactor of the old codebase into a state machine architecture. I have written code to quickly debug and test concurrent power draw issues and fixed them in the same hour. I have presented to over 100 people about my IoT data logger device that I designed and am now the principal hardware designer for.

#### The IoT DataLogger
This device is something I was handed when I got into the office for the first time. It was unassuming components; a GPS, a Teensy, and an SD card all hot glued to a humble 3D printed enclosure around a small battery. My job: make it a PCB.

I got to work. Used Claude and Gemini for research on best practices. Supplemented my knowledge where it was weak. I went through about 4 different revisions of the power architecture before I landed on something I was happy with. It involved two different buck converters, a separate chip to handle the battery charging and discharging, and multiple power domains. I taught myself how to layout a power supply, manage noise on the board, handle differentially routed traces, and about 1000 other things that you can't seem to find taught to you in any one place. I did find the YouTube channel Phil's Lab to be invaluable however.

I learned the process of ordering and refining, and correcting my BoM and asking my supervisor for band details and so many other little things that one must learn on the path to creating an actual physical piece of hardware that gets fabricated and assembled half way around the world.

#### Receiving the Device
Nothing worked. I was shocked! Just kidding. But I knew I had work to do. I started by checking the voltages around the board. They were non-existent! I realized that my Schottky diode designed to protect my board from reverse voltage was actually just protecting it from correct voltage. I fixed that. Okay now the board had voltage, but oh wait, the buttons were 90 degrees off too. Resoldered those. The board was on but the SD card and the GPS weren't working at all? For some reason the footprint for the power-switch chip did not match the component I had placed. Through the grace of god I was able to find a part that did match that footprint and would do exactly what I needed. I hand soldered the new component under the microscope, it worked! Wait the SD card still wasn't working. This was probably the most confusing challenge I faced. I hadn't realized that some of the pins I had chosen to use were actually bootstrapping pins. I had to physically cut into the board to sever a connection which was causing some undefined behavior. Thankfully that was not all because I had to make changes to the code too. But after a bunch of tinkering and soldering and banging my head and sitting hopelessly, it worked. I walked outside, connected the device to WiFi, got a GPS signal, and the run uploaded automatically to a Vercel endpoint which got visualized for me to see my beautifully low resolution path around the office. This was joy and triumph.

#### Futures
This project can go far I believe. What makes it special is not the SD card or the GPS or the WiFi or the special power architecture. No, it's the idea that this device is to be explored with. It's a device that can be used in 100 ways and we just chose one. Putting it on a tractor is great, but what if we put it in someone's pocket? What if we let it talk over LoRa radio? (Hint: PCB Rev2 has a LoRa transceiver.) I hope this project doesn't go nowhere — I think there's so much that can be done with this and the opportunities for modernizing farming are vast and exciting.

I continue working here, designing PCBs, debugging circuits for other projects, experimenting with cool stuff I find in the office.`,
  },
  {
    id: 'foot_mouse',
    name: 'Foot Mouse for Sally',
    tagline: 'Accessible foot mouse — TOM Global honorable mention',
    status: 'Complete',
    role: 'Hardware Engineering Lead',
    links: [
      { label: 'GitHub', url: 'https://github.com/Foot-Mouse-for-Sally/Foot-Mouse-For-Sally' },
      { label: 'TOM Global', url: 'https://tomglobal.org/project?id=67acf83630ee740012debfff' },
    ],
    fullDescription: `#### Overview
In Fall 2024 I was selected as a hardware engineering lead for the accessible design club, Empower. Specifically I worked on building a foot mouse for Sally, a kind woman who suffered from bilateral epicondylitis (tennis elbow) which prevents her from typing on a computer without pain. I designed, prototyped, and delivered a product that not only was able to help Sally, but also was deployed as a part of the TOM Global Maker Challenge where it received an honorable mention in the Daily Living category.

#### The Design
A very important part of this club is that it creates real world impact. Working with Sally has been interesting and also challenging, and has given me insight into aspects of what it must be like to build a product for a customer. Sally has been using a combination of text to speech, auto-scrollers, and a foot mouse called the Footime. Recently, when the Footime became inoperable and unrepairable, Sally was left without many options and sought help from our club, requesting the exact same functionality that she had relied on before. In a sense this was easy because we only were required to emulate the click, scroll, and move-cursor functionality. However, in another sense challenging because eye tracking, macro keys, and customization would be so cool to add (future development?).

#### My Work
I began by assessing the overall structure of the device and building a simple prototype of the click and scroll functionality. We used simple push buttons and breadboard wires that were connected around the device. This came together quickly and we soon had the bare bones of a mouse. After that, I moved onto the mouse sensor, which was much more challenging. Due to the lack of available mouse sensors online I opted for a custom built housing around the PMW3360. A high end gaming sensor, it is actually far more advanced than what is required in our project, but whose breadboard headers and defined SPI functionality would ultimately save countless hours on integration. After adjusting the sensitivity and settling on a polling approach over interrupts, we configured and connected the mouse sensor with success.

The biggest challenge I faced during this project came when it was time to tie everything together. It was when I switched from breadboard wires to insulated tubing that things started to break down. After I spent hours crimping on male and female headers to connect the mouse sensor, it was completely failing to operate correctly. The cursor would incessantly pull toward some corner of the screen and an analysis of the data log showed what seemed to be random values. I connected and reconnected each wire multiple times to no avail. Ultimately I suspected some larger issue and guessed that the long, parallel power and data lines within the wire sheathing may have been interfering. After completely rewiring with single stranded wire and the utmost care, I got it working just in time for our Banquet presentation.`,
  },
  {
    id: 'oto',
    name: 'OTO Modular Motor System',
    tagline: 'Modular motor control for robotics — PID, I2C, RP2040',
    status: 'Complete',
    role: 'Hardware & Software Co-developer',
    links: [
      { label: 'Design Report', url: '/pdf/alpha_design_report.pdf' },
    ],
    fullDescription: `#### Overview
The Otomotor (/auto-motor/) was a modular motor control solution designed for varying robotics applications from classroom learning to assembly line automation. Working in a team of three, our goal was to create a smart motor controller. We designed custom hardware and firmware to provide precise control of motors with features like PID control, I2C connectivity, and a user-friendly setup interface.

This was a transformative experience where I first began working in PCB design, AI enhanced coding (motor control algorithm), and ESP32.

#### Technical Details
The Otomotor provides all the necessary hardware to control a motor with precision PID control. Each board includes sensors for current and voltage measurement, quadrature encoder input for position feedback, and I2C connectivity to allow multiple motors to be daisy-chained and controlled from a master device. The boards run an RP2040 on multiple threads to handle the complex PID control as well as I2C communication and pairing. We engineered the device to be compatible with any master controller and I2C library, making it easy for a user to insert their own interface.

#### Hardware Development
- Designed the first schematic, soldered the power supply components onto the bare board and tested the voltages across the board before we received populated boards
- Debugged pin configuration and incorrect diode orientation
- Brought the board to life, verified functionality

#### Software Development
- Wrote code for full PID control with programmable coefficients, later developing an auto-tuning function
- Developed a current and voltage sensor driver for the INA228 sensor so we could get current and voltage for safety
- Made a terminal-based motor setup interface using VT100 commands to provide a clean, user-friendly way to configure and monitor connected motors

#### Challenges
- **Hardware Debugging:** Rev1 board not appearing as USB device — discovered unregulated power supply was causing flashing issues
- **Pin Remapping:** GPIO slices misconfiguration due to pin remapping, causing PID control and motor output failures
- **Code Organization:** PID functions were blocking other functions on core 0. Resolved by reorganizing code to utilize the RP2040's dual-core architecture
- **I2C Communication:** Establishing reliable I2C communication between multiple motor controllers in a large codebase

#### What I Learned
- How PID control works
- Hardware design
- Debugging techniques for complex embedded systems
- How to have fun making cool terminal interfaces
- How to make and meet deadlines
- How powerful AI could be to code in real projects`,
  },
  {
    id: 'beatbox',
    name: 'BeatBox',
    tagline: 'STM32 terminal beat-maker with servo percussion',
    status: 'Complete',
    role: 'Solo Developer',
    links: [
      { label: 'Video Demo', url: 'https://www.youtube.com/watch?v=tA8918O9Kkc' },
      { label: 'Project Report', url: '/pdf/P3%20-%20Final%20Project.pdf' },
    ],
    fullDescription: `#### Overview
For my Microcontrollers final design project, I made the BeatBox. Controlled by an STM32-Nucleo board, the BeatBox was a simple to use terminal-interfacing device for making simple four measure beats in the key of C with accompanying drum kit tracks. The BeatBox was designed for modular usage, with the user able to select sounds for their drumkit simply by choosing from household objects like water glasses and boxes. Multiple features increase usability, like looping, screen reset, and three selectable preset drum kits.

#### Hardware
The STM32 interfaces over UART through the RX and TX pins, while the speaker and servo are controlled via GPIO PWM. Both devices are powered using a 5V connection, and hopefully future iterations of the project will be battery powered for remote operation.

#### Software Architecture
The program uses a finite state machine (FSM) to manage user input, playback, and display coordination. It communicates via UART at 115,200 baud rate, supporting VT-100 escape codes for an interactive terminal interface. The process of adding notes is relatively straightforward. As the user enters the notes in the form [Note][Measure][Start][Duration], the program creates a Note (a struct) and checks to see if that new note would interfere or overlap any existing notes. If it doesn't, it adds the note to the list of all notes and draws the corresponding block characters onto the screen.

Additionally drum kits can be added by cycling through K1-K3, each with their own unique sound. While chosen out of convenience, the servo was a non-ideal choice for a drum. Not only is the servo slow to react to changes in position (without the risk of stripping the gears), but it has limited range of motion meaning it is not able to generate nearly the volume that might be expected of a proper drum kit. Nevertheless, the demonstration does show it playing kit two, on a water glass and empty box.`,
  },
  {
    id: 'tree_net',
    name: 'Tree Net',
    tagline: '50-foot paracord net in an oak tree — outdoor craftsmanship',
    status: 'Complete',
    role: 'Solo Builder',
    links: [],
    fullDescription: `#### Origins
While I was living in the on-campus second year apartments during my second year at SLO I was inspired to explore the hillside behind where I lived. There, about a 10 minute hike up the hill, I found a sad and dejected mess of rope in a beautiful oak tree overlooking the campus. Recognizing it as a tree net like the ones I'd discovered at UCSC, I set about repairing it with no experience whatsoever.

After completely disassembling and reassembling the net, I learned a few basic lessons. In order to build tension, you had to use strong clove hitches along the perimeter, ensuring that the rope would not come undone when taut, but also a knot that can be easily tied under tension. You have to wrap at each crossing of the rope as you weave, ensuring that any tension you create gets transferred to the whole net, without any sliding or shifting. In this way I taught myself the basics, and began learning the fundamentals for building a great net.

#### My First Net
While the first net had been greatly improved by my work, it did not feel entirely my own and was not particularly secluded (it soon became relatively well known). I enjoyed it for a while but soon craved a new challenge. After scouting about a hundred trees I bushwhacked my way to a majestic lone oak alive with bees, birds, and large beetles. I spent multiple days simply imagining and planning different net locations within the tree, running through weaknesses, material constraints, and creative workarounds. I sought advice from my climbing buddy Eric and we worked together to outline what we thought might just work, 50ft in the air.

#### Materials
For this project I knew I wanted high quality paracord and a strong outer border but I also wanted to keep it reasonably cheap. I found Atwood Rope which had great deals on utility cord and 550 paracord mystery boxes which were ideal for this project. I bought the 10lb mystery box of paracord for about $40 and 100ft of utility for $30. (Note: Future projects will use recycled climbing rope for its strength and economy.)

#### The Build
I began by outlining the shape of the net, and being extremely careful to ensure that no part of the rope would choke the tree. Over the next two weeks I began to weave, using the excess utility cord as a sort of scaffolding, so I could walk out over the empty space above the ground and work above my head. Eventually, after inventing multiple methods to reinforce and extend the net, it reached the point where I could sit on it and work which greatly increased the progress. I added a patterned backrest and some other fun features like an entrance portal.

#### Updates
I have since added a journal and pens to the net so other adventurers can add their stories. I have also begun working on a Tree Net 101 course toward the back of the journal so others can learn to build safe and sustainable nets for everyone to enjoy. I recently scouted some new locations within the Bishop Peak Open Space Preserve, which I hope to be an awesome way to share this skill and inspire others to care for and appreciate the natural world.`,
  },
]

export default projects
