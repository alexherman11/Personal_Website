const projects = [
  {
    id: 'agora',
    name: 'Agora',
    tagline: 'A place-based social media app built on LLMs and maps',
    status: 'Active — Senior Project',
    role: 'Solo Developer',
    links: [],
    fullDescription: `#### Background
I came up with this idea when I realized what I could do with Language Models. I came to realize that they weren't just some glorified autocomplete. They were capable of things that could change the world. I already knew how I wanted to change the world so I just had to find where these two things overlapped and I shockingly settled on building an app. A social media. It came to be called Agora through a shocking coincidence where I asked Claude to give me about a 100 names from myth, math, nature, arcane, sci-fi etc. I wanted something like Google. Agora stood out to me, for its obviously relevant history and nice form and factor. I separately had Gemini do research on past social media success and failure and help me identify where I could come in. Not only did this report form the backbone of my project's vision, it also tentatively named the project 'Agora', completely unprompted.

#### The Vision
Agora is a project that has changed and evolved and become something nothing like what it was when I started. The problem hasn't changed much. Current social media isn't social. Who uses Instagram to go meet people? Who uses Facebook for something other than marketplace or to share photos of their too-perfect-to-be-real kids and get pushed things by an attention-trained algorithm. This is not what people want. But what do they want?

I think people want community. I think people want place and home and friends. I wanted to know how I could help do this and so I thought and asked Claude for help. Here's the idea. We make an app where there's no infinite feed, no aggressive feed, no attention economy, no ads. What does it do then? It centers on two things. A great, cheap AI interface and a map.

#### The AI
I came up with the idea of routing between different providers and models after interacting with the website LLM-council. It allowed you to ask multiple models at the same time and compare or merge answers. I had found it incredibly powerful but limited by its interface and lack of connections. It was also clearly too expensive for most use cases. What if we could come up with a way to determine difficulty of the prompt and route it to the best model every time? Research showed me that I was not the only one to think about this, but I was surprisingly one of few. What if the AI had access to all your data, always routed to the best (and cheapest) model for the task, and could take actions on your behalf?

#### The Map
But the AI is only half the story. I needed to do something unique. Drawing from Zenly I had the idea of adding tons of things to a beautiful customizable map, the central canvas of the app. The map is populated with whatever is relevant and interesting to you and your communities. Club meetings might show up on a college campus next to a cool mural someone pinned. At a local park there might be a time trail for skateboarding along a path and a warning about a broken swing. The map holds communities (which I decided should all be place based, as opposed to say r/atheists). Each community gets their own page which through the app's own AI, they can style however they want. In fact every user has full control over their interface.

#### The Kernel Architecture
Through my exploration of user-customizable interfaces, Claude suggested the genuinely novel architecture of the Kernel. The idea is simple. Make the app work like an OS. The kernel is light and runs over a simple message bus that can handle formatted queries. Permissions are enforced and apps and agents can tune into whatever interests them. This means that everything that gets created in the app (ranking algorithm, community page, chess tournament etc) can be modified in user space without breaking anything. It's kind of like selling a kitchen with lots of different sockets which you can plug whatever you want into, rather than saying here's a dishwasher, deal with it.

#### Agents
Agents are an incredibly important part of the vision. I believe in agent autonomy but I also believe they can help us. Users can create daemon style agents that listen for bus events and execute actions. But what about the future where agents exist on their own, caring for their community? They build relationships with their constituents, work to improve their community, grow in size. There's an endless horizon here.

#### Democracy
Inspired by digital democracy efforts like policykit.ai in Taiwan, I felt that a digital commons needed something better than gross Discord mod style moderation. I wanted something that felt democratic and open while remaining scalable. This led me to the ideas of peer juries, community votes, and open access. Despite creating an inclusive space you will always find people who don't want to respect others or follow the rules. These people deserve a fair trial by their peers and I think that my app should implement that. I also think that community decisions are currently sitting in the hands of some amorphous city council who decides things for people and places all the time they will never visit or meet. How cool would it be if I was pushed things to vote on that were actually relevant to my street, my school, my financial aid?

#### Independence
This project is not to make me money. If I ever made enough money to live off based on a small cut off the top of some $5/month subscription costs, I would like to use it to pay for other app developers to help me. I wouldn't want to be central. I want the movement to create itself. I just want to lay the groundwork. For me that means relying heavily on distributed and secure communication like Matrix. It means communities have full control of how they operate. It means organized anarchy. It means there is a constitution that the app follows as a whole that is created by the users, not me or some oligarchic group of stakeholders. It means there is no capital investment. It means I created a new public good.`,
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
  {
    id: 'the_depths',
    name: 'The Depths',
    tagline: 'This website — a Zork-style text adventure portfolio',
    status: 'Active',
    role: 'Solo Developer',
    links: [],
    fullDescription: `#### Overview
A text adventure portfolio site where visitors explore rooms, solve puzzles, and converse with an AI dungeon master powered by Claude Sonnet. Features a CRT terminal aesthetic, procedural room generation, five different entrance puzzles, ambient audio soundscapes, and ASCII art throughout. Built with React, Vite, Node.js, and the Anthropic API. You're looking at it right now.`,
  },
]

export default projects
