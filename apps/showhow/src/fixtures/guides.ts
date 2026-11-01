// TEST FIXTURE data for offline UI work and tests. Never shown as a live result:
// every guide here has `fixture: true`, which the UI labels visibly.
import type { Guide } from '../lib/types'

const step = (idx: number, title: string, startS: number, endS: number, keyPart: string, instruction: string, tipQuote?: string) =>
  ({ idx, title, startS, endS, keyPart, instruction, tipQuote, outline: null })

export const FIXTURE_GUIDES: Guide[] = [
  {
    id: 'fixture-bookcase', title: 'Assemble a 3-shelf bookcase', category: 'DIY', creatorName: 'Ahmed R.', kind: 'video', durationS: 210, fixture: true,
    steps: [
      step(0, 'Sort the parts', 0, 31, 'Bag B · short screws', 'Lay every panel flat and open the three bags. Bag B has the short screws.', 'Ninety percent of mistakes are using the long screws where the short ones go.'),
      step(1, 'Fit dowels into the left side', 31, 58, 'Dowel holes', 'Push one wooden dowel into each of the four small holes on the inside face of the left panel.'),
      step(2, 'Attach shelves to the left side', 58, 100, 'Cam holes', 'Slide each shelf onto the dowels. The round cam holes must face up.', 'If you can’t see the round holes from above, your shelf is upside down.'),
      step(3, 'Lock the cam nuts', 100, 125, 'Cam nut', 'Turn each cam nut a quarter turn clockwise until it bites.'),
    ],
  },
  {
    id: 'fixture-printer', title: 'Set up a Wi-Fi printer', category: 'Gadgets', creatorName: 'Mei L.', kind: 'video', durationS: 102, fixture: true,
    steps: [
      step(0, 'Remove all orange tape', 0, 24, 'Shipping tape', 'Pull off every strip of orange tape, including inside the cartridge door.'),
      step(1, 'Load paper', 24, 51, 'Paper tray', 'Slide a stack of paper in until it stops, then move the guide to touch it.'),
      step(2, 'Hold the Wi-Fi button for 3 s', 51, 70, 'Wi-Fi button', 'Press and hold until the light blinks blue.'),
    ],
  },
  {
    id: 'fixture-plant', title: 'Re-pot a houseplant', category: 'Garden', creatorName: 'Priya S.', kind: 'video', durationS: 90, fixture: true,
    steps: [
      step(0, 'Water the day before', 0, 15, 'Soil', 'Moist soil slides out of the old pot in one piece.'),
      step(1, 'Loosen the roots', 15, 50, 'Root ball', 'Tease the outer roots apart with your fingers.'),
      step(2, 'Set it at the same depth', 50, 90, 'Soil line', 'The old soil line should sit 2 cm below the new rim.'),
    ],
  },
]
