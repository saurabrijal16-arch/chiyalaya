import Header from './components/Header.jsx'
import Hero from './components/Hero.jsx'
import RestaurantGrid from './components/RestaurantGrid.jsx'
import Footer from './components/Footer.jsx'
import { restaurants } from './data/restaurants.js'
export default function App() {
 return <><a className="skip-link" href="#restaurants">Skip to restaurants</a><Header /><main><Hero /><div className="culture-strip"><span>Rooted in tradition</span><span aria-hidden="true">✦</span><span>Rich in flavour</span><span aria-hidden="true">✦</span><span>Served with love</span></div><RestaurantGrid restaurants={restaurants} /></main><Footer /></>
}
