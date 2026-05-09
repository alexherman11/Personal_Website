const logbooks = {
  resume_letter: {
    id: 'resume_letter',
    title: 'A SEALED LETTER',
    pages: [
      {
        title: 'Cover',
        body: 'To whom it may find,\n\nIf you are reading this, you found the letter. It was sealed with care, but the seal was always meant to be broken.\n\nWhat follows is a brief account of the writer — Alex Herman, age 21, of San Luis Obispo. Read it the way you might read a note from a friend who is hoping for the chance to work with you.',
      },
      {
        title: 'Who I Am',
        body: 'I am a hardware engineer studying Computer Engineering at Cal Poly SLO. I grew up in Santa Cruz — nine years as a junior guard, four as a lifeguard. I captained both my high school and college ultimate frisbee teams. I bushwhacked three days through coastal mountains in the rain. I build tree nets, do origami, draw with charcoal, cook well, and collect old things. I love language models. I care about education, community, and protecting the world from the bad guys.',
      },
      {
        title: 'What I Build',
        body: 'PCBs that run real fields and real classrooms. Custom firmware on RP2040, STM32, and ESP32. Power architectures with multiple domains. AI-assisted code that meets deadlines. A foot mouse for a woman named Sally. A modular motor controller called OTO. An IoT datalogger now headed for strawberry farms. A social media app called Agora that does not have an infinite feed and does not run on ads.',
      },
      {
        title: 'How I Work',
        body: 'I learn by doing — the Cal Poly motto, but also a personal philosophy. I read the datasheet. I break the board, fix it under a microscope, and write down what went wrong. I treat language models like the most curious collaborator I have ever met. I write clean, clear code. I ship.',
      },
      {
        title: 'What I Want',
        body: 'I am looking for engineers, founders, and teams who care about the same things I do — building real tools that help real people, and making the world a little less afraid. I want to learn from people who are better than me. I want to ship things that matter. If that sounds like your team, please get in touch.',
      },
      {
        title: 'How To Reach Me',
        body: 'Email: 1wheelalex@gmail.com\nGitHub: github.com/alexherman11\nLinkedIn: linkedin.com/in/alex-herman04\n\nA full resume travels with this letter — slip it free of the envelope and read at your leisure.\n\n[Download: /pdf/resume.pdf]',
      },
    ],
  },

  visitor_register: {
    id: 'visitor_register',
    title: 'VISITORS’ REGISTER',
    pages: [
      {
        title: 'A Note From The Keeper',
        body: 'If you are reading this, you have found yourself in a strange and welcoming place. Sign your name if you wish. Read the names of those who came before. Each of them stood where you are standing now.',
      },
      {
        title: 'Familiar Names',
        body: 'Lakshmi G. — "stayed for tea, never left."\nAidan L.W. — "owed me a frisbee. Still does."\nMartin D. — "argued with the portrait. Lost."\nCopernicus — "the chandelier kept rearranging itself, and I am too old for this."',
      },
      {
        title: 'Recent Visitors',
        body: 'A. Wittgenstein — "the door was the limit of my world."\nA. Lovelace — "borrowed the gear. Will return."\nE. Dijkstra — "go to considered harmful, even here."\nA. Turing — "I left a small mechanical bird in the workshop. Be kind to it."',
      },
      {
        title: 'A Blank Page',
        body: 'There is a blank line on this page, with the pen still warm beside it. Sign if you wish. The book has space for you.',
      },
    ],
  },

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
