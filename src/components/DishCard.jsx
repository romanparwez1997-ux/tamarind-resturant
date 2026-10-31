import Image from 'next/image'
import { rupees } from '../utils'
import { dishImage } from '../data/dishImages'
import { plateDish } from '../lib/plateMotion'
import PortionStepper from './PortionStepper'
import { DietMark, SpiceMeter } from './ui'

export default function DishCard({ dish, quantity, onQuantityChange, index }) {
  const photo = dishImage(dish.id)
  function changeQuantity(next, source) {
    if (next > quantity) plateDish(dish.id, source)
    onQuantityChange(next)
  }
  return (
    <li data-dish-card={dish.id} data-menu-reveal style={{ '--dish-index': index }} className={`dish-card ${quantity > 0 ? 'dish-selected' : ''}`}>
      {photo && <button type="button" className="dish-portrait" disabled={quantity >= 9} onClick={(event) => changeQuantity(quantity + 1, event.currentTarget)} aria-label={`Add ${dish.name} to thali`}><Image src={photo} alt={dish.name} width={520} height={520} sizes="(max-width: 639px) 75vw, (max-width: 1023px) 40vw, 23vw" /><span className="dish-photo-hint" aria-hidden="true">{quantity >= 9 ? 'On your leaf' : 'Place on your leaf'} <i>↗</i></span></button>}
      <div className="dish-card-body">
        <div className="dish-card-meta"><DietMark veg={dish.veg} /><span>{dish.chefsPick ? 'Chef’s signature' : dish.cuisine || 'Indian'}{dish.chefsPick ? '' : ' kitchen'}</span>{quantity > 0 && <span className="on-leaf-mark">On your leaf</span>}</div>
        <div className="dish-card-name"><h4>{dish.name}</h4><span>{rupees(dish.price)}</span></div>
        <p>{dish.description}</p>
        <div className="dish-card-controls"><div className="flex items-center gap-2.5">{dish.spice > 0 && <SpiceMeter level={dish.spice} />}{dish.tag && <span className="dish-tag">{dish.tag}</span>}</div><PortionStepper value={quantity} onChange={changeQuantity} label={dish.name} /></div>
      </div>
    </li>
  )
}
