import { useEffect, useRef, useCallback } from 'react'

export default function useSwipe(trackRef, { currentPage, totalPages, onPageChange }) {
  const pageRef = useRef(currentPage)
  pageRef.current = currentPage
  const dragging = useRef(false)
  const cbRef = useRef(onPageChange)
  cbRef.current = onPageChange

  const getPageWidth = useCallback(() => {
    const track = trackRef.current
    return track ? track.parentElement.offsetWidth : 0
  }, [trackRef])

  // Sync transform when currentPage changes programmatically
  useEffect(() => {
    if (dragging.current) return
    const track = trackRef.current
    if (!track) return
    const pw = getPageWidth()
    track.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
    track.style.transform = `translateX(${-currentPage * pw}px)`
  }, [currentPage, trackRef, getPageWidth])

  // Update on resize without animation
  useEffect(() => {
    const onResize = () => {
      const track = trackRef.current
      if (!track) return
      track.style.transition = 'none'
      track.style.transform = `translateX(${-pageRef.current * getPageWidth()}px)`
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [trackRef, getPageWidth])

  // Touch drag handling
  useEffect(() => {
    const track = trackRef.current
    if (!track || totalPages <= 1) return

    const state = { startX: 0, startY: 0, startTime: 0, locked: false, horizontal: false }

    const onTouchStart = (e) => {
      const t = e.touches[0]
      state.startX = t.clientX
      state.startY = t.clientY
      state.startTime = Date.now()
      state.locked = false
      state.horizontal = false
      dragging.current = false
      track.style.transition = 'none'
    }

    const onTouchMove = (e) => {
      const t = e.touches[0]
      const dx = t.clientX - state.startX
      const dy = t.clientY - state.startY

      if (!state.locked) {
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return
        state.locked = true
        state.horizontal = Math.abs(dx) >= Math.abs(dy)
      }
      if (!state.horizontal) return

      dragging.current = true
      const pw = getPageWidth()
      const page = pageRef.current
      const baseX = -page * pw

      // Rubber-band resistance at edges
      let offset = dx
      if ((page === 0 && dx > 0) || (page === totalPages - 1 && dx < 0)) {
        offset = dx * 0.25
      }

      track.style.transform = `translateX(${baseX + offset}px)`
    }

    const onTouchEnd = (e) => {
      if (!dragging.current) return
      dragging.current = false

      const t = e.changedTouches[0]
      const dx = t.clientX - state.startX
      const pw = getPageWidth()
      const page = pageRef.current
      const velocity = Math.abs(dx) / (Date.now() - state.startTime)

      let target = page
      if (Math.abs(dx) > pw * 0.2 || velocity > 0.4) {
        if (dx < 0 && page < totalPages - 1) target++
        else if (dx > 0 && page > 0) target--
      }

      track.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
      track.style.transform = `translateX(${-target * pw}px)`
      if (target !== page) cbRef.current(target)
    }

    track.addEventListener('touchstart', onTouchStart, { passive: true })
    track.addEventListener('touchmove', onTouchMove, { passive: true })
    track.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      track.removeEventListener('touchstart', onTouchStart)
      track.removeEventListener('touchmove', onTouchMove)
      track.removeEventListener('touchend', onTouchEnd)
    }
  }, [trackRef, totalPages, getPageWidth])
}
