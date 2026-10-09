export default function Rating({value}) {
 return <span className="rating" aria-label={`${value.toFixed(1)} out of 5 stars`}><span aria-hidden="true">★</span> <strong>{value.toFixed(1)}</strong><span className="rating-scale"> / 5</span></span>
}
