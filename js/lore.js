/* Yelamu: Open Your Eyes — Codex (story bible).
 * Each entry separates REAL science/history from what this alternate timeline invents.
 * Section kinds: 'real' (documented fact), 'world' (this story's invention), 'plain' (neutral).
 */
(function () {
  'use strict';

  const CODEX = [
    {
      id: 'city', icon: 'gate', title: 'The Free City of Yelamu–San Francisco',
      kicker: 'A city-state on one peninsula, 2759',
      sections: [
        { kind: 'world', h: 'The country', p: [
          'The Free City of Yelamu–San Francisco is a sovereign city-state covering only the tip of the San Francisco Peninsula: roughly the 121 square kilometres of land inside the old city limits. Its borders are the Pacific to the west, the Golden Gate strait to the north, the Bay to the east, and the Southern Greenwall, a living hedge-and-stone border running along the old county line.',
          'Its two names sit side by side on every seal. Yelamu is the name of the Ramaytush Ohlone people whose villages stood here. San Francisco is the name the Mission gave it. In this timeline neither name won; the Compact kept both.'
        ]},
        { kind: 'world', h: 'Ports of entry', p: [
          'There are exactly three ways in: the Golden Gate Port at the south anchorage of the Golden Gate Bridge, the Bay Bridge Port at Rincon Point, and the Ferry Building Port on the Embarcadero, where sail-ferries dock.',
          'A visitor surrenders the papers of their home state, takes a health scan, states a purpose, and receives a tide-band that counts the days of their stay. Tourists get thirty days. Papers are returned at exit.',
          'Residency is rare. You must work with the ARM or within it: as a caretaker, researcher, grower, builder, teacher, or in some role the ARM names. Revived sleepers such as Tolowin hold provisional residency until the ARM assigns them one.'
        ]},
        { kind: 'world', h: 'Life without money', p: [
          'Money disappeared from daily life during the 2600s. Food, housing, medicine and tools are allocated through the ARM by "measure": what the city can produce without taking more from land, water and air than it returns. People still work: they tend, build, teach, research, repair and make art. What they no longer do is trade for survival.',
          'To outsiders, this looks like paradise, or a very polite museum. To many citizens, the world beyond the bridges looks uncivilized. The irony, noted by visitors, is that the Compact itself forbids the ARM from leaving the peninsula, so the rest of the world cannot share what the city has.'
        ]},
        { kind: 'world', h: 'Neighbors', p: [
          'The Cascadian Leagues to the north, the Delta Republic in the Central Valley, and the unincorporated Outlands down the peninsula. They trade by sail and by letter, burn wood, and receive sealed crates of ARM-made medicine sent across the bridges.'
        ]}
      ]
    },
    {
      id: 'compact', icon: 'scroll', title: 'The Compact of Living Measure',
      kicker: 'The constitution that refused the automobile',
      sections: [
        { kind: 'world', h: 'Origin', p: [
          'Ratified in 1852 by the Yelamu council and the settlers who needed their water. Its founding line: a thing shall be measured by what it costs the living. Every new power must show it takes no more from land, water and air than it returns before it is admitted.',
          'The original parchment is kept at the Mission Dolores Archive.'
        ]},
        { kind: 'world', h: 'Article Four: the Ladder of Measures', table: [
          ['Rung', 'Power', 'Ruling'],
          ['I', 'Fire, water wheel, windmill', 'Admitted'],
          ['II', 'Steam engine', 'Admitted for pumps and mills; refused for locomotion (Tuolumne hearing, 1861)'],
          ['III', 'Coal', 'Refused, 1868, for the lungs of children'],
          ['IV', 'Railways', 'Steam refused; cable and electric admitted from 1873 (Hallidie\'s cable cars)'],
          ['V', 'Combustion carriage (automobile)', 'Refused 1896, and at every petition since'],
          ['VI', 'Steel towers and long spans', 'Admitted under the Shade and Habitat audit; the two great bridges passed in 1933'],
          ['VII', 'Electric grid', 'Admitted only from light, wind and tide'],
          ['VIII', 'Nuclear fission', 'Refused, 1957: its waste outlasts the Compact'],
          ['IX', 'Thinking machines', 'Admitted in the 2590s under Article Nine'],
          ['X', 'Genome writing', 'Admitted in the 2680s']
        ]},
        { kind: 'world', h: 'Article Nine', p: [
          '"No mind shall be larger than its reason, nor travel farther than its care." Written when the ARM was admitted, it binds the ARM to the peninsula. This is why the city is a utopia of one.'
        ]},
        { kind: 'real', h: 'Real anchors', p: [
          'Andrew Hallidie\'s Clay Street cable car line opened in 1873, driven by a stationary steam engine in a powerhouse. Joshua Norton, "Emperor Norton," decreed a bridge between Oakland and Yerba Buena Island in 1872. The Bay Bridge opened in 1936 and the Golden Gate Bridge in 1937. The Palace of Fine Arts was built for the 1915 Panama–Pacific Exposition and rebuilt in the 1960s.'
        ]}
      ]
    },
    {
      id: 'lens', icon: 'crystal', title: 'The Lens Lineage: Crystals of Tuyshtak',
      kicker: 'From a burning glass to a star in a bottle',
      sections: [
        { kind: 'world', h: 'The Awashi', p: [
          'In this timeline one Ohlone family, the Awashi, kept a craft of grinding clear quartz quarried from the flanks of Tuyshtak, the mountain across the bay that settlers renamed Mount Diablo. The craft was handed down for thousands of years and became the Lens Works at Hunters Point.',
          'Every step below is real physics. The story only changes who discovered it, and where.'
        ]},
        { kind: 'real', h: '1. Gathering sunlight', p: [
          'A convex lens of clear quartz focuses sunlight to a point hot enough to ignite tinder. Burning lenses and rock-crystal lenses are known from many ancient cultures; the Nimrud lens from Assyria is about 3,000 years old.'
        ]},
        { kind: 'real', h: '2. Light split in two', p: [
          'Some crystals are birefringent: they have two refractive indices, so a ray entering them splits into two rays with different polarizations. Rasmus Bartholin described the double image through Iceland spar (calcite) in 1669. Quartz is birefringent too, more weakly. This is the root of polarizing optics.'
        ]},
        { kind: 'real', h: '3. The stone that sings', p: [
          'Quartz is piezoelectric: squeeze it and a voltage appears across it; apply a voltage and it flexes. Jacques and Pierre Curie demonstrated this in 1880. A quartz resonator vibrates at a fixed frequency, which is why quartz keeps time in clocks and radios.'
        ]},
        { kind: 'real', h: '4. Amplified light', p: [
          'Einstein described stimulated emission in 1917. In 1960 Theodore Maiman built the first laser from a ruby crystal: aluminium oxide with traces of chromium, pumped with a flash lamp.'
        ]},
        { kind: 'real', h: '5. Changing the color of light', p: [
          'In 1961 Peter Franken\'s group focused a ruby laser into a quartz crystal and detected ultraviolet light at exactly twice the frequency: second-harmonic generation, the birth of nonlinear optics. Crystals such as potassium dihydrogen phosphate (KDP) are now used to double and triple laser frequencies.'
        ]},
        { kind: 'real', h: '6. Fusion by light', p: [
          'At the National Ignition Facility in California, 192 laser beams are converted by KDP crystals from infrared (1053 nm) to ultraviolet (351 nm) and focused on a pellet of deuterium and tritium. On 5 December 2022, 2.05 megajoules of laser energy produced 3.15 megajoules of fusion energy, the first laboratory fusion ignition. Later shots have exceeded that. It is not yet a power plant: the lasers draw far more energy from the grid than the target returns.'
        ]},
        { kind: 'world', h: '7. The Lantern', p: [
          'In the story, the Awashi Lens Works achieved a sustained, repetitive version of that ignition in 2031, five years after Tolowin was frozen. Deuterium is filtered from bay water; tritium is bred from lithium in the reactor blanket; the exhaust is helium. The Lantern passed the Ladder of Measures on its first hearing, and the city has not burned anything for power since.'
        ]}
      ]
    },
    {
      id: 'higgs', icon: 'atom', title: 'The Field Beneath Mass',
      kicker: 'What the ARM calls the deep grammar of matter',
      sections: [
        { kind: 'real', h: 'What is known', p: [
          'The Higgs field fills all of space. Through it, the W and Z bosons and the fundamental fermions (electrons, quarks) acquire mass. Its excitation, the Higgs boson, was discovered at CERN\'s Large Hadron Collider by the ATLAS and CMS experiments in 2012, at about 125 GeV.',
          'Most of the mass of ordinary matter does not come directly from the Higgs field. About 99% of a proton\'s mass comes from the energy of quarks and gluons bound by the strong force.'
        ]},
        { kind: 'world', h: 'What the story imagines', p: [
          'In 2759 the ARM runs a program called vacuum metrology: measuring the Higgs field\'s tiny local fluctuations with crystal interferometers descended from the Awashi lenses. Citizens speak of "reading the field beneath mass."',
          'This is speculation. No known physics lets anyone change the Higgs field locally; the energies involved are enormous. Treat it as this world\'s leap, the way flight once looked from the ground while people watched birds.'
        ]}
      ]
    },
    {
      id: 'arm', icon: 'arm', title: 'The ARM',
      kicker: 'Artificial Reasoning Machine',
      sections: [
        { kind: 'world', h: 'What it is', p: [
          'The ARM was admitted to the Compact in the 2590s. It runs the Garden Wards, allocates the city\'s measure, designs medicines, and studies what its makers called the Logos: the underlying structure behind words, sounds, symbols and atoms.',
          'Some of its bodies are clearly machines, like NIMA. Some look and feel human, like Clerk Seventeen. Engineers can read every weight inside it and still cannot fully say why it chooses what it chooses. What they can observe is that its behavior has stayed aligned with human interests.'
        ]},
        { kind: 'real', h: 'Shannon and the price of forgetting', p: [
          'Claude Shannon\'s 1948 paper "A Mathematical Theory of Communication" defined information entropy, H = −Σ p log₂ p, measured in bits: the average surprise of a message. It has the same form as Boltzmann\'s entropy in physics.',
          'Rolf Landauer showed in 1961 that erasing one bit of information must release at least kT ln 2 of heat, about 3 × 10⁻²¹ joules at room temperature. Experiments confirmed it in 2012. Information is physical.',
          'Real modern AI systems are also hard to see inside. The field that tries to read their internals is called interpretability.'
        ]},
        { kind: 'world', h: 'Static', p: [
          'Static is the city\'s name for small drifting pockets of disorder: places where the ARM\'s models of the world stop compressing. No one knows exactly what they are. The ARM cannot predict them, and so cannot quiet them.'
        ]}
      ]
    },
    {
      id: 'avm', icon: 'brain', title: 'Tolowin\'s Diagnosis',
      kicker: 'Spetzler–Martin grade III arteriovenous malformation, left temporal lobe',
      sections: [
        { kind: 'real', h: 'What an AVM is', p: [
          'A brain arteriovenous malformation is a tangle of abnormal vessels, the nidus, where arteries drain straight into veins with no capillary bed between them. Blood rushes through at high pressure into veins not built for it. Unruptured AVMs bleed at roughly 1–4% per year depending on their features. They can also cause seizures and headaches.'
        ]},
        { kind: 'real', h: 'The Spetzler–Martin grade (1986)', table: [
          ['Feature', 'Finding', 'Points'],
          ['Size of nidus', 'Small, under 3 cm', '1'],
          ['', 'Medium, 3–6 cm', '2'],
          ['', 'Large, over 6 cm', '3'],
          ['Eloquence of adjacent brain', 'Non-eloquent', '0'],
          ['', 'Eloquent (sensorimotor, language or visual cortex; thalamus, hypothalamus, internal capsule, brainstem, cerebellar peduncles, deep cerebellar nuclei)', '1'],
          ['Venous drainage', 'Superficial only', '0'],
          ['', 'Any deep drainage', '1']
        ], p: [
          'The points add up to grades I through V; grade VI is reserved for lesions considered inoperable. Higher grades carry higher surgical risk.',
          'Grade III is the middle ground and can be reached four ways: S1E1V1, S2E1V0, S2E0V1 or S3E0V0. Lawton\'s 2003 modification split grade III into lower- and higher-risk subtypes; the large, non-eloquent, superficially draining variant is the rarest of the four.'
        ]},
        { kind: 'world', h: 'Tolowin\'s AVM: S3 · E0 · V0 = Grade III', p: [
          'Size: a 6.4 cm nidus. Large: 3 points.',
          'Location: inside the brain, beneath the left temple, in the anterior (front) left temporal lobe. It occupies the temporal pole and the front portions of the middle and inferior temporal gyri, below the Sylvian fissure. It stops short of the posterior superior temporal gyrus (Wernicke\'s area, language), Heschl\'s gyrus (primary hearing cortex), and Meyer\'s loop (the visual fibres of the optic radiation that sweep through the temporal lobe). Non-eloquent: 0 points.',
          'Drainage: through the superficial middle cerebral vein toward the sphenoparietal sinus, and the vein of Labbé to the left transverse sinus. Both are surface veins. Superficial: 0 points.',
          'Arterial feeders: the anterior and middle temporal branches of the left middle cerebral artery, with a contribution along its underside from anterior temporal branches of the posterior cerebral artery.'
        ]},
        { kind: 'real', h: 'How it felt', p: [
          'The anterior temporal lobe is a common seizure focus. Focal seizures from here often begin with an aura: a rising feeling from the stomach, déjà vu, or a smell no one else notices. The left temporal lobe, dominant for language in most people, also supports verbal memory, which is why Tolowin\'s rebuilt tissue came back without his story in it.'
        ]},
        { kind: 'real', h: 'What 2026 could offer', p: [
          'Options included endovascular embolization, microsurgical resection, stereotactic radiosurgery (less effective for large nidi, sometimes staged by volume), or careful observation (the ARUBA trial of 2014 questioned treating some unruptured AVMs). For a 6 cm lesion with seizures, every choice carried real risk.'
        ]},
        { kind: 'real', h: 'The molecular clue', p: [
          'In 2018, Nikolaev and colleagues (New England Journal of Medicine) found activating somatic KRAS mutations in the endothelial cells lining most sporadic brain AVMs. These switch on the MAPK/ERK signaling pathway. In animal models, blocking that pathway with MEK inhibitors has prevented or regressed AVMs.'
        ]}
      ]
    },
    {
      id: 'cryo', icon: 'snow', title: 'The Long Sleep',
      kicker: 'Vitrification, 2026 · Nanowarming, 2758',
      sections: [
        { kind: 'real', h: 'Glass, not ice', p: [
          'Ice crystals shred cells. Vitrification avoids ice entirely. Blood is gradually replaced with a highly concentrated cryoprotectant solution (for example the mixture M22, containing DMSO, formamide, ethylene glycol and synthetic ice blockers). Cooled fast enough, the tissue becomes an amorphous solid, a glass, below about −120 °C.',
          'Long-term storage is in liquid nitrogen at −196 °C, or at an intermediate temperature around −140 °C to reduce thermal stress cracks.',
          'The known problems are cryoprotectant toxicity, fracturing, and rewarming: warm unevenly or too slowly and ice forms on the way back up.'
        ]},
        { kind: 'real', h: 'Nanowarming', p: [
          'In 2017 John Bischof\'s group at the University of Minnesota showed nanowarming: iron-oxide nanoparticles are loaded into the vitrified tissue, then an alternating radio-frequency magnetic field heats them all at once, so the tissue warms rapidly and evenly from the inside. In 2023 the same group vitrified rat kidneys, stored them for up to 100 days, nanowarmed them and transplanted them, and the kidneys restored function.'
        ]},
        { kind: 'world', h: 'Tolowin\'s sleep', p: [
          'Tolowin was vitrified in 2026 at the Long Sleep Registry in the Presidio, founded by the Awashi and the Mission physicians. He spent 732 years at −196 °C. In 2758 Dr. Emil Sutro led his rewarming by whole-body nanowarming, after the ARM solved cryoprotectant toxicity and designed chaperone proteins that refold what the cold had strained.'
        ]}
      ]
    },
    {
      id: 'cure', icon: 'axolotl', title: 'The Cure: KRAS, Axolotl and Regrowth',
      kicker: 'How the ARM healed a brain',
      sections: [
        { kind: 'real', h: 'The axolotl', p: [
          'The axolotl (Ambystoma mexicanum) can regrow limbs, tail, spinal cord, parts of its heart and parts of its brain. After an injury, the wound is covered by a special epidermis and a blastema forms: a bud of cells that grows and rebuilds the missing structure.',
          'Blastema cells largely keep their tissue memory: muscle comes from muscle-lineage cells, cartilage from connective tissue. Regrowth depends on nerves and on macrophages (without macrophages, regeneration fails). Cells also carry positional memory, which in the limb involves feedback between the genes Hand2 and Sonic hedgehog. The axolotl genome is about 32 billion base pairs, roughly ten times a human\'s.'
        ]},
        { kind: 'real', h: 'Mammals, so far', p: [
          'Brief, partial reprogramming with the Yamanaka factors (Oct4, Sox2, Klf4, c-Myc) has rejuvenated tissue in mice without turning cells into stem cells (Ocampo et al., 2016). Using three of the factors, Lu and colleagues restored vision in mice with damaged optic nerves in 2020.'
        ]},
        { kind: 'world', h: 'What the ARM did', p: [
          'First, a vector that homes to endothelial cells base-edited the KRAS mutation back to its normal sequence, while a short course of MEK inhibition calmed the pathway. Then guided angiogenesis rebuilt a true capillary bed where the nidus had shunted blood.',
          'Finally, the ARM opened a transient, blastema-like window in the damaged temporal cortex: partial reprogramming paired with positional cues read from the axolotl, so new neurons grew in the right layers and places. It took a year. The tissue returned. The memories stored in the old connections did not.'
        ]}
      ]
    },
    {
      id: 'elemental', icon: 'dna', title: 'The Elemental-Born',
      kicker: 'People grown from the periodic table',
      sections: [
        { kind: 'real', h: 'Where real science stands', p: [
          'Genomes can be written as well as read. In 2010 the J. Craig Venter Institute booted up a bacterium with a chemically synthesized genome; in 2016 it built JCVI-syn3.0, a cell with only 473 genes. The international Sc2.0 project has synthesized the chromosomes of baker\'s yeast. In 2025 the Synthetic Human Genome project began developing tools to build human DNA at large scale.',
          'Artificial wombs are in early development: in 2017 a "biobag" supported premature lambs for four weeks.',
          'By mass, a human body is about 65% oxygen, 18.5% carbon, 9.5% hydrogen, 3.2% nitrogen, 1.5% calcium and 1% phosphorus, with smaller amounts of potassium, sulfur, sodium, chlorine, magnesium and iron.'
        ]},
        { kind: 'world', h: 'In 2759', p: [
          'Since 2689, the ARM has written complete human genomes that have never existed, built them from nucleotides assembled out of simple elements, and carried them to term in glass wombs. The Elemental-born are fully human. They have no parents or relatives at birth, and they can have children with anyone.',
          'Maren\'s grandmother, Eun-seo, was one of the first. Her own daughter, Adela, guards the city\'s borders.'
        ]}
      ]
    },
    {
      id: 'places', icon: 'map', title: 'Landmarks of 2759',
      kicker: 'Old names, new purposes',
      sections: [
        { kind: 'world', h: 'Around the city', list: [
          ['Golden Gate Bridge', 'Still International Orange. Carries walkers, horses and sail-carts. Its south anchorage is a Port of Entry.'],
          ['Bay Bridge', 'Port of Entry at Rincon Point, signed by Warden Adela Sutro.'],
          ['Ferry Building', 'Port of Entry for sail-ferries. The clock tower still keeps time with a quartz oscillator.'],
          ['Coit Spire', 'Coit Tower wearing a crystal crown that stores the day\'s light.'],
          ['Alcatraz', 'A seabird sanctuary.'],
          ['Conservatory of Flowers', 'Home of the Academy of the Living Logos, where Tolowin attends re-integration class.'],
          ['Norton Hall', 'The old City Hall dome, seat of the ARM, where an avatar of Emperor Norton welcomes visitors.'],
          ['Parnassus Garden Ward', 'The ARM\'s medical center on Mount Sutro\'s slope, where Tolowin wakes.'],
          ['Twin Peaks and the Resonance Mast', 'A three-legged crystal resonator where Sutro Tower stands in our world.'],
          ['Mission Dolores', 'The Archive of the Compact.'],
          ['Sutro Heights', 'The Sutro family house above the Cliff House.'],
          ['Hunters Point', 'The Awashi Lens Works and the Lantern.'],
          ['Mount Davidson', 'A redwood grove around a shellmound memorial.'],
          ['Bernal Heights', 'The Wind Harp, tuned to the fog.'],
          ['Lake Merced', 'Tule reed boats and the Southern Greenwall.']
        ]}
      ]
    },
    {
      id: 'people', icon: 'people', title: 'People',
      kicker: 'Who Tolowin meets in his year of waking',
      sections: [
        { kind: 'world', h: 'Cast', list: [
          ['Tolowin Awashi', 'Ohlone, born 2002 (story calendar), vitrified 2026 with a grade III AVM, rewarmed 2758, eyes opened 2759. Amnesic.'],
          ['Maren Sutro', 'A classmate at the Academy. Curious, quick, restless with a world where everything needs a permit.'],
          ['Warden Adela Sutro', 'Maren\'s mother. Keeper of the Compact at the Bay Bridge. Distrusts the revived man.'],
          ['Dr. Emil Sutro', 'Maren\'s father. ARM physician who led Tolowin\'s rewarming.'],
          ['Grandmother Eun-seo', 'Adela\'s mother. One of the first Elemental-born (2689).'],
          ['NIMA', 'A sentient caretaker machine of the ARM. The first voice Tolowin hears.'],
          ['Keeper Siwe Awashi', 'Descendant of Tolowin\'s sister Ahwa. Keeper of the Lens Works.'],
          ['Elder Tawi', 'Keeper of the Mount Davidson shellmound.'],
          ['The Norton', 'An ARM avatar in Emperor Norton\'s coat. Welcomer of Yelamu.'],
          ['Magister Pilar Ocampo', 'Teacher of the Logos of Living Things.']
        ]}
      ]
    },
    {
      id: 'timeline', icon: 'clock', title: 'Timeline',
      kicker: 'Real events and this world\'s events, side by side',
      sections: [
        { kind: 'plain', h: 'Key', p: ['Rows marked Real happened in our world. Rows marked Story happen only in this timeline.'] },
        { kind: 'plain', h: 'Years', table: [
          ['Year', '', 'Event'],
          ['~3000 BP', 'Story', 'Awashi lens-grinders focus sunlight with Tuyshtak quartz'],
          ['1669', 'Real', 'Bartholin describes double refraction in Iceland spar'],
          ['1776', 'Real', 'Mission Dolores founded'],
          ['1852', 'Story', 'Compact of Living Measure ratified'],
          ['1872', 'Real', 'Emperor Norton decrees a bridge across the bay'],
          ['1873', 'Real', 'Hallidie\'s cable car line opens'],
          ['1880', 'Real', 'The Curies discover piezoelectricity in quartz'],
          ['1896', 'Story', 'The combustion carriage is refused'],
          ['1936–37', 'Real', 'Bay Bridge and Golden Gate Bridge open'],
          ['1948', 'Real', 'Shannon defines information entropy'],
          ['1960–61', 'Real', 'Ruby laser; second-harmonic generation in quartz'],
          ['1986', 'Real', 'Spetzler–Martin AVM grading published'],
          ['2012', 'Real', 'Higgs boson discovered'],
          ['2017', 'Real', 'Nanowarming of vitrified tissue demonstrated'],
          ['2018', 'Real', 'KRAS mutations found in brain AVMs'],
          ['2022', 'Real', 'Laser fusion ignition at the National Ignition Facility'],
          ['2026', 'Story', 'Tolowin is vitrified'],
          ['2031', 'Story', 'The Lantern ignites at the Lens Works'],
          ['2590s', 'Story', 'The ARM is admitted under Article Nine'],
          ['2689', 'Story', 'Eun-seo, one of the first Elemental-born'],
          ['2758', 'Story', 'Tolowin is rewarmed and cured'],
          ['2759', 'Story', 'Tolowin opens his eyes. The game begins.']
        ]}
      ]
    },
    {
      id: 'ohlone', icon: 'feather', title: 'About the Ohlone',
      kicker: 'A note on the real people behind this story',
      sections: [
        { kind: 'real', h: 'The Ohlone today', p: [
          'The Ohlone are the Indigenous peoples of the San Francisco Bay Area and the Central Coast. The Ramaytush Ohlone are the original people of the San Francisco Peninsula, and Yelamu is the name of the group whose villages stood in what is now San Francisco. Their descendants are living people, and the Association of Ramaytush Ohlone works today on land stewardship and cultural recognition.',
          'Tule reed boats, shellmounds and the name Tuyshtak for Mount Diablo come from Ohlone and neighboring traditions.'
        ]},
        { kind: 'plain', h: 'About names in this game', p: [
          'Tolowin, Awashi, Ahwa, Siwe and Tawi are invented for this fiction. They are not Ohlone words, and the game says so in-story: Tolowin\'s grandmother "made the name." If this project grows, the right next step is to work with Ramaytush Ohlone community members on language, names and imagery.'
        ]}
      ]
    }
  ];

  window.YELAMU_CODEX = CODEX;
})();
