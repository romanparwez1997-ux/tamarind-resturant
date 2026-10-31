import Image from 'next/image'
import { dishImage } from '../data/dishImages'
import { cuisines } from '../data/menu'
import { Container } from './ui'

export default function CourseGallery({ onChoose }) {
  return <div className="course-gallery cuisine-gallery" data-course-gallery aria-labelledby="course-gallery-title"><div className="course-gallery-sticky"><Container>
    <div className="course-gallery-heading"><div><p className="eyebrow">Four kitchens. One warm welcome.</p><h2 id="course-gallery-title" className="section-title">A world of <em>flavour.</em></h2></div><p>Where will the evening take you?<span className="gallery-desktop-note">Scroll to discover ↗</span><span className="gallery-touch-note">Swipe to discover →</span></p></div>
    <div className="course-gallery-window"><div className="course-gallery-track" data-gallery-track>{cuisines.filter(item=>item.id!=='all').map((cuisine,index)=><a key={cuisine.id} href="#menu-choices" onClick={()=>onChoose(cuisine.id)} className={`course-panel cuisine-panel-${cuisine.id}`} style={{'--panel-index':index}}><div className="course-panel-photo"><span className="course-panel-word" aria-hidden="true">{cuisine.label}</span><Image src={dishImage(cuisine.imageId)} alt={cuisine.label+' kitchen'} width={650} height={650} sizes="(max-width: 767px) 80vw, 40vw" /><span className="course-panel-number">0{index+1} / 04</span><span className="course-panel-choose">Explore {cuisine.label.toLowerCase()}<i aria-hidden="true">↗</i></span></div><div className="course-panel-caption"><h3>{cuisine.label}</h3><p>{cuisine.note}</p></div></a>)}</div></div><div className="course-gallery-rule" aria-hidden="true"><span /></div>
  </Container></div></div>
}
