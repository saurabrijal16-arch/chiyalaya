import Badge from './Badge.jsx'
import Rating from './Rating.jsx'
export default function RestaurantCard({restaurant}) {
 return <article className="restaurant-card"><div className="card-image"><img src={restaurant.image} alt={restaurant.alt} loading="lazy" /><span className="image-label">{restaurant.label}</span></div><div className="card-content"><div className="card-meta"><Badge>{restaurant.cuisine}</Badge><Rating value={restaurant.rating} /></div><h3>{restaurant.name}</h3><p className="location"><span aria-hidden="true">⌖</span> {restaurant.location}</p><p className="card-description">{restaurant.description}</p><div className="card-bottom"><div><span className="small-label">DON’T MISS</span><p>{restaurant.specialty}</p></div><Badge variant="price">{restaurant.price}</Badge></div></div></article>
}
