/* Flâneur — App Demo section: lazy-load & autoplay phone screen recordings */

export function initDemoSection() {
  const videos = [...document.querySelectorAll('.demo-phone__video')]
  if (!videos.length) return

  videos.forEach((v) => {
    v.addEventListener('loadeddata', () => v.classList.add('ready'))
  })

  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) {
          target.load()
          target.play().catch(() => {})
        } else {
          target.pause()
        }
      })
    },
    { threshold: 0.25 }
  )

  videos.forEach((v) => obs.observe(v))
}
