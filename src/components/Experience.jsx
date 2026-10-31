import Image from 'next/image'
import { Container, Eyebrow } from './ui'
import { dishImage, emptyThaliImage } from '../data/dishImages'

const courses = [
  { id: 1, name: 'Rava-fried ladyfish', x: 32, y: 33, size: 39, fromX: '-210px', fromY: '-140px', turn: '-38deg', start: .06 },
  { id: 6, name: 'Kingfish curry and red rice', x: 68, y: 35, size: 41, fromX: '240px', fromY: '-180px', turn: '40deg', start: .22 },
  { id: 8, name: 'Jackfruit and cashew roast', x: 67, y: 69, size: 37, fromX: '220px', fromY: '180px', turn: '55deg', start: .40 },
  { id: 11, name: 'Tender coconut payasam', x: 32, y: 69, size: 33, fromX: '-190px', fromY: '210px', turn: '-32deg', start: .56 },
]
const chapters = [
  { title: 'The sea sets the beginning.', text: 'The morning’s catch. A little salt in the air. Good things begin long before the kitchen opens.' },
  { title: 'The kitchen takes its time.', text: 'Coconut ground by hand. Masala slowly roasted. Each bowl brings another part of the coast to your leaf.' },
  { title: 'Then, it all comes together.', text: 'A little heat, a little tang, something sweet to finish. Choose your dishes. We’ll make room on your leaf.' },
]

export default function Experience() {
  return (
    <section id="experience" className="experience-section plating-story" data-plating-story aria-labelledby="experience-title">
      <div className="plating-sticky">
        <Container className="plating-layout">
          <div className="plating-copy">
            <Eyebrow>The art of coming together</Eyebrow>
            <h2 id="experience-title" className="section-title">One leaf.<br />An entire <em>coast.</em></h2>
            <div className="plating-chapters">
              {chapters.map((chapter, index) => <div key={chapter.title} data-chapter={index} data-active={index === 0 ? 'true' : 'false'} className="plating-chapter"><h3>{chapter.title}</h3><p>{chapter.text}</p></div>)}
            </div>
            <a className="text-link" href="#menu">Compose your thali <span aria-hidden="true">↗</span></a>
            <ol className="plating-chapter-index" aria-label="From sea to table">{['The sea', 'The kitchen', 'Your leaf'].map((label, index) => <li key={label} data-chapter={index} data-active={index === 0 ? 'true' : 'false'}><span>0{index + 1}</span>{label}</li>)}</ol>
          </div>
          <div className="plating-stage" role="img" aria-label="A coastal thali assembling from fried ladyfish, kingfish curry, jackfruit roast and coconut payasam as you scroll">
            <span className="plating-backword" aria-hidden="true">together</span>
            <div className="plating-tray"><Image src={emptyThaliImage} alt="" width={1000} height={1000} sizes="(max-width: 767px) 95vw, 55vw" /></div>
            {courses.map((course) => <div key={course.id} data-plate-layer data-start={course.start} className="plating-layer" style={{ left: `${course.x}%`, top: `${course.y}%`, width: `${course.size}%`, '--from-x': course.fromX, '--from-y': course.fromY, '--from-turn': course.turn }}><Image src={dishImage(course.id)} alt="" width={440} height={440} sizes="(max-width: 767px) 35vw, 23vw" /></div>)}
            <div className="plating-finish" aria-hidden="true"><span>A little coast, on every plate.</span><i /></div>
          </div>
        </Container>
        <div className="plating-track" aria-hidden="true"><span /></div>
      </div>
    </section>
  )
}
