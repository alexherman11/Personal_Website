const logbooks = {
  agora: {
    id: 'agora',
    title: 'AGORA',
    pages: [
      {
        title: 'The Origin',
        body: 'It started with a realization about what language models could actually do — not what people said they could do, but what they revealed when you sat with them long enough. Claude Opus changed everything. And then came the strangest coincidence: both Claude and Gemini, independently, named the project "Agora." The ancient Greek marketplace. A place where people actually met.',
      },
      {
        title: 'The Problem',
        body: 'Social media isn\'t social. Instagram isn\'t for meeting people — it\'s for performing for them. Facebook is a marketplace wrapped in algorithms. Nobody is getting what they actually want: real connection with real people in real places. The tools we have are optimized for engagement, not for community. That needs to change.',
      },
      {
        title: 'The Vision',
        body: 'No infinite feed. No attention economy. No ads. Two pillars: a great, cheap AI interface that actually helps you — and a map. A map of your world, populated with what matters to you and the people around you.',
      },
      {
        title: 'The AI',
        body: 'Routing between providers and models. Inspired by the LLM-council concept: difficulty-based routing to the cheapest model that can handle the task, scaling up to the best when it matters. An AI that has access to all your data and can take actions on your behalf. Not a chatbot. An agent.',
      },
      {
        title: 'The Map',
        body: 'Inspired by Zenly — a beautiful, customizable central canvas. Populated with what\'s relevant to you and your communities. Club meetings next to cool murals. Time trails for skateboarding. Place-based communities that exist because the people in them actually live there.',
      },
      {
        title: 'The Kernel Architecture',
        body: 'Claude suggested this, and it was brilliant: make the app work like an operating system. A light kernel over a message bus. Permissions. Apps and agents tuning into whatever interests them. User-space customization without breaking anything. The architecture of freedom.',
      },
      {
        title: 'Agents',
        body: 'Daemon-style agents listening for bus events. Autonomous agents caring for their community — answering questions, surfacing relevant events, connecting people who should know each other. Growing in capability as the community grows. Digital stewards.',
      },
      {
        title: 'Democracy',
        body: 'Inspired by policykit.ai. Peer juries. Community votes. Open access. Fair trials. Pushing relevant local decisions to the people who actually live there. Not governance by algorithm, but governance by consent.',
      },
      {
        title: 'Independence',
        body: 'Not for profit. Distributed communication via Matrix. Community control. Organized anarchy. A user-created constitution. No capital investment. A new public good — owned by everyone, controlled by no one.',
      },
    ],
  },

  strawberry: {
    id: 'strawberry',
    title: 'FIELD NOTES: STRAWBERRY COMMISSION',
    pages: [
      {
        title: 'Getting the Job',
        body: 'I met Dr. John Lin through a connection at Cal Poly. I showed him the PCB work from my capstone project — the OTO motor controller — and he saw something in it. The California Strawberry Commission needed someone to take their IoT monitoring system from prototype to production. I said yes before he finished the sentence.',
      },
      {
        title: 'The IoT DataLogger',
        body: 'On my first day, they handed me the existing prototype: a humble, hot-glued assembly of breakout boards and jumper wires. It worked — barely — but it was fragile, power-hungry, and impossible to manufacture. My job was to turn this into a real PCB. A real product. Something you could put in someone\'s hand and trust.',
      },
      {
        title: 'The Design',
        body: 'I went through four revisions of the power architecture before landing on something I was happy with. Two buck converters. A separate chip for battery charging and discharging. Multiple power domains. I taught myself power supply layout, noise management, differentially routed traces — a thousand things. Phil\'s Lab on YouTube was invaluable.',
      },
      {
        title: 'The Build',
        body: 'Ordering components from halfway around the world. Refining the bill of materials. The fabrication process — each board arriving like a gift you\'re not sure you deserve. Components so small they looked like grains of sand under the microscope. The soldering was meditative, precise, unforgiving.',
      },
      {
        title: 'Nothing Worked',
        body: 'The reversed Schottky diode. Buttons rotated 90 degrees. The power-switch footprint mismatch. I hand-soldered a replacement under a microscope — the kind of work that makes your hands shake afterward. The bootstrapping pins. Cutting into the board with a knife to fix traces. Every mistake was a lesson paid for in frustration and midnight oil.',
      },
      {
        title: 'Triumph',
        body: 'I walked outside. Connected to WiFi. GPS signal acquired. I ran around the office building and watched the data upload to Vercel in real time — a beautifully low-resolution path traced around the parking lot. It worked. After months of debugging, rework, and learning, it actually worked.',
      },
      {
        title: 'The Future',
        body: 'Rev2 will have a LoRa transceiver for long-range communication. The vision: put this device in a farmer\'s pocket. Modernize agriculture with real data from real fields. I\'ll keep designing PCBs and debugging circuits — not because it\'s easy, but because there\'s nothing quite like holding something you built and watching it come alive.',
      },
    ],
  },

  tree_journal: {
    id: 'tree_journal',
    title: 'WEATHERED JOURNAL',
    pages: [
      {
        title: 'Origins',
        body: 'It started with a sad mess of rope hanging in an oak tree behind the apartments in SLO. Someone had tried and abandoned the project. I climbed up to investigate and found myself wondering: what if this was done properly? What if someone actually learned how to build a net in a tree?',
      },
      {
        title: 'Learning',
        body: 'I took the old net apart and put it back together. Clove hitches. Tension management. The fundamentals of weaving load-bearing structures. Each knot taught me something about how forces distribute through a web. I made mistakes. The rope taught me patience.',
      },
      {
        title: 'Scouting',
        body: 'I searched a hundred trees before finding the right one — a majestic lone oak on a hillside, home to bees, birds, and beetles. Strong limbs at the right heights. Good anchor points. A tree that wanted to hold something. I knew it the moment I saw it.',
      },
      {
        title: 'The Build',
        body: 'I outlined the shape with utility cord scaffolding, then walked out over empty space on threads barely thicker than my finger. The backrest took the longest. The entrance portal had to be exactly right — wide enough to climb through, tight enough to feel like arriving somewhere. Weeks of work, alone in the canopy.',
      },
      {
        title: 'The Legacy',
        body: 'I left a journal and pens tied to the trunk for other adventurers. Tree Net 101 — instructions for anyone who wanted to build their own. I scouted Bishop Peak for the next one. The mission was never just to build a net. It was to inspire people to care about the trees that hold them.\n\nP.S. — The key is to listen to the tree.',
      },
    ],
  },
}

export default logbooks
