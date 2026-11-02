/**
 * Clínica San Marcos - Pasaje, El Oro
 * Lógica interactiva para la versión HTML / Live Server
 */

document.addEventListener('DOMContentLoaded', () => {
  initPointerShadow()
  initThemeToggle()
  initMobileMenu()
  initSectionNavigation()
  initCookieNotice()
  initAppointmentForm()
  initClinicChat()
})

function initPointerShadow() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

  const shadow = document.createElement('span')
  shadow.className = 'pointer-shadow'
  shadow.setAttribute('aria-hidden', 'true')
  document.body.appendChild(shadow)

  document.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch') {
      shadow.classList.remove('is-visible')
      return
    }

    shadow.style.transform = `translate3d(${event.clientX - 13}px, ${event.clientY - 10}px, 0)`
    shadow.classList.add('is-visible')
  }, { passive: true })

  document.documentElement.addEventListener('pointerleave', () => {
    shadow.classList.remove('is-visible')
  })

  window.addEventListener('blur', () => {
    shadow.classList.remove('is-visible')
  })
}

/* ==========================================================================
   1. MODO OSCURO / MODO CLARO
   ========================================================================== */
function initThemeToggle() {
  const themeToggle = document.querySelector('.theme-toggle')
  if (!themeToggle) return

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const savedTheme = localStorage.getItem('clinica-theme')

  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add('dark')
    themeToggle.setAttribute('aria-pressed', 'true')
  }

  themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark')
    themeToggle.setAttribute('aria-pressed', String(isDark))
    localStorage.setItem('clinica-theme', isDark ? 'dark' : 'light')

    const metaTheme = document.querySelector('meta[name="theme-color"]')
    if (metaTheme) {
      metaTheme.setAttribute('content', isDark ? '#101b18' : '#f8f8f4')
    }
  })
}

/* ==========================================================================
   2. MENÚ MÓVIL
   ========================================================================== */
function initMobileMenu() {
  const menuToggle = document.querySelector('.menu-toggle')
  const mobileNav = document.getElementById('mobile-navigation')
  if (!menuToggle || !mobileNav) return

  function toggleMenu(open) {
    const isOpen = open !== undefined ? open : !mobileNav.classList.contains('is-open')
    mobileNav.classList.toggle('is-open', isOpen)
    mobileNav.setAttribute('aria-hidden', String(!isOpen))
    menuToggle.setAttribute('aria-expanded', String(isOpen))
  }

  menuToggle.addEventListener('click', () => toggleMenu())

  mobileNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => toggleMenu(false))
  })
}

function initSectionNavigation() {
  const links = [...document.querySelectorAll('.desktop-nav a[href^="#"], .mobile-nav a[href^="#"]:not(.button)')]
  const sections = [...new Set(links.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean))]
  if (!links.length || !sections.length) return

  let updateQueued = false

  function updateActiveLink() {
    updateQueued = false
    const threshold = window.innerHeight * 0.38
    let activeSection = null

    sections.forEach((section) => {
      if (section.getBoundingClientRect().top <= threshold) activeSection = section
    })

    links.forEach((link) => {
      if (activeSection && link.getAttribute('href') === `#${activeSection.id}`) {
        link.setAttribute('aria-current', 'location')
      } else {
        link.removeAttribute('aria-current')
      }
    })
  }

  function queueActiveLinkUpdate() {
    if (updateQueued) return
    updateQueued = true
    window.requestAnimationFrame(updateActiveLink)
  }

  window.addEventListener('scroll', queueActiveLinkUpdate, { passive: true })
  window.addEventListener('resize', queueActiveLinkUpdate)
  window.addEventListener('hashchange', queueActiveLinkUpdate)
  updateActiveLink()
}

function initCookieNotice() {
  const notice = document.getElementById('cookie-notice')
  const dismissButton = notice?.querySelector('.cookie-notice-dismiss')
  if (!notice || !dismissButton) return

  const preferenceKey = 'clinica-cookie-notice-dismissed'
  try {
    if (localStorage.getItem(preferenceKey) === 'true') return
  } catch (error) {
    console.warn('No se pudo leer la preferencia del aviso de privacidad.', error)
  }

  notice.hidden = false
  dismissButton.addEventListener('click', () => {
    notice.hidden = true
    try {
      localStorage.setItem(preferenceKey, 'true')
    } catch (error) {
      console.warn('No se pudo guardar la preferencia del aviso de privacidad.', error)
    }
  })
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character])
}

