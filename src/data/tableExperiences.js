export const tableExperiences = [
  { id: 'ocean', label: 'Ocean View', eyebrow: 'The best view in the house', image: '/images/tables/ocean-view.png', zone: 'Window', description: 'The horizon, the soft light, and a table close to the water.', bestFor: 'Slow evenings & celebrations', view: 'Sea-facing window setting' },
  { id: 'classic', label: 'Classic', eyebrow: 'Comfortably, beautifully familiar', image: '/images/tables/classic.png', zone: 'Courtyard', description: 'A sheltered courtyard setting, warm lamps and room for your favourite people.', bestFor: 'Family meals & easy conversation', view: 'Sheltered courtyard setting' },
  { id: 'counter', label: 'Chef’s Counter', eyebrow: 'A little closer to the craft', image: '/images/tables/chefs-counter.png', zone: 'Counter', description: 'An intimate counter seat with a view of the kitchen at work.', bestFor: 'Food lovers & cosy meals for two', view: 'Open-kitchen counter setting' },
]

export const experienceForTable = table => tableExperiences.find(item => item.zone === table?.zone) || tableExperiences[1]
