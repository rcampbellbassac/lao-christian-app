import type { SlideContentType } from '../types'

export interface PresentationFixture {
  setKey: string
  title: string
  type: SlideContentType
  html: string
}

export const representativeFixtures: PresentationFixture[] = [
  {
    setKey: 'LaoBible',
    title: 'Lao Bible Sample',
    type: 'bible',
    html: [
      '<h2>John 1</h2>',
      '<strong>1:1</strong>',
      '<span>In the beginning was the Word, and the Word was with God.</span>',
      '<strong>1:2</strong>',
      '<span>He was with God in the beginning.</span>',
      '<strong>1:3</strong>',
      '<span>Through him all things were made; without him nothing was made.</span>',
      '<strong>1:4</strong>',
      '<span>In him was life, and that life was the light of all mankind.</span>',
      '<strong>1:5</strong>',
      '<span>The light shines in the darkness, and the darkness has not overcome it.</span>',
    ].join(''),
  },
  {
    setKey: 'LaoSongs',
    title: 'Lao Songs Sample',
    type: 'songs',
    html: [
      '<h2>Amazing Grace</h2>',
      '<p>Amazing grace how sweet the sound</p>',
      '<p>That saved a wretch like me</p>',
      '<hr>',
      '<p>I once was lost but now am found</p>',
      '<p>Was blind but now I see</p>',
      '<hr>',
      '<p>Through many dangers toils and snares</p>',
      '<p>I have already come</p>',
    ].join(''),
  },
  {
    setKey: 'LaoBibleStudies',
    title: 'Bible Studies Sample',
    type: 'studies',
    html: [
      '<h2>Lesson 1</h2>',
      '<p>Question: What does hope produce in the believer?</p>',
      '<p>Answer: Hope produces endurance and joy in difficult seasons.</p>',
      '<ul><li>Read</li><li>Reflect</li><li>Respond</li></ul>',
      '<h2>Lesson 2</h2>',
      '<p>Question: Why does prayer matter?</p>',
      '<p>Answer: Prayer shapes trust and obedience.</p>',
    ].join(''),
  },
  {
    setKey: 'LaoEGW',
    title: 'EGW Sample',
    type: 'studies',
    html: [
      '<h2>Chapter 1</h2>',
      '<p>A reflective paragraph introducing a core spiritual principle.</p>',
      '<p>Another paragraph expanding practical application.</p>',
      '<blockquote>True education means more than pursuing a certain course of study.</blockquote>',
      '<h2>Chapter 2</h2>',
      '<p>The second chapter begins with context and personal appeal.</p>',
    ].join(''),
  },
  {
    setKey: 'LaoHealthBooks',
    title: 'Health Studies Sample',
    type: 'studies',
    html: [
      '<h2>Nutrition Basics</h2>',
      '<p>Balanced meals include protein, fiber, and healthy fats.</p>',
      '<p>Hydration supports energy and focus throughout the day.</p>',
      '<h2>Daily Rhythm</h2>',
      '<p>Rest and movement are both essential parts of whole-person health.</p>',
    ].join(''),
  },
  {
    setKey: 'LaoStories',
    title: 'Bible Stories Sample',
    type: 'studies',
    html: [
      '<h2>Story One</h2>',
      '<p>There was a child who learned courage through trust in God.</p>',
      '<p>The story closes with a clear lesson for families.</p>',
      '<h2>Story Two</h2>',
      '<p>A second story highlights kindness and integrity in hardship.</p>',
    ].join(''),
  },
]
