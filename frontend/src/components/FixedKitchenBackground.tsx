/**
 * Kitchen Line–style fixed lifestyle background.
 * Content scrolls over a settled kitchen photograph.
 * Replace the image URL with your own showroom/product shot for best results.
 */
export function FixedKitchenBackground() {
  return (
    <div className="fixed-kitchen-bg" aria-hidden="true">
      <div className="fixed-kitchen-bg__image" />
      <div className="fixed-kitchen-bg__wash" />
    </div>
  )
}
