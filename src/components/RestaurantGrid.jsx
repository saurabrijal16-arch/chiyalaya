import RestaurantCard from './RestaurantCard.jsx'
export default function RestaurantGrid({restaurants}) {
 return <section className="restaurants container" id="restaurants" aria-labelledby="restaurants-title"><div className="section-heading"><div><p className="eyebrow">THE RESTAURANT COLLECTION</p><h2 id="restaurants-title">Good food. Great places.</h2></div><span className="collection-count">{restaurants.length} places to discover</span></div><div className="restaurant-grid">{restaurants.map(restaurant => <RestaurantCard key={restaurant.id} restaurant={restaurant} />)}</div></section>
}
