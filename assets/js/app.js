/* ============================================================
   MEDICAL EDITING — un solo file di comportamento
   Nessuna libreria esterna. Tutto vanilla, funziona ovunque.
   ============================================================ */

(function () {
  'use strict'

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  /* ---------- 1. Comparsa allo scroll ---------- */

  var reveals = document.querySelectorAll('.reveal')

  if (reduced || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(reveals, function (n) {
      n.setAttribute('data-shown', 'true')
    })
  } else {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return
          entry.target.setAttribute('data-shown', 'true')
          io.unobserve(entry.target)
        })
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0 },
    )
    Array.prototype.forEach.call(reveals, function (n) {
      io.observe(n)
    })
  }

  /* ---------- 2. Barra in alto: sfondo + progresso + menu ---------- */

  var nav = document.getElementById('nav')
  var progress = document.getElementById('progress')
  var burger = document.getElementById('burger')
  var frame = 0

  function onScroll() {
    if (frame) return
    frame = requestAnimationFrame(function () {
      frame = 0
      nav.setAttribute('data-scrolled', window.scrollY > 40 ? 'true' : 'false')
      var max = document.body.scrollHeight - window.innerHeight
      var ratio = max > 0 ? Math.min(1, window.scrollY / max) : 0
      progress.style.transform = 'scaleX(' + ratio + ')'
    })
  }

  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()

  function closeMenu() {
    nav.setAttribute('data-open', 'false')
    burger.setAttribute('aria-expanded', 'false')
    burger.setAttribute('aria-label', 'Apri il menu')
    document.body.style.overflow = ''
  }

  burger.addEventListener('click', function () {
    var open = nav.getAttribute('data-open') === 'true'
    if (open) {
      closeMenu()
    } else {
      nav.setAttribute('data-open', 'true')
      burger.setAttribute('aria-expanded', 'true')
      burger.setAttribute('aria-label', 'Chiudi il menu')
      document.body.style.overflow = 'hidden'
    }
  })

  Array.prototype.forEach.call(document.querySelectorAll('#menu a'), function (a) {
    a.addEventListener('click', closeMenu)
  })

  /* ---------- 3. Anteprima muta delle copertine ---------- */

  var canPreview = window.matchMedia('(hover: hover)').matches && !reduced

  Array.prototype.forEach.call(document.querySelectorAll('.reel'), function (card) {
    var v = card.querySelector('video')
    if (!v) return

    function play() {
      if (!canPreview) return
      var p = v.play()
      if (p && p.catch) p.catch(function () {})
    }

    function stop() {
      if (!canPreview) return
      v.pause()
      v.currentTime = 0
    }

    card.addEventListener('mouseenter', play)
    card.addEventListener('mouseleave', stop)
    card.addEventListener('focus', play)
    card.addEventListener('blur', stop)
  })

  /* ---------- 4. Video a schermo intero ---------- */

  var box = document.getElementById('lightbox')
  var boxInner = document.getElementById('lightbox-inner')
  var boxVideo = document.getElementById('lightbox-video')
  var lastFocus = null

  function openBox(card) {
    var id = card.getAttribute('data-reel')
    boxVideo.setAttribute('poster', 'video/' + id + '-poster.jpg')
    boxVideo.setAttribute('src', 'video/' + id + '.mp4')
    document.getElementById('lightbox-kicker').textContent = card.getAttribute('data-kicker')
    document.getElementById('lightbox-title').textContent = card.getAttribute('data-title')
    document.getElementById('lightbox-note').textContent = card.getAttribute('data-note')
    document.getElementById('lightbox-field').textContent = card.getAttribute('data-field')

    lastFocus = document.activeElement
    box.setAttribute('data-open', 'true')
    document.body.style.overflow = 'hidden'
    boxInner.focus()
    var p = boxVideo.play()
    if (p && p.catch) p.catch(function () {})
  }

  function closeBox() {
    box.setAttribute('data-open', 'false')
    boxVideo.pause()
    boxVideo.removeAttribute('src')
    boxVideo.load()
    document.body.style.overflow = ''
    if (lastFocus) lastFocus.focus()
  }

  Array.prototype.forEach.call(document.querySelectorAll('.reel'), function (card) {
    card.addEventListener('click', function () {
      openBox(card)
    })
  })

  document.getElementById('lightbox-close').addEventListener('click', closeBox)
  box.addEventListener('click', function (e) {
    if (e.target === box) closeBox()
  })
  boxInner.addEventListener('click', function (e) {
    e.stopPropagation()
  })

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return
    if (box.getAttribute('data-open') === 'true') closeBox()
    if (nav.getAttribute('data-open') === 'true') closeMenu()
  })

  /* ---------- 5. Modulo di candidatura ----------
     Senza server: compone una mail già pronta.
     Quando arriva Tally, questo blocco si può cancellare. */

  var form = document.getElementById('form')

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault()
      var data = new FormData(form)
      var corpo =
        'Nome e specialità: ' +
        (data.get('nome') || '') +
        '\nContatto: ' +
        (data.get('contatto') || '') +
        '\n\n' +
        (data.get('messaggio') || '')

      window.location.href =
        'mailto:info@medicalediting.it?subject=' +
        encodeURIComponent('Candidatura dal sito — ' + (data.get('nome') || '')) +
        '&body=' +
        encodeURIComponent(corpo)

      document.getElementById('form-esito').textContent =
        'Si apre il tuo programma di posta con il messaggio già pronto: controlla e invia.'
    })
  }

  /* ---------- 6. Banda cookie ----------
     Solo cookie tecnici: la banda è informativa e la scelta
     resta salvata in locale, non in un cookie di profilazione. */

  var bar = document.getElementById('cookiebar')
  var CHIAVE = 'me-cookie-ok'

  try {
    if (!localStorage.getItem(CHIAVE)) {
      window.setTimeout(function () {
        bar.setAttribute('data-open', 'true')
      }, 900)
    }
  } catch (err) {
    bar.setAttribute('data-open', 'true')
  }

  var okBtn = bar.querySelector('[data-cookie="ok"]')
  if (okBtn) {
    okBtn.addEventListener('click', function () {
      try {
        localStorage.setItem(CHIAVE, '1')
      } catch (err) {
        /* navigazione privata: pazienza, si richiede alla visita dopo */
      }
      bar.setAttribute('data-open', 'false')
    })
  }
})()
