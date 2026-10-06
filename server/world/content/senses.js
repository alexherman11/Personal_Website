// Sense responses per seed room (smell/taste/touch/knock/listen), ported from the
// original client-side engine. Content, not logic.
export const roomSenses = {
  grand_hall: {
    smell: 'The air smells of old polish and candle wax — the scent of a place maintained with care for a very long time.',
    taste: 'You run your tongue across your lips. The air tastes faintly of dust and something sweeter. Beeswax, perhaps.',
    touch: 'You brush your fingers across the ornate rug. The weave is tight, intricate — handmade, clearly, and old enough to have stories woven into every thread.',
    knock: 'You knock on the nearest doorframe. The sound is deep, resonant — the wood is thick, the walls thicker. This place was built to last.',
    listen: 'You close your eyes and listen. The hall hums with a low resonance, as though the building itself is breathing. Distant echoes suggest vast spaces beyond.',
  },
  archive: {
    smell: 'Old paper, leather bindings, and the faint sweetness of candle wax. The scent of a thousand patient hours spent reading.',
    taste: 'You taste dust on your lips. It carries the ghost of old ink and yellowed pages. Not unpleasant, if you like libraries.',
    touch: 'You trail your fingers along the nearest shelf. The wood is smooth from centuries of hands doing exactly what you are doing now.',
    knock: 'You knock on the bookshelf. Several volumes shudder but hold their ground. Somewhere deeper in the stacks, something shifts.',
    listen: 'You listen. The candle flame whispers. A page turns somewhere — though you are alone. The archive breathes on its own schedule.',
  },
  workshop: {
    smell: 'Solder flux, ozone, and a faint metallic tang. The workshop smells like creation — and the occasional small fire.',
    taste: 'You instinctively lick your lips and immediately regret it. The air tastes of copper and solder. Please do not taste anything in this room.',
    touch: 'You touch the workbench surface. It is scarred with burn marks, scratched by screwdrivers, and warm to the touch in places it probably should not be.',
    knock: 'You knock on the workbench. Something rattles. A loose resistor rolls off the edge and disappears into the void beneath. It will never be found.',
    listen: 'You listen. The hum of capacitors charging, the faint ticking of a cooling soldering iron, the whisper of electrons through traces. The workshop is never truly silent.',
  },
  study: {
    smell: 'Paper and ink, with a trace of old wood and furniture polish. The scent of quiet productivity.',
    taste: 'The air is dry and clean. It tastes of nothing in particular, which seems appropriate for a room dedicated to precision.',
    touch: 'You rest your hand on the desk. The surface is smooth, well-maintained — the desk of someone who respects their workspace.',
    knock: 'You knock on the filing cabinet. It rings hollow. The drawers are not as full as they will be — this career is still being written.',
    listen: 'You listen. The clock ticks steadily. A pen scratches somewhere, though the desk is empty. Time passes differently in a study.',
  },
  signal_room: {
    smell: 'Heated copper, ozone, and old bakelite. The smell of a room that has been powered on for a very long time.',
    taste: 'The air crackles with static. You can taste the electricity on your tongue — metallic and alive.',
    touch: 'You touch the console. A faint vibration runs through the metal — the pulse of signals flowing from far away.',
    knock: 'You knock on the console housing. The speaker crackles in response, as though something on the other end heard you.',
  },
  entrance: {
    smell: 'Wet stone, coastal wind, and the faint sweetness of ivy. The door itself smells of iron and old oak.',
    taste: 'Salt air. You can taste the ocean on it, carried from somewhere not too far away.',
    touch: 'You press your palm against the door. It is cold, solid, unyielding. The iron bands are rough with age. The wood does not give.',
    knock: 'You knock on the heavy door. The sound is deep, final, swallowed by the stone. No one answers — but you sense something listening.',
    listen: 'You press your ear to the door. Beyond it, faintly — the hum of something vast. A building that is more than a building.',
  },
  grounds: {
    smell: 'Eucalyptus and salt air and the green smell of wild grass after rain. The coastal hillside smells like freedom.',
    taste: 'The wind carries salt from the ocean. The air tastes clean and bright, the way air does when you are finally outside.',
    touch: 'You run your hand through the wild grass. It is dry and golden, crackling faintly — the texture of a California hillside in late afternoon.',
    knock: 'You knock on the old stone wall. The stone is warm from the sun and responds with a dull, ancient thud.',
    listen: 'Wind through grass. Distant birdsong. The faint hum of insects. The ocean, somewhere beyond the hills. This is what silence actually sounds like.',
  },
  tree: {
    smell: 'Oak bark, sun-warmed leaves, and the faint sweet smell of paracord. The tree smells alive and patient.',
    taste: 'You taste the air up here. It is cleaner, thinner, carrying the dust of leaves and the memory of rain.',
    touch: 'You press your hand against the bark. It is rough, warm, alive. You can feel the tree breathing — slowly, on a timescale you cannot comprehend.',
    knock: 'You knock on the trunk. The tree absorbs the sound. Somewhere above, a branch creaks in response, as though acknowledging you.',
    listen: 'Wind in the leaves. The creak of rope under tension. Birdsong close and bright. The faint rustle of something small moving through the canopy. This is the tree\'s music.',
  },
  vault: {
    smell: 'Nothing. Then something. An absence of smell so complete it becomes its own presence.',
    taste: 'The air tastes of... potential. Of something about to happen. Or something that already has.',
    touch: 'You reach out. The surface you touch is smooth, warm, and seems to pulse faintly — or perhaps that is your own heartbeat.',
    knock: 'You knock. The sound does not echo. It is absorbed, considered, and after a long moment... something knocks back.',
    listen: 'You listen. The silence here is not empty. It is full. Full of something that is listening back.',
  },
}
export default roomSenses
