import Image from 'next/image'
import { dishImage } from '../data/dishImages'
import { rupees } from '../utils'
import { Container } from './ui'

export default function ChefSpecial({ dish, quantity, onAdd }) {
  return <section id="chefs-special" className="chef-special" data-chef-scene aria-labelledby="chef-special-title">
    <div className="chef-special-sticky"><Container className="chef-special-layout">
      <div className="chef-special-copy"><p className="eyebrow">The chef’s kiss · Our signature</p><h2 id="chef-special-title">A little fire.<br />A lot of <em>heart.</em></h2><p>Some dishes get a little extra love. Our tandoori prawns meet saffron, a bright lick of flame and the sort of care you can taste.</p><div className="chef-dish-details"><span>Indian · Tandoori Jhinga</span>{dish && <strong>{rupees(dish.price)}</strong>}</div>{dish ? <a href="#thali" onClick={quantity < 9 ? onAdd : undefined} className="button-primary">{quantity >= 9 ? 'See it on your leaf' : 'Add the chef’s favourite'} <span aria-hidden="true">↗</span></a> : <a href="#menu-choices" className="text-link">Explore the kitchen ↗</a>}<p className="chef-handwritten">From our hands, to your heart.</p></div>
      <div className="chef-hand-scene" role="img" aria-label="Our chef welcoming his signature tandoori prawns onto his open hand"><div className="chef-halo" aria-hidden="true" /><Image src="/images/chef-coastal.png" alt="" width={1024} height={1280} sizes="(max-width: 767px) 95vw, 55vw" className="chef-person" /><div className="chef-flying-plate"><Image src={dishImage(16)} alt="" width={520} height={520} sizes="(max-width: 767px) 46vw, 320px" /></div><span className="chef-scene-caption">Scroll. Let a little magic happen.</span></div>
    </Container></div>
  </section>
}
