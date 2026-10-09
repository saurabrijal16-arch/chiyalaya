export default function Badge({children,variant='cuisine'}) {
 return <span className={`badge badge--${variant}`}>{children}</span>
}