/* ==========================================================================
   3. FORMULARIO DE AGENDAMIENTO DE CITAS & WHATSAPP
   ========================================================================== */
function initAppointmentForm() {
  const form = document.querySelector('.appointment-form-card')
  const dateInput = document.getElementById('appointment-date')

  if (dateInput) {
    const today = new Date().toISOString().split('T')[0]
    dateInput.min = today
  }

  if (!form) return

  form.addEventListener('submit', (e) => {
    e.preventDefault()

    const name = document.getElementById('appointment-name')?.value.trim() || ''
    const phone = document.getElementById('appointment-phone')?.value.trim() || ''
    const service = document.getElementById('appointment-service')?.value || ''
    const doctor = document.getElementById('appointment-doctor')?.value || ''
    const date = document.getElementById('appointment-date')?.value || ''
    const timeSlot = document.getElementById('appointment-time-slot')?.value || ''
    const notes = document.getElementById('appointment-notes')?.value.trim() || ''

    if (!name || !phone || !service || !date) return

    const displayDate = new Date(`${date}T12:00:00Z`).toLocaleDateString('es-EC', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    const safeName = escapeHtml(name)
    const safePhone = escapeHtml(phone)
    const safeService = escapeHtml(service)
    const safeDoctor = escapeHtml(doctor)
    const safeDate = escapeHtml(displayDate)
    const safeTimeSlot = escapeHtml(timeSlot)
    const safeNotes = escapeHtml(notes)

    const requestSummary = [
      'Solicitud de cita · Clínica San Marcos (Pasaje)',
      `• Paciente: ${name}`,
      `• Teléfono: ${phone}`,
      `• Servicio: ${service}`,
      doctor && doctor !== 'Cualquier médico disponible' ? `• Especialista: ${doctor}` : null,
      `• Fecha preferida: ${displayDate}`,
      timeSlot ? `• Franja horaria: ${timeSlot}` : null,
      notes ? `• Observaciones: ${notes}` : null,
    ]
      .filter(Boolean)
      .join('\n')

    // Render summary card
    const container = form.parentElement
    if (!container) return

    const summaryHtml = `
      <section class="request-card" role="status" aria-labelledby="request-title">
        <div class="request-heading">
          <span class="request-check">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </span>
          <div>
            <span class="request-eyebrow">Solicitud preparada</span>
            <h3 id="request-title">Coordina y confirma tu cita</h3>
          </div>
        </div>

        <dl class="request-details">
          <div><dt>Paciente</dt><dd>${safeName}</dd></div>
          <div><dt>Teléfono</dt><dd>${safePhone}</dd></div>
          <div><dt>Servicio</dt><dd>${safeService}</dd></div>
          ${doctor && doctor !== 'Cualquier médico disponible' ? `<div><dt>Especialista</dt><dd>${safeDoctor}</dd></div>` : ''}
          <div><dt>Fecha preferida</dt><dd>${safeDate}</dd></div>
          ${timeSlot ? `<div><dt>Horario</dt><dd>${safeTimeSlot}</dd></div>` : ''}
          ${notes ? `<div><dt>Notas</dt><dd>${safeNotes}</dd></div>` : ''}
        </dl>

        <p class="request-disclaimer">
          Tus datos están listos. Haz clic en el botón de WhatsApp a continuación para enviar tu mensaje directamente a recepción:
        </p>

        <div class="request-actions">
          <button id="send-whatsapp-btn" class="button button-primary whatsapp-btn" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
            Enviar solicitud por WhatsApp
          </button>
          <a class="button button-outline" href="tel:+59372913916">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            Llamar al 07 291 3916
          </a>
          <button id="copy-details-btn" class="button button-text" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            Copiar datos
          </button>
        </div>

        <p id="copy-status-msg" class="copy-message" aria-live="polite"></p>

        <button id="reset-form-btn" class="edit-request" type="button">
          ← Volver a modificar datos
        </button>
      </section>
    `

    form.style.display = 'none'
    const summaryWrapper = document.createElement('div')
    summaryWrapper.id = 'appointment-summary-wrapper'
    summaryWrapper.innerHTML = summaryHtml
    container.appendChild(summaryWrapper)

    // Event listeners on summary card
    document.getElementById('send-whatsapp-btn')?.addEventListener('click', () => {
      const url = `https://api.whatsapp.com/send?phone=59372913916&text=${encodeURIComponent(requestSummary)}`
      window.open(url, '_blank', 'noopener,noreferrer')
    })

    document.getElementById('copy-details-btn')?.addEventListener('click', async () => {
      const msg = document.getElementById('copy-status-msg')
      try {
        await navigator.clipboard.writeText(requestSummary)
        if (msg) msg.textContent = '¡Datos copiados! Puedes pegarlos en WhatsApp o notas.'
      } catch {
        if (msg) msg.textContent = 'Llama a recepción al 07 291 3916 para confirmar.'
      }
    })

    document.getElementById('reset-form-btn')?.addEventListener('click', () => {
      summaryWrapper.remove()
      form.style.display = 'block'
    })
  })
}

/* ==========================================================================
   4. ASISTENTE VIRTUAL INTELIGENTE (SIN ERRORES DE API)
   ========================================================================== */
function initClinicChat() {
  const launcher = document.querySelector('.clinic-chat-launcher')
  const panel = document.getElementById('clinic-chat-panel')
  const closeBtn = document.querySelector('.clinic-chat-dismiss')
  const composer = document.querySelector('.clinic-chat-composer')
  const textarea = document.getElementById('clinic-chat-input')
  const messageList = document.querySelector('.clinic-chat-message-list')
  const resetBtn = document.getElementById('chat-reset-btn')

  if (!launcher || !panel || !composer || !textarea || !messageList) return

  let isBusy = false

  function toggleChat(open) {
    const isHidden = open !== undefined ? !open : !panel.hidden
    panel.hidden = isHidden
    launcher.setAttribute('aria-expanded', String(!isHidden))
    if (!isHidden) {
      textarea?.focus()
      scrollToBottom()
    }
  }

  launcher.addEventListener('click', () => toggleChat())
  closeBtn?.addEventListener('click', () => toggleChat(false))

  // Escape key closes chat
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) {
      toggleChat(false)
      launcher.focus()
    }
  })

  // Suggested questions
  document.querySelectorAll('.clinic-chat-suggestions button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const text = btn.getAttribute('data-question') || btn.textContent?.trim() || ''
      if (text && !isBusy) {
        handleUserMessage(text)
      }
    })
  })

  // Composer submit
  composer.addEventListener('submit', (e) => {
    e.preventDefault()
    const text = textarea.value.trim()
    if (!text || isBusy) return
    textarea.value = ''
    handleUserMessage(text)
  })

  // Textarea enter
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      composer.requestSubmit()
    }
  })

  // Reset chat
  resetBtn?.addEventListener('click', () => {
    const welcome = document.querySelector('.clinic-chat-welcome')
    messageList.innerHTML = ''
    if (welcome) messageList.appendChild(welcome)
    initSuggestedButtons()
  })

  function initSuggestedButtons() {
    document.querySelectorAll('.clinic-chat-suggestions button').forEach((btn) => {
      btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-question') || btn.textContent?.trim() || ''
        if (text && !isBusy) handleUserMessage(text)
      })
    })
  }

  function scrollToBottom() {
    messageList.scrollTop = messageList.scrollHeight
  }

  function handleUserMessage(text) {
    isBusy = true
    const welcome = document.querySelector('.clinic-chat-welcome')
    if (welcome) welcome.remove()

    // Append user bubble
    appendMessage(text, 'user')
    scrollToBottom()

    // Show typing indicator
    const typingIndicator = createTypingIndicator()
    messageList.appendChild(typingIndicator)
    scrollToBottom()

    // Generate response using clinic knowledge base
    const answer = getClinicAnswer(text)

    setTimeout(() => {
      typingIndicator.remove()
      streamAssistantMessage(answer, () => {
        isBusy = false
      })
    }, 600)
  }

  function appendMessage(text, role) {
    const msgDiv = document.createElement('div')
    msgDiv.className = `clinic-chat-message is-${role}`

    if (role === 'assistant') {
      const logo = document.createElement('span')
      logo.className = 'clinic-chat-message-logo'
      logo.innerHTML = `<img src="images/clinic-san-marcos-logo.webp" alt="" width="34" height="34" />`
      msgDiv.appendChild(logo)
    }

    const bubble = document.createElement('div')
    bubble.className = 'clinic-chat-bubble text-sm'
    bubble.innerHTML = formatChatText(text)
    msgDiv.appendChild(bubble)

    messageList.appendChild(msgDiv)
    return bubble
  }

  function streamAssistantMessage(fullText, onComplete) {
    const msgDiv = document.createElement('div')
    msgDiv.className = 'clinic-chat-message is-assistant'

    const logo = document.createElement('span')
    logo.className = 'clinic-chat-message-logo'
    logo.innerHTML = `<img src="images/clinic-san-marcos-logo.webp" alt="" width="34" height="34" />`
    msgDiv.appendChild(logo)

    const bubble = document.createElement('div')
    bubble.className = 'clinic-chat-bubble text-sm'
    msgDiv.appendChild(bubble)
    messageList.appendChild(msgDiv)

    const words = fullText.split(' ')
    let i = 0

    const interval = setInterval(() => {
      if (i < words.length) {
        i += 2
        bubble.innerHTML = formatChatText(words.slice(0, i).join(' '))
        scrollToBottom()
      } else {
        clearInterval(interval)
        bubble.innerHTML = formatChatText(fullText)
        scrollToBottom()
        if (onComplete) onComplete()
      }
    }, 30)
  }

  function createTypingIndicator() {
    const div = document.createElement('div')
    div.className = 'clinic-chat-typing'
    div.innerHTML = `
      <span class="clinic-chat-typing-dot"></span>
      <span class="clinic-chat-typing-dot"></span>
      <span class="clinic-chat-typing-dot"></span>
      <span class="sr-only">El asistente está respondiendo...</span>
    `
    return div
  }

  function formatChatText(str) {
    const lines = str.split('\n')
    return lines
      .map((line) => {
        if (!line.trim()) return '<div class="h-2"></div>'
        let formatted = line
          // Bold **text**
          .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
          // Phone link 07 291 3916
          .replace(
            /(\+?593\s?7\s?291\s?3916|07\s?291\s?3916)/g,
            '<a href="tel:+59372913916" class="font-semibold underline text-emerald-600 dark:text-emerald-400">$1</a>',
          )

        const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-')
        return `<p class="${isBullet ? 'pl-2 my-0.5' : 'my-1'} leading-relaxed">${formatted}</p>`
      })
      .join('')
  }
}

/* ==========================================================================
   5. MOTOR DE CONOCIMIENTO CLÍNICO (RESPALDO INTELIGENTE)
   ========================================================================== */
function getClinicAnswer(query) {
  const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  // 1. Emergencias críticas
  if (
    q.includes('pecho') ||
    q.includes('infarto') ||
    q.includes('paro') ||
    q.includes('asfixia') ||
    q.includes('desmay') ||
    q.includes('convulsi') ||
    q.includes('sangrado abundant') ||
    q.includes('inconscient') ||
    q.includes('grave') ||
    q.includes('ahogo')
  ) {
    return (
      'ATENCIÓN INMEDIATA: Si estás experimentando una emergencia médica crítica, por favor acude directamente al área de Emergencias de Clínica San Marcos o llama de inmediato al ECU 911.\n\n' +
      'Nuestro servicio de Urgencias atiende las 24 horas en Pasaje. También puedes llamar a la clínica al 07 291 3916 (+593 7 291 3916).'
    )
  }

  // 2. Horarios y urgencias 24/7
  if (
    q.includes('emergencia') ||
    q.includes('urgencia') ||
    q.includes('guardia') ||
    q.includes('24 horas') ||
    q.includes('24/7') ||
    q.includes('domingo') ||
    q.includes('feriado') ||
    q.includes('noche')
  ) {
    return (
      'Sí, en Clínica San Marcos atendemos **EMERGENCIAS MÉDICAS LAS 24 HORAS**, todos los días.\n\n' +
      'Si requieres atención de urgencia, comunícate al 07 291 3916 o visítanos directamente en Pasaje.'
    )
  }

  // 3. Teléfono y contacto
  if (
    q.includes('telefono') ||
    q.includes('numero') ||
    q.includes('llamar') ||
    q.includes('contacto') ||
    q.includes('celular') ||
    q.includes('whatsapp')
  ) {
    return (
      'Puedes comunicarte directamente con Clínica San Marcos:\n\n' +
      '**Teléfono principal:** 07 291 3916 (+593 7 291 3916)\n' +
      'Atención de urgencias las 24 horas. Para agendar citas, también puedes utilizar el formulario en esta web y enviarlo por WhatsApp.'
    )
  }

  // 4. Ubicación y dirección
  if (
    q.includes('ubicacion') ||
    q.includes('direccion') ||
    q.includes('donde') ||
    q.includes('queda') ||
    q.includes('llegar') ||
    q.includes('ciudad') ||
    q.includes('pasaje')
  ) {
    return (
      'Clínica San Marcos está ubicada en la ciudad de **Pasaje, provincia de El Oro, Ecuador**.\n\n' +
      'Estamos en un punto céntrico y accesible. En la sección "Contacto" de esta web encontrarás el botón directo para abrir la ruta en Google Maps, o llámanos al 07 291 3916.'
    )
  }

  // 5. Citas médicas y agendamiento
  if (
    q.includes('cita') ||
    q.includes('turno') ||
    q.includes('agendar') ||
    q.includes('reservar') ||
    q.includes('horario')
  ) {
    return (
      'Para solicitar una cita médica en Clínica San Marcos:\n\n' +
      '1. Ve a la sección **"Agenda tu visita"** en esta página web.\n' +
      '2. Completa tus datos (nombre, teléfono, especialidad y fecha de preferencia).\n' +
      '3. Podrás enviar tu solicitud directamente por WhatsApp o llamar al 07 291 3916 para coordinar y confirmar el horario con recepción.'
    )
  }

  // 6. Doctores y especialistas
  if (
    q.includes('doctor') ||
    q.includes('medico') ||
    q.includes('especialista') ||
    q.includes('pediatra') ||
    q.includes('ginecolog')
  ) {
    return (
      'Estamos actualizando la información del cuerpo médico. Para conocer los especialistas y sus horarios, llámanos al 07 291 3916.'
    )
  }

  // 7. Servicios médicos integrales
  if (
    q.includes('servicio') ||
    q.includes('laboratorio') ||
    q.includes('rayos x') ||
    q.includes('radiografia') ||
    q.includes('ecografia') ||
    q.includes('cirugia') ||
    q.includes('quirofano') ||
    q.includes('hospitalizacion')
  ) {
    return (
      'En Clínica San Marcos dispones de atención médica integral:\n\n' +
      '1. **Emergencias 24/7** con atención médica inmediata.\n' +
      '2. **Consulta Externa** (Medicina General, Pediatría y especialidades).\n' +
      '3. **Laboratorio Clínico** automatizado (análisis de rutina y perfiles completos con entrega rápida).\n' +
      '4. **Imagenología digital** (Rayos X de alta nitidez y ecografías).\n' +
      '5. **Quirófanos** equipados para cirugía general y procedimientos programados.\n' +
      '6. **Hospitalización** y cuidados continuos con enfermería 24 horas.\n\n' +
      '¿Deseas información sobre alguno en particular? Llámanos al 07 291 3916.'
    )
  }

  // 8. Costos, precios y formas de pago
  if (
    q.includes('precio') ||
    q.includes('costo') ||
    q.includes('tarifa') ||
    q.includes('valor') ||
    q.includes('cuanto cuesta') ||
    q.includes('pago') ||
    q.includes('tarjeta')
  ) {
    return (
      'Los costos varían según el servicio, examen de laboratorio o procedimiento específico. ' +
      'Para brindarte una cotización exacta, por favor comunícate con recepción al 07 291 3916.\n\n' +
      'Aceptamos pagos en efectivo, transferencias bancarias y tarjetas de crédito o débito.'
    )
  }

  // 9. Saludos
  if (
    q.includes('hola') ||
    q.includes('buenos dias') ||
    q.includes('buenas tardes') ||
    q.includes('buenas noches') ||
    q.startsWith('que tal')
  ) {
    return (
      '¡Hola! Es un gusto saludarte. Soy el asistente virtual de Clínica San Marcos en Pasaje, El Oro. Cuidamos de ti y de tu familia desde 2007.\n\n' +
      'Puedo orientarte con:\n' +
      '• Servicios médicos y especialidades\n' +
      '• Atención de emergencias 24/7 (Tel: 07 291 3916)\n' +
      '• Agendamiento de citas médicas\n' +
      '• Ubicación y cuerpo médico\n\n' +
      '¿En qué te podemos ayudar hoy?'
    )
  }

  // 10. Default amigable
  return (
    'Con mucho gusto te oriento. Clínica San Marcos atiende a las familias de Pasaje y El Oro desde 2007, ' +
    'ofreciendo Emergencias 24/7, consultas médicas, laboratorio clínico, rayos X, ecografías, cirugía y hospitalización.\n\n' +
    'Si deseas coordinar una cita médica o consultar disponibilidad, llámanos al 07 291 3916 o utiliza nuestro formulario en esta página.'
  )
}
