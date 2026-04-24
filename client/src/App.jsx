import { startTransition, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import {
  aboutContextCards,
  aboutRadioParagraphs,
  archiveEntries,
  archiveSupportCards,
  broadcastWindows,
  carePanels,
  contactCards,
  contactLinks,
  donationNotes,
  donationWays,
  featuredBroadcasts,
  homeFeaturePanels,
  homeHighlights,
  homeSignalCards,
  leadershipCards,
  listenLiveStats,
  liveAudioUrl,
  liveSidebarCards,
  memorialCard,
  ministryTimeline,
  officialSources,
  onAirPrograms,
  requestChannels,
  requestGuidelines,
  requestSpotlights,
  schedule,
  scheduleNotes,
  stationIdentity,
  stationLinks,
} from './stationContent'

const monthFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
})

const dayFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
})

const pages = [
  {
    key: 'home',
    path: '/',
    label: 'Home',
    allowViewMode: false,
    eyebrow: 'Broadcast home',
    title: 'GWM Radio for worship, prayer, preaching, and the Word.',
    description:
      'Enter the station from the home page, launch the live stream, move through schedule and archive, and stay connected to Genesis Worship Ministry.',
  },
  {
    key: 'about',
    path: '/about-us',
    label: 'About Us',
    allowViewMode: false,
    eyebrow: 'Station identity',
    title: 'About GWM Radio Station',
    description:
      'Learn the mission, ministry story, leadership context, and memorial legacy surrounding Genesis Worship Ministry and its radio outreach.',
  },
  {
    key: 'listen',
    path: '/listen-live',
    label: 'Listen Live',
    allowViewMode: false,
    centerIntro: true,
    eyebrow: 'On air now',
    title: 'A fuller live radio page with now-playing focus and active community tools.',
    description:
      'Start the stream, track the listener room, follow on-air segments, and stay connected through comments, requests, and quick-access station actions.',
  },
  {
    key: 'schedule',
    path: '/schedule',
    label: 'Schedule',
    allowViewMode: true,
    eyebrow: 'Programming',
    title: 'Follow the official ministry rhythm and the station’s broadcast windows.',
    description:
      'See weekly ministry anchors from the source sites and how those gatherings shape the station’s worship and teaching flow.',
  },
  {
    key: 'archive',
    path: '/archive',
    label: 'Archive',
    allowViewMode: true,
    eyebrow: 'Replay center',
    title: 'Browse archive recordings, replay notes, and calendar-based station history.',
    description:
      'Move between a calendar layout and a list layout to revisit recent worship, Bible study, prayer, and featured replay content.',
  },
  {
    key: 'requests',
    path: '/requests',
    label: 'Requests',
    allowViewMode: true,
    eyebrow: 'Listener requests',
    title: 'Receive gospel music requests, dedications, and listener notes.',
    description:
      'Use the request page to gather songs, dedications, and the stories behind them while keeping the station experience active.',
  },
  {
    key: 'contact',
    path: '/contact',
    label: 'Contact',
    allowViewMode: false,
    eyebrow: 'Prayer and care',
    title: 'Connect with Genesis Worship Ministry for prayer, testimony, and follow-up.',
    description:
      'The contact page is the ministry care desk for prayer requests, testimonies, volunteer interest, and general station questions.',
  },
  {
    key: 'donation',
    path: '/donation',
    label: 'Donation',
    allowViewMode: false,
    eyebrow: 'Support the ministry',
    title: 'Give to support Genesis Worship Ministry and GWM Radio.',
    description:
      'Use the donation page to support the radio outreach, worship ministry, and the ongoing digital presence connected to Genesis Worship Ministry.',
  },
]

function normalizePath(pathname) {
  if (!pathname) return '/'
  const basePath = pathname.split('#')[0].split('?')[0]
  const trimmed = basePath.length > 1 ? basePath.replace(/\/+$/, '') : basePath
  return trimmed.toLowerCase()
}

function routeFromPath(pathname) {
  const normalized = normalizePath(pathname)
  const match = pages.find((page) => page.path === normalized)
  return match?.key ?? 'home'
}

function getHashTarget(pathname) {
  if (!pathname.includes('#')) return ''
  return pathname.slice(pathname.indexOf('#'))
}

function getSessionId() {
  const storageKey = 'gwm-session-id'
  const saved = window.localStorage.getItem(storageKey)

  if (saved) return saved

  const created = `listener-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  window.localStorage.setItem(storageKey, created)
  return created
}

function monthStartFromEntries(entries) {
  return entries
    .map((entry) => entry.date.slice(0, 7))
    .sort()
    .reverse()[0]
}

function buildCalendar(month) {
  const [year, monthIndex] = month.split('-').map(Number)
  const firstDay = new Date(year, monthIndex - 1, 1)
  const lastDay = new Date(year, monthIndex, 0)
  const startWeekday = firstDay.getDay()
  const daysInMonth = lastDay.getDate()
  const cells = []

  for (let i = 0; i < startWeekday; i += 1) {
    cells.push(null)
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(`${month}-${String(day).padStart(2, '0')}`)
  }

  while (cells.length % 7 !== 0) {
    cells.push(null)
  }

  return cells
}

function formatPreviewTime(timestamp) {
  if (!timestamp) return 'Just now'

  try {
    return new Date(timestamp).toLocaleString()
  } catch {
    return 'Just now'
  }
}

function getInitials(name) {
  if (!name) return 'L'

  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function ViewToggle({ value, onChange }) {
  return (
    <div className="view-toggle" role="group" aria-label="View mode">
      {['grid', 'list'].map((mode) => (
        <button
          key={mode}
          type="button"
          className={value === mode ? 'is-active' : ''}
          onClick={() => onChange(mode)}
        >
          {mode}
        </button>
      ))}
    </div>
  )
}

function PageIntro({ page, viewMode, onViewModeChange }) {
  return (
    <section className={`page-intro section-block${page.centerIntro ? ' page-intro--centered' : ''}`}>
      <div className="page-intro__copy">
        <p className="eyebrow">{page.eyebrow}</p>
        <h1>{page.title}</h1>
        <p>{page.description}</p>
      </div>
      {page.allowViewMode ? (
        <div className="page-intro__actions">
          <span>View mode</span>
          <ViewToggle value={viewMode} onChange={onViewModeChange} />
        </div>
      ) : null}
    </section>
  )
}

function SourceList({ title, items }) {
  return (
    <article className="panel">
      <span className="stat-kicker">{title}</span>
      <div className="stack-layout compact-layout">
        {items.map((item) => (
          <article key={item.label} className="person-card">
            <h4>{item.label}</h4>
            {'href' in item ? (
              <>
                <p>{item.note}</p>
                <a href={item.href} target="_blank" rel="noreferrer">
                  Open source
                </a>
              </>
            ) : (
              <p>{item.body}</p>
            )}
          </article>
        ))}
      </div>
    </article>
  )
}

function App() {
  const [route, setRoute] = useState(routeFromPath(window.location.pathname))
  const [locationHash, setLocationHash] = useState(window.location.hash)
  const [viewModes, setViewModes] = useState({
    home: 'grid',
    about: 'grid',
    listen: 'grid',
    schedule: 'grid',
    archive: 'grid',
    requests: 'grid',
    contact: 'grid',
  })
  const [listenerCount, setListenerCount] = useState(0)
  const [comments, setComments] = useState([])
  const [recentRequests, setRecentRequests] = useState([])
  const [recentMessages, setRecentMessages] = useState([])
  const [commentForm, setCommentForm] = useState({
    name: '',
    location: '',
    message: '',
  })
  const [requestForm, setRequestForm] = useState({
    name: '',
    email: '',
    song: '',
    artist: '',
    dedication: '',
  })
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    topic: 'Prayer request',
    message: '',
  })
  const [commentStatus, setCommentStatus] = useState('')
  const [commentView, setCommentView] = useState('top')
  const [chatMenuOpen, setChatMenuOpen] = useState(false)
  const [requestStatus, setRequestStatus] = useState('')
  const [contactStatus, setContactStatus] = useState('')
  const [playerStatus, setPlayerStatus] = useState('Ready to stream live.')
  const [isPlaying, setIsPlaying] = useState(false)
  const [waveLevels, setWaveLevels] = useState(() => Array.from({ length: 12 }, () => 0.24))
  const [isWaveReactive, setIsWaveReactive] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(monthStartFromEntries(archiveEntries))
  const [selectedArchiveDate, setSelectedArchiveDate] = useState(archiveEntries[0].date)
  const [featuredArchiveId, setFeaturedArchiveId] = useState(archiveEntries[0].id)
  const audioRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const sourceNodeRef = useRef(null)
  const dataBufferRef = useRef(null)
  const waveformFrameRef = useRef(0)
  const commentListRef = useRef(null)
  const shouldAutoScrollCommentsRef = useRef(true)

  const activePage = pages.find((page) => page.key === route) ?? pages[0]
  const activeViewMode = viewModes[route]

  const archiveMonths = useMemo(
    () => [...new Set(archiveEntries.map((entry) => entry.date.slice(0, 7)))].sort().reverse(),
    [],
  )

  const calendarDays = useMemo(() => buildCalendar(selectedMonth), [selectedMonth])

  const archiveDates = useMemo(() => {
    const map = new Map()
    archiveEntries.forEach((entry) => {
      if (!map.has(entry.date)) {
        map.set(entry.date, [])
      }
      map.get(entry.date).push(entry)
    })
    return map
  }, [])

  const selectedArchiveEntries = archiveDates.get(selectedArchiveDate) ?? []
  const featuredArchive =
    archiveEntries.find((entry) => entry.id === featuredArchiveId) ?? archiveEntries[0]
  const liveComments = comments.slice(0, 12)
  const onAirComments = useMemo(() => {
    const nextComments = [...liveComments]

    if (commentView === 'recent') {
      nextComments.sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt))
    } else {
      const scoredComments = nextComments
        .sort((left, right) => {
          const rightScore =
            String(right.message ?? '').length + (String(right.location ?? '').trim() ? 12 : 0)
          const leftScore =
            String(left.message ?? '').length + (String(left.location ?? '').trim() ? 12 : 0)
          return rightScore - leftScore
        })
        .slice(0, 6)

      scoredComments.sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt))
      return scoredComments
    }

    return nextComments.slice(0, 6)
  }, [commentView, liveComments])
  const requestQueue = recentRequests.slice(0, 4)
  const messageQueue = recentMessages.slice(0, 4)
  const nextProgram = schedule[0]

  useEffect(() => {
    function handlePopState() {
      setRoute(routeFromPath(window.location.pathname))
      setLocationHash(window.location.hash)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (!locationHash) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    const targetId = locationHash.replace(/^#/, '')

    window.requestAnimationFrame(() => {
      const targetElement = document.getElementById(targetId)
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    })
  }, [locationHash, route])

  useEffect(() => {
    const audio = audioRef.current

    if (!audio) return undefined

    function handlePlay() {
      setIsPlaying(true)
      setPlayerStatus('Live audio is playing.')
    }

    function handlePause() {
      setIsPlaying(false)
      setPlayerStatus('Live audio is paused.')
    }

    function handleWaiting() {
      setPlayerStatus('Reconnecting to the live audio stream...')
    }

    function handleCanPlay() {
      setPlayerStatus(audio.paused ? 'Ready to stream live.' : 'Live audio is playing.')
    }

    function handleError() {
      setPlayerStatus('The live audio stream is unavailable right now.')
      setIsPlaying(false)
    }

    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('waiting', handleWaiting)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('error', handleError)

    return () => {
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('waiting', handleWaiting)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('error', handleError)
    }
  }, [])

  useEffect(() => {
    function stopWaveformLoop() {
      if (waveformFrameRef.current) {
        window.cancelAnimationFrame(waveformFrameRef.current)
        waveformFrameRef.current = 0
      }
    }

    function startWaveformLoop() {
      const analyser = analyserRef.current
      const buffer = dataBufferRef.current

      if (!analyser || !buffer) return

      stopWaveformLoop()

      const draw = () => {
        analyser.getByteFrequencyData(buffer)

        setWaveLevels((current) => {
          const next = current.map((level, index, array) => {
            const bucketSize = Math.floor(buffer.length / array.length)
            const start = index * bucketSize
            const end = index === array.length - 1 ? buffer.length : start + bucketSize

            let totalLevel = 0
            let peakLevel = 0

            for (let cursor = start; cursor < end; cursor += 1) {
              totalLevel += buffer[cursor]
              peakLevel = Math.max(peakLevel, buffer[cursor])
            }

            const averageLevel = totalLevel / Math.max(1, end - start)
            const averageNormalized = averageLevel / 255
            const peakNormalized = peakLevel / 255
            const shapedLevel = Math.pow(averageNormalized, 0.62) * 2.6 + Math.pow(peakNormalized, 0.9) * 0.95
            const normalizedLevel = Math.max(0.18, Math.min(3.2, shapedLevel))
            return level * 0.62 + normalizedLevel * 0.38
          })

          return next
        })

        waveformFrameRef.current = window.requestAnimationFrame(draw)
      }

      draw()
    }

    if (isPlaying && analyserRef.current && dataBufferRef.current) {
      startWaveformLoop()
      setIsWaveReactive(true)
    } else {
      stopWaveformLoop()
      setWaveLevels(Array.from({ length: 12 }, () => 0.24))
    }

    return () => {
      stopWaveformLoop()
    }
  }, [isPlaying])

  useEffect(() => {
    const sessionId = getSessionId()
    const isLiveRoomActive = route === 'listen' || isPlaying

    async function refreshStation() {
      try {
        const response = await fetch('/api/station')
        const data = await response.json()
        setListenerCount(data.listenerCount ?? 0)
        setComments(data.comments ?? [])
        setRecentRequests(data.latestRequests ?? [])
        setRecentMessages(data.latestMessages ?? [])
      } catch {
        setCommentStatus('Unable to refresh the live room right now.')
      }
    }

    async function heartbeat() {
      try {
        const response = await fetch('/api/listeners/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        })
        const data = await response.json()
        setListenerCount(data.listenerCount ?? 0)
      } catch {
        setCommentStatus('Listener count will reconnect automatically.')
      }
    }

    refreshStation()
    heartbeat()

    const refreshInterval = window.setInterval(refreshStation, isLiveRoomActive ? 5000 : 15000)
    const heartbeatInterval = window.setInterval(heartbeat, 45000)

    return () => {
      window.clearInterval(refreshInterval)
      window.clearInterval(heartbeatInterval)
    }
  }, [isPlaying, route])

  useEffect(() => {
    const listElement = commentListRef.current

    if (!listElement || !shouldAutoScrollCommentsRef.current) return

    listElement.scrollTop = listElement.scrollHeight
  }, [commentView, onAirComments])

  function navigate(path) {
    const normalized = normalizePath(path)
    const hashTarget = getHashTarget(path)
    const currentPath = normalizePath(window.location.pathname)
    const currentHash = window.location.hash

    if (currentPath === normalized && currentHash === hashTarget) return

    window.history.pushState({}, '', `${normalized}${hashTarget}`)
    startTransition(() => {
      setRoute(routeFromPath(normalized))
    })
    setLocationHash(hashTarget)
  }

  function updateViewMode(mode) {
    setViewModes((current) => ({ ...current, [route]: mode }))
  }

  function handleCommentListScroll() {
    const listElement = commentListRef.current
    if (!listElement) return

    const distanceFromBottom =
      listElement.scrollHeight - listElement.scrollTop - listElement.clientHeight

    shouldAutoScrollCommentsRef.current = distanceFromBottom < 24
  }

  function jumpToLatestComments() {
    const listElement = commentListRef.current
    if (!listElement) return

    shouldAutoScrollCommentsRef.current = true
    listElement.scrollTop = listElement.scrollHeight
    setChatMenuOpen(false)
  }

  function toggleCommentAutoScroll(enabled) {
    shouldAutoScrollCommentsRef.current = enabled
    setChatMenuOpen(false)
  }

  async function playStation() {
    const audio = audioRef.current
    if (!audio) return

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext

      if (AudioContextClass) {
        audio.crossOrigin = 'anonymous'

        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContextClass()
        }

        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume()
        }

        if (!sourceNodeRef.current) {
          sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audio)
          analyserRef.current = audioContextRef.current.createAnalyser()
          analyserRef.current.fftSize = 1024
          analyserRef.current.smoothingTimeConstant = 0.72
          sourceNodeRef.current.connect(analyserRef.current)
          analyserRef.current.connect(audioContextRef.current.destination)
          dataBufferRef.current = new Uint8Array(analyserRef.current.frequencyBinCount)
        }

        setIsWaveReactive(true)
      } else {
        setIsWaveReactive(false)
      }

      setPlayerStatus('Connecting to the live audio stream...')
      await audio.play()
    } catch {
      setIsWaveReactive(false)
      setPlayerStatus('Playback was blocked. Press play again to start the stream.')
    }
  }

  function pauseStation() {
    const audio = audioRef.current
    if (!audio) return
    audio.pause()
  }

  function selectArchiveDate(date) {
    setSelectedArchiveDate(date)
    const firstEntry = archiveDates.get(date)?.[0]
    if (firstEntry) {
      setFeaturedArchiveId(firstEntry.id)
    }
  }

  async function handleCommentSubmit(event) {
    event.preventDefault()
    setCommentStatus('Sending your comment...')

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commentForm),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Unable to post your comment.')
      }

      setComments((current) => [data.comment, ...current].slice(0, 12))
      setListenerCount(data.listenerCount ?? listenerCount)
      setCommentForm({ name: '', location: '', message: '' })
      setCommentStatus('Your comment is now live on the wall.')
    } catch (error) {
      setCommentStatus(error.message)
    }
  }

  async function handleRequestSubmit(event) {
    event.preventDefault()
    setRequestStatus('Sending your music request...')

    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestForm),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Unable to submit your request.')
      }

      if (data.request) {
        setRecentRequests((current) => [data.request, ...current].slice(0, 5))
      }

      setRequestForm({
        name: '',
        email: '',
        song: '',
        artist: '',
        dedication: '',
      })
      setRequestStatus(data.message)
    } catch (error) {
      setRequestStatus(error.message)
    }
  }

  async function handleContactSubmit(event) {
    event.preventDefault()
    setContactStatus('Sending your message...')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Unable to send your message.')
      }

      if (data.messageEntry) {
        setRecentMessages((current) => [data.messageEntry, ...current].slice(0, 5))
      }

      setContactForm({
        name: '',
        email: '',
        phone: '',
        topic: 'Prayer request',
        message: '',
      })
      setContactStatus(data.message)
    } catch (error) {
      setContactStatus(error.message)
    }
  }

  function renderHomePage() {
    return (
      <>
        <PageIntro page={activePage} viewMode={activeViewMode} onViewModeChange={updateViewMode} />

        <section className="section-block">
          <div className="hero-broadcast panel">
            <div className="hero-broadcast__copy">
              <span className="live-badge">Broadcasting live for Genesis Worship Ministry</span>
              <h2>{stationIdentity.quote}</h2>
              <p>
                {stationIdentity.stationName} is designed as a broadcast home for listeners coming
                for live prayer, preaching, gospel music, and biblical encouragement. The live
                stream stays on while people move through schedule, archive, requests, and contact.
              </p>

              <div className="button-row">
                <button className="button button-primary" type="button" onClick={() => navigate('/listen-live')}>
                  Enter Listen Live
                </button>
                <button className="button button-secondary" type="button" onClick={() => navigate('/about-us')}>
                  Learn the ministry story
                </button>
              </div>

              <div className="hero-broadcast__signals">
                {homeSignalCards.map((item) => (
                  <article key={item.label} className="signal-card">
                    <span className="stat-kicker">{item.label}</span>
                    <strong>{item.value}</strong>
                    <p>{item.detail}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="hero-broadcast__stack">
              <article className="hero-logo-panel">
                <img src="/brand/gwm-radio-logo.png" alt="GWM Radio Station logo" />
                <div>
                  <span className="stat-kicker">Station ID</span>
                  <h3>{stationIdentity.stationName}</h3>
                  <p>{stationIdentity.tagline}</p>
                </div>
              </article>

              <article className="hero-status-grid">
                <div className="hero-stat">
                  <span className="stat-kicker">Live listeners</span>
                  <strong>{listenerCount}</strong>
                  <p>Active in the station room right now.</p>
                </div>
                <div className="hero-stat">
                  <span className="stat-kicker">Player status</span>
                  <strong>{isPlaying ? 'Streaming live' : 'Standing by'}</strong>
                  <p>{playerStatus}</p>
                </div>
                <div className="hero-stat">
                  <span className="stat-kicker">Official service time</span>
                  <strong>{nextProgram.day}</strong>
                  <p>
                    {nextProgram.title} at {nextProgram.time}
                  </p>
                </div>
                <div className="hero-stat">
                  <span className="stat-kicker">Church line</span>
                  <strong>{stationIdentity.phone}</strong>
                  <p>{stationIdentity.address}</p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="section-block">
          <div className={activeViewMode === 'grid' ? 'three-column-layout' : 'stack-layout'}>
            {homeHighlights.map((item) => (
              <article key={item.title} className="panel info-panel">
                <span className="stat-kicker">Station overview</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section-block">
          <div className={activeViewMode === 'grid' ? 'three-column-layout' : 'stack-layout'}>
            {homeFeaturePanels.map((item) => (
              <article key={item.title} className="panel action-panel">
                <span className="stat-kicker">Quick access</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                <button className="button button-secondary" type="button" onClick={() => navigate(item.path)}>
                  {item.cta}
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="section-block">
          <div className={activeViewMode === 'grid' ? 'two-column-layout' : 'stack-layout'}>
            <article className="panel">
              <div className="panel__header">
                <div>
                  <span className="stat-kicker">Live room snapshot</span>
                  <h3>What listeners are saying</h3>
                </div>
                <button className="link-button" type="button" onClick={() => navigate('/listen-live')}>
                  Open live room
                </button>
              </div>
              <div className="stack-layout compact-layout">
                {liveComments.slice(0, 3).map((comment) => (
                  <article key={comment.id} className="comment-card">
                    <div className="comment-card__top">
                      <strong>{comment.name}</strong>
                      <span>{comment.location || 'Online listener'}</span>
                    </div>
                    <p>{comment.message}</p>
                    <time dateTime={comment.createdAt}>{formatPreviewTime(comment.createdAt)}</time>
                  </article>
                ))}
              </div>
            </article>

            <SourceList title="Official source pages" items={officialSources} />
          </div>
        </section>
      </>
    )
  }

  function renderAboutPage() {
    return (
      <>
        <PageIntro page={activePage} viewMode={activeViewMode} onViewModeChange={updateViewMode} />

        <section className="section-block">
          <div className="two-column-layout about-hero-layout">
            <article className="panel panel--primary about-story">
              <span className="stat-kicker">About GWM Radio Station</span>
              <div className="copy-stack">
                {aboutRadioParagraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </article>

            <article className="panel memorial-panel">
              <span className="stat-kicker">Legacy and remembrance</span>
              <h3>{memorialCard.title}</h3>
              <p>{memorialCard.body}</p>
              <div className="memorial-panel__meta">
                <div className="meta-pill">
                  <span className="stat-kicker">Founding legacy</span>
                  <strong>Apostle Sam and Apostle Teresa Mosley</strong>
                  <p>Honored through the continuing broadcast ministry of GWM Radio.</p>
                </div>
                <div className="meta-pill">
                  <span className="stat-kicker">Memorial date</span>
                  <strong>{stationIdentity.memorialDate}</strong>
                  <p>Shared here in reverence and continuity of ministry purpose.</p>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="section-block">
          <div className={activeViewMode === 'grid' ? 'three-column-layout' : 'stack-layout'}>
            {aboutContextCards.map((item) => (
              <article key={item.title} className="panel info-panel">
                <span className="stat-kicker">Station purpose</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section-block">
          <div className={activeViewMode === 'grid' ? 'two-column-layout' : 'stack-layout'}>
            <article className="panel">
              <span className="stat-kicker">Ministry story from the church site</span>
              <div className="stack-layout compact-layout">
                {ministryTimeline.map((item) => (
                  <article key={item.title} className="timeline-card">
                    <h4>{item.title}</h4>
                    <p>{item.detail}</p>
                  </article>
                ))}
              </div>
            </article>

            <article className="panel">
              <span className="stat-kicker">Leadership context</span>
              <div className="stack-layout compact-layout">
                {leadershipCards.map((item) => (
                  <article key={item.name} className="person-card">
                    <h4>{item.name}</h4>
                    <span>{item.role}</span>
                    <p>{item.detail}</p>
                  </article>
                ))}
              </div>
            </article>
          </div>
        </section>
      </>
    )
  }

  function renderListenPage() {
    const playLabel = isPlaying ? 'Pause Live Audio' : 'Play Live Audio'

    return (
      <>
        <PageIntro page={activePage} viewMode={activeViewMode} onViewModeChange={updateViewMode} />

        <section className="section-block">
          <div className={activeViewMode === 'grid' ? 'listen-layout' : 'stack-layout'}>
            <div className="listen-main-stack">
              <article className="panel live-stage live-stage--expanded">
                <div className="live-stage__header">
                  <div>
                    <div className="live-stage__signals">
                      <span className="live-badge">Now playing</span>
                      <span className="recording-pill">
                        <span className="recording-pill__dot" />
                        REC LIVE
                      </span>
                    </div>
                    <h2>GWM Radio live stream</h2>
                    <p>
                      Press play once and the station keeps going while you visit Schedule, Archive,
                      Requests, Contact, or About. The stream only stops when the listener chooses to
                      pause it.
                    </p>
                  </div>

                  <button
                    className="logo-player"
                    type="button"
                    onClick={isPlaying ? pauseStation : playStation}
                    aria-label={playLabel}
                  >
                    <img src="/brand/gwm-radio-logo.png" alt="GWM Radio Station logo" />
                    <span className="logo-player__overlay">
                      <span className={`player-glyph player-glyph--${isPlaying ? 'pause' : 'play'}`} />
                    </span>
                  </button>
                </div>

                <div className="live-stage__controls">
                  <button
                    className="button button-primary"
                    type="button"
                    onClick={isPlaying ? pauseStation : playStation}
                  >
                    <span className={`button__icon button__icon--${isPlaying ? 'pause' : 'play'}`} />
                    {playLabel}
                  </button>
                  <button
                    className="button button-secondary"
                    type="button"
                    onClick={() => window.open(stationLinks.listenLive, '_blank', 'noopener,noreferrer')}
                  >
                    Open official Listen Live
                  </button>
                  <button className="button button-secondary" type="button" onClick={() => navigate('/requests#request-form')}>
                    Send a music request
                  </button>
                </div>

                <div className="radio-wave-panel" aria-hidden="true">
                  <div className="radio-wave-panel__copy">
                    <span className="stat-kicker">On-air sound waves</span>
                    <p>
                      {isWaveReactive && isPlaying
                        ? 'Wave meter follows the live station audio in real time.'
                        : 'Wave meter stands by until the live audio is active.'}
                    </p>
                  </div>
                  <div className="radio-wave-meter">
                    {waveLevels.map((level, index) => (
                      <span
                        key={`wave-${index}`}
                        className={isPlaying && !isWaveReactive ? 'is-fallback' : ''}
                        style={{ '--wave-scale': level, '--wave-delay': `${index * 0.08}s` }}
                      />
                    ))}
                  </div>
                </div>

                <div className="live-stage__meta live-stage__meta--four">
                  <article className="meta-pill">
                    <span className="stat-kicker">Status</span>
                    <strong>{isPlaying ? 'On air' : 'Ready'}</strong>
                    <p>{playerStatus}</p>
                  </article>
                  <article className="meta-pill">
                    <span className="stat-kicker">Connected listeners</span>
                    <strong>{listenerCount}</strong>
                    <p>Watching the room and staying near the stream.</p>
                  </article>
                  <article className="meta-pill">
                    <span className="stat-kicker">Next ministry anchor</span>
                    <strong>
                      {nextProgram.day} {nextProgram.time}
                    </strong>
                    <p>{nextProgram.title}</p>
                  </article>
                  <article className="meta-pill">
                    <span className="stat-kicker">Studio line</span>
                    <strong>{stationIdentity.phone}</strong>
                    <p>{stationIdentity.address}</p>
                  </article>
                </div>
              </article>

            </div>

            <aside className="panel live-sidebar">
              <article className="live-comments-preview live-comments-preview--sidebar">
                <div className="live-comments-preview__topbar">
                  <div className="live-comments-preview__titlebar">
                    <h3>Comments</h3>
                    <span>{listenerCount > 0 ? `${listenerCount} live` : `${onAirComments.length} shown`}</span>
                  </div>
                  <div className="chat-actions">
                    <select
                      className="chat-filter"
                      aria-label="Comment order"
                      value={commentView}
                      onChange={(event) => setCommentView(event.target.value)}
                    >
                      <option value="top">Top comments</option>
                      <option value="recent">Recent comments</option>
                    </select>
                    <button
                      className="chat-menu-button"
                      type="button"
                      aria-label="Chat actions"
                      aria-expanded={chatMenuOpen}
                      onClick={() => setChatMenuOpen((open) => !open)}
                    >
                      <span />
                    </button>
                    {chatMenuOpen ? (
                      <div className="chat-menu">
                        <button type="button" onClick={jumpToLatestComments}>
                          Jump to latest
                        </button>
                        <button type="button" onClick={() => toggleCommentAutoScroll(true)}>
                          Resume auto-scroll
                        </button>
                        <button type="button" onClick={() => toggleCommentAutoScroll(false)}>
                          Hold current scroll
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="live-comments-preview__shell">
                  <div className="live-comments-preview__body">
                    <div
                      ref={commentListRef}
                      className="live-comments-preview__list"
                      onScroll={handleCommentListScroll}
                    >
                      {onAirComments.length > 0 ? (
                      onAirComments.map((comment) => (
                        <article key={comment.id} className="comment-card comment-card--chat">
                          <div className="comment-card__chat-head">
                            <span className="comment-avatar">
                              <span className="comment-avatar__text">{getInitials(comment.name)}</span>
                            </span>
                            <div className="comment-card__chat-meta">
                              <div className="comment-card__chat-line">
                                <strong>{comment.name}</strong>
                                <time dateTime={comment.createdAt}>{formatPreviewTime(comment.createdAt)}</time>
                              </div>
                              <span>{comment.location || 'Online listener'}</span>
                            </div>
                            <button className="comment-card__menu" type="button" aria-label="Comment options">
                              <span />
                            </button>
                          </div>
                          <div className="comment-card__bubble">
                            <p>{comment.message}</p>
                          </div>
                          <div className="comment-card__actions">
                            <button type="button">Like</button>
                            <button type="button">Reply</button>
                          </div>
                        </article>
                      ))
                      ) : (
                        <article className="comment-card comment-card--chat">
                          <div className="comment-card__bubble">
                            <p>Comments will appear here as listeners join the live room.</p>
                          </div>
                        </article>
                      )}
                    </div>

                    <form className="station-form station-form--sidebar" onSubmit={handleCommentSubmit}>
                      <div className="comment-composer">
                        <span className="comment-avatar comment-avatar--composer">
                          <span className="comment-avatar__text">
                            {getInitials(commentForm.name || 'Listener')}
                          </span>
                        </span>
                        <div className="comment-composer__fields">
                          <div className="station-form__compact-row">
                            <label>
                              Name
                              <input
                                value={commentForm.name}
                                onChange={(event) =>
                                  setCommentForm((current) => ({ ...current, name: event.target.value }))
                                }
                                placeholder="Your name"
                                required
                              />
                            </label>
                            <label>
                              Location
                              <input
                                value={commentForm.location}
                                onChange={(event) =>
                                  setCommentForm((current) => ({ ...current, location: event.target.value }))
                                }
                                placeholder="Chicago, IL"
                              />
                            </label>
                          </div>
                          <label>
                            Add a comment
                            <textarea
                              rows="2"
                              value={commentForm.message}
                              onChange={(event) =>
                                setCommentForm((current) => ({ ...current, message: event.target.value }))
                              }
                              placeholder="Add a comment..."
                              required
                            />
                          </label>
                        </div>
                      </div>

                      <button className="button button-primary" type="submit">
                        Post comment live
                      </button>
                      {commentStatus ? <p className="form-status">{commentStatus}</p> : null}
                    </form>
                  </div>
                </div>
              </article>

              <div className="stack-layout compact-layout">
                {listenLiveStats.map((item) => (
                  <article key={item.label} className="sidebar-stat">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                    <p>{item.detail}</p>
                  </article>
                ))}
              </div>

              <div className="live-sidebar__cards">
                {liveSidebarCards.map((item) => (
                  <article key={item.title} className="person-card">
                    <h4>{item.title}</h4>
                    <p>{item.body}</p>
                    {item.internal ? (
                      <button className="link-button" type="button" onClick={() => navigate(item.href)}>
                        {item.label}
                      </button>
                    ) : (
                      <a href={item.href} target="_blank" rel="noreferrer">
                        {item.label}
                      </a>
                    )}
                  </article>
                ))}
              </div>

              <article className="next-show-card">
                <span className="stat-kicker">On-air program strip</span>
                <h4>
                  {nextProgram.title} {nextProgram.day} at {nextProgram.time}
                </h4>
                <p>{nextProgram.detail}</p>
                <a href={nextProgram.link} target="_blank" rel="noreferrer">
                  View official source
                </a>
              </article>
            </aside>
          </div>
        </section>

        <section className="section-block">
          <div className={activeViewMode === 'grid' ? 'on-air-strip' : 'stack-layout'}>
            {onAirPrograms.map((item) => (
              <article key={item.title} className="panel strip-card">
                <span className="stat-kicker">{item.slot}</span>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section-block">
          <div className={activeViewMode === 'grid' ? 'two-column-layout' : 'stack-layout'}>
            <article className="panel">
              <div className="panel__header">
                <div>
                  <span className="stat-kicker">Featured broadcasts</span>
                  <h3>Programs that shape the station</h3>
                </div>
              </div>

              <div className={activeViewMode === 'grid' ? 'three-column-layout compact-layout' : 'stack-layout compact-layout'}>
                {featuredBroadcasts.map((item) => (
                  <article key={item.title} className="feature-card">
                    <span>{item.subtitle}</span>
                    <h4>{item.title}</h4>
                    <p>{item.body}</p>
                  </article>
                ))}
              </div>
            </article>
            <SourceList title="Official source pages" items={officialSources} />
          </div>
        </section>
      </>
    )
  }

  function renderSchedulePage() {
    return (
      <>
        <PageIntro page={activePage} viewMode={activeViewMode} onViewModeChange={updateViewMode} />

        <section className="section-block">
          <div className={activeViewMode === 'grid' ? 'two-column-layout' : 'stack-layout'}>
            <article className="panel quote-panel">
              <span className="stat-kicker">Service rhythm</span>
              <h3>{stationIdentity.quote}</h3>
              <p>
                The official ministry site publishes Sunday School, Morning Worship, Wednesday Bible
                study, Thursday prayer, and first-Sunday communion. Those anchors shape the station
                cadence and the broadcast layout throughout the week.
              </p>
            </article>

            <article className="panel location-panel">
              <span className="stat-kicker">Visit and connect</span>
              <h3>{stationIdentity.address}</h3>
              <p>
                Morning Worship is listed at {stationIdentity.phone}. The church site identifies
                Morgan Park as the worship home for Genesis Worship Ministry.
              </p>
            </article>
          </div>
        </section>

        <section className="section-block">
          <div className={activeViewMode === 'grid' ? 'three-column-layout' : 'stack-layout'}>
            {schedule.map((item) => (
              <article key={item.title} className="panel schedule-panel">
                <span className="stat-kicker">
                  {item.day} • {item.time}
                </span>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
                <p className="schedule-channel">
                  {item.tone} • {item.channel}
                </p>
                <a href={item.link} target="_blank" rel="noreferrer">
                  View source page
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="section-block">
          <div className={activeViewMode === 'grid' ? 'two-column-layout' : 'stack-layout'}>
            <article className="panel">
              <span className="stat-kicker">Broadcast windows</span>
              <div className="stack-layout compact-layout">
                {broadcastWindows.map((item) => (
                  <article key={item.title} className="person-card">
                    <h4>{item.title}</h4>
                    <p>{item.body}</p>
                  </article>
                ))}
              </div>
            </article>

            <article className="panel">
              <span className="stat-kicker">Schedule notes</span>
              <ul className="bullet-list">
                {scheduleNotes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>
        </section>
      </>
    )
  }

  function renderArchivePage() {
    return (
      <>
        <PageIntro page={activePage} viewMode={activeViewMode} onViewModeChange={updateViewMode} />

        <section className="section-block">
          <div className={activeViewMode === 'grid' ? 'three-column-layout' : 'stack-layout'}>
            {archiveSupportCards.map((item) => (
              <article key={item.title} className="panel info-panel">
                <span className="stat-kicker">Archive guide</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        {activeViewMode === 'grid' ? (
          <section className="section-block">
            <div className="archive-grid-layout">
              <article className="panel">
                <div className="panel__header">
                  <div>
                    <span className="stat-kicker">Replay calendar</span>
                    <h3>{monthFormatter.format(new Date(`${selectedMonth}-01T12:00:00`))}</h3>
                  </div>
                  <div className="month-switcher">
                    {archiveMonths.map((month) => (
                      <button
                        key={month}
                        type="button"
                        className={month === selectedMonth ? 'is-active' : ''}
                        onClick={() => {
                          setSelectedMonth(month)
                          const firstForMonth = archiveEntries.find((entry) => entry.date.startsWith(month))
                          if (firstForMonth) {
                            selectArchiveDate(firstForMonth.date)
                          }
                        }}
                      >
                        {monthFormatter.format(new Date(`${month}-01T12:00:00`))}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="calendar-weekdays">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((weekday) => (
                    <span key={weekday}>{weekday}</span>
                  ))}
                </div>

                <div className="calendar-grid">
                  {calendarDays.map((day, index) =>
                    day ? (
                      <button
                        key={day}
                        type="button"
                        className={[
                          'calendar-day',
                          archiveDates.has(day) ? 'has-entry' : '',
                          selectedArchiveDate === day ? 'is-selected' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        onClick={() => selectArchiveDate(day)}
                      >
                        <span>{Number(day.slice(-2))}</span>
                        {archiveDates.has(day) ? <small>{archiveDates.get(day).length} replay</small> : null}
                      </button>
                    ) : (
                      <span key={`empty-${index}`} className="calendar-day calendar-day--empty" />
                    ),
                  )}
                </div>
              </article>

              <article className="panel archive-feature-panel">
                <div className="panel__header">
                  <div>
                    <span className="stat-kicker">Featured archive item</span>
                    <h3>{featuredArchive.title}</h3>
                  </div>
                  <span className="archive-status">{featuredArchive.replayStatus}</span>
                </div>

                <div className="archive-feature-panel__body">
                  {featuredArchive.embedUrl ? (
                    <div className="archive-embed">
                      <iframe
                        src={featuredArchive.embedUrl}
                        title={featuredArchive.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="archive-placeholder">
                      <span className="stat-kicker">Replay focus</span>
                      <h4>{featuredArchive.focus}</h4>
                      <p>
                        This archive entry carries detailed recap context and links back to the
                        official ministry source page. The live station can stay on while you review
                        archive notes.
                      </p>
                    </div>
                  )}

                  <div className="archive-detail-grid">
                    <div className="meta-pill">
                      <span className="stat-kicker">Category</span>
                      <strong>{featuredArchive.category}</strong>
                      <p>{featuredArchive.duration}</p>
                    </div>
                    <div className="meta-pill">
                      <span className="stat-kicker">Focus</span>
                      <strong>{featuredArchive.focus}</strong>
                      <p>{featuredArchive.speaker}</p>
                    </div>
                  </div>

                  <p>{featuredArchive.summary}</p>
                  <a href={featuredArchive.sourceLink} target="_blank" rel="noreferrer">
                    Open {featuredArchive.sourceLabel}
                  </a>
                </div>
              </article>

              <article className="panel archive-day-panel">
                <div className="panel__header">
                  <div>
                    <span className="stat-kicker">Selected recordings</span>
                    <h3>{dayFormatter.format(new Date(`${selectedArchiveDate}T12:00:00`))}</h3>
                  </div>
                </div>

                <div className="archive-list">
                  {selectedArchiveEntries.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      className={`archive-card archive-card--button${entry.id === featuredArchive.id ? ' is-selected' : ''}`}
                      onClick={() => setFeaturedArchiveId(entry.id)}
                    >
                      <span className="stat-kicker">{entry.category}</span>
                      <h4>{entry.title}</h4>
                      <p>{entry.summary}</p>
                      <strong>{entry.duration}</strong>
                    </button>
                  ))}
                </div>
              </article>
            </div>
          </section>
        ) : (
          <section className="section-block">
            <div className="stack-layout">
              {archiveEntries.map((entry) => (
                <article key={entry.id} className="panel archive-row">
                  <div className="archive-row__date">
                    <span className="stat-kicker">{entry.category}</span>
                    <strong>{dayFormatter.format(new Date(`${entry.date}T12:00:00`))}</strong>
                  </div>
                  <div className="archive-row__content">
                    <h3>{entry.title}</h3>
                    <p>{entry.summary}</p>
                    <p className="schedule-channel">{entry.focus}</p>
                  </div>
                  <div className="archive-row__actions">
                    <strong className="archive-row__duration">{entry.duration}</strong>
                    <button className="link-button" type="button" onClick={() => setFeaturedArchiveId(entry.id)}>
                      Feature replay
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </>
    )
  }

  function renderRequestsPage() {
    return (
      <>
        <PageIntro page={activePage} viewMode={activeViewMode} onViewModeChange={updateViewMode} />

        <section className="section-block">
          <div className={activeViewMode === 'grid' ? 'two-column-layout' : 'stack-layout'}>
            <article id="request-form" className="panel">
              <span className="stat-kicker">Request a song</span>
              <h3>Music request form</h3>
              <form className="station-form" onSubmit={handleRequestSubmit}>
                <label>
                  Name
                  <input
                    value={requestForm.name}
                    onChange={(event) =>
                      setRequestForm((current) => ({ ...current, name: event.target.value }))
                    }
                    required
                  />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    value={requestForm.email}
                    onChange={(event) =>
                      setRequestForm((current) => ({ ...current, email: event.target.value }))
                    }
                    required
                  />
                </label>
                <label>
                  Song request
                  <input
                    value={requestForm.song}
                    onChange={(event) =>
                      setRequestForm((current) => ({ ...current, song: event.target.value }))
                    }
                    placeholder="Song title"
                    required
                  />
                </label>
                <label>
                  Artist
                  <input
                    value={requestForm.artist}
                    onChange={(event) =>
                      setRequestForm((current) => ({ ...current, artist: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Dedication or note
                  <textarea
                    rows="4"
                    value={requestForm.dedication}
                    onChange={(event) =>
                      setRequestForm((current) => ({ ...current, dedication: event.target.value }))
                    }
                  />
                </label>
                <button className="button button-primary" type="submit">
                  Send request
                </button>
                {requestStatus ? <p className="form-status">{requestStatus}</p> : null}
              </form>
            </article>

            <article className="panel">
              <span className="stat-kicker">Request guidance</span>
              <div className="stack-layout compact-layout">
                {requestChannels.map((item) => (
                  <article key={item.title} className="person-card">
                    <h4>{item.title}</h4>
                    <p>{item.body}</p>
                  </article>
                ))}
              </div>
              <div className="stack-layout compact-layout">
                {requestGuidelines.map((item) => (
                  <article key={item.title} className="person-card">
                    <h4>{item.title}</h4>
                    <p>{item.body}</p>
                  </article>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section className="section-block">
          <div className={activeViewMode === 'grid' ? 'two-column-layout' : 'stack-layout'}>
            <article className="panel">
              <span className="stat-kicker">Request spotlights</span>
              <div className="stack-layout compact-layout">
                {requestSpotlights.map((item) => (
                  <article key={item.title} className="person-card">
                    <h4>{item.title}</h4>
                    <p>{item.body}</p>
                  </article>
                ))}
              </div>
            </article>

            <article className="panel">
              <div className="panel__header">
                <div>
                  <span className="stat-kicker">Recent request queue</span>
                  <h3>Latest listener submissions</h3>
                </div>
              </div>
              <div className="stack-layout compact-layout">
                {requestQueue.map((item) => (
                  <article key={item.id} className="comment-card">
                    <div className="comment-card__top">
                      <strong>{item.song}</strong>
                      <span>{item.artist || 'Artist not listed'}</span>
                    </div>
                    <p>
                      Requested by {item.name}
                      {item.dedication ? ` — ${item.dedication}` : '.'}
                    </p>
                    <time dateTime={item.createdAt}>{formatPreviewTime(item.createdAt)}</time>
                  </article>
                ))}
              </div>
            </article>
          </div>
        </section>
      </>
    )
  }

  function renderContactPage() {
    return (
      <>
        <PageIntro page={activePage} viewMode={activeViewMode} onViewModeChange={updateViewMode} />

        <section className="section-block">
          <div className={activeViewMode === 'grid' ? 'two-column-layout' : 'stack-layout'}>
            <article className="panel">
              <span className="stat-kicker">Prayer and contact</span>
              <h3>Send a message to the ministry</h3>
              <form className="station-form" onSubmit={handleContactSubmit}>
                <label>
                  Name
                  <input
                    value={contactForm.name}
                    onChange={(event) =>
                      setContactForm((current) => ({ ...current, name: event.target.value }))
                    }
                    required
                  />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={(event) =>
                      setContactForm((current) => ({ ...current, email: event.target.value }))
                    }
                    required
                  />
                </label>
                <label>
                  Phone
                  <input
                    value={contactForm.phone}
                    onChange={(event) =>
                      setContactForm((current) => ({ ...current, phone: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Topic
                  <select
                    value={contactForm.topic}
                    onChange={(event) =>
                      setContactForm((current) => ({ ...current, topic: event.target.value }))
                    }
                  >
                    <option>Prayer request</option>
                    <option>General contact</option>
                    <option>Testimony</option>
                    <option>Volunteer interest</option>
                    <option>Memorial note</option>
                  </select>
                </label>
                <label>
                  Message
                  <textarea
                    rows="5"
                    value={contactForm.message}
                    onChange={(event) =>
                      setContactForm((current) => ({ ...current, message: event.target.value }))
                    }
                    required
                  />
                </label>
                <button className="button button-primary" type="submit">
                  Send message
                </button>
                {contactStatus ? <p className="form-status">{contactStatus}</p> : null}
              </form>
            </article>

            <article className="panel">
              <span className="stat-kicker">Contact details</span>
              <div className="stack-layout compact-layout">
                {contactCards.map((card) => (
                  <article key={card.label} className="person-card">
                    <h4>{card.label}</h4>
                    <p>{card.value}</p>
                  </article>
                ))}
              </div>
              <div className="link-stack compact-layout">
                {contactLinks.map((link) => (
                  <a key={link.label} href={link.href} target="_blank" rel="noreferrer">
                    {link.label}
                  </a>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section className="section-block">
          <div className={activeViewMode === 'grid' ? 'two-column-layout' : 'stack-layout'}>
            <article className="panel">
              <span className="stat-kicker">Ministry care</span>
              <div className="stack-layout compact-layout">
                {carePanels.map((item) => (
                  <article key={item.title} className="person-card">
                    <h4>{item.title}</h4>
                    <p>{item.body}</p>
                  </article>
                ))}
              </div>
            </article>

            <article className="panel">
              <div className="panel__header">
                <div>
                  <span className="stat-kicker">Recent ministry inbox</span>
                  <h3>Latest contact activity</h3>
                </div>
              </div>
              <div className="stack-layout compact-layout">
                {messageQueue.map((item) => (
                  <article key={item.id} className="comment-card">
                    <div className="comment-card__top">
                      <strong>{item.name}</strong>
                      <span>{item.topic}</span>
                    </div>
                    <p>{item.message}</p>
                    <time dateTime={item.createdAt}>{formatPreviewTime(item.createdAt)}</time>
                  </article>
                ))}
              </div>
            </article>
          </div>
        </section>
      </>
    )
  }

  function renderDonationPage() {
    return (
      <>
        <PageIntro page={activePage} viewMode={activeViewMode} onViewModeChange={updateViewMode} />

        <section className="section-block">
          <div className="two-column-layout">
            <article className="panel quote-panel">
              <span className="stat-kicker">Support GWM Radio</span>
              <h3>Give to strengthen the ministry and live radio outreach.</h3>
              <p>
                This donation page gives listeners and supporters a simple way to move from the
                station into giving. The current giving action uses the PayPal Donate path you
                provided.
              </p>
              <div className="button-row">
                <button
                  className="button button-primary"
                  type="button"
                  onClick={() => window.open(stationLinks.paypalDonate, '_blank', 'noopener,noreferrer')}
                >
                  Open PayPal Donate
                </button>
                <button className="button button-secondary" type="button" onClick={() => navigate('/contact')}>
                  Contact the ministry
                </button>
              </div>
            </article>

            <article className="panel">
              <span className="stat-kicker">Giving details</span>
              <div className="stack-layout compact-layout">
                {donationWays.map((item) => (
                  <article key={item.title} className="person-card">
                    <h4>{item.title}</h4>
                    <p>{item.body}</p>
                    {'href' in item ? (
                      <a href={item.href} target="_blank" rel="noreferrer">
                        {item.label}
                      </a>
                    ) : null}
                  </article>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section className="section-block">
          <article className="panel">
            <span className="stat-kicker">Donation notes</span>
            <ul className="bullet-list">
              {donationNotes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </section>
      </>
    )
  }

  function renderPageContent() {
    switch (route) {
      case 'about':
        return renderAboutPage()
      case 'listen':
        return renderListenPage()
      case 'schedule':
        return renderSchedulePage()
      case 'archive':
        return renderArchivePage()
      case 'requests':
        return renderRequestsPage()
      case 'contact':
        return renderContactPage()
      case 'donation':
        return renderDonationPage()
      case 'home':
      default:
        return renderHomePage()
    }
  }

  return (
    <div className="page-shell">
      <audio ref={audioRef} className="persistent-audio" preload="none" src={liveAudioUrl}>
        Your browser does not support the audio player.
      </audio>

      <div className="broadcast-topbar">
        <div className="broadcast-topbar__inner">
          <span className="broadcast-dot" />
          <strong>{stationIdentity.ministryName}</strong>
          <p>
            Live gospel music, preaching, Bible teaching, prayer, and open listener participation.
          </p>
        </div>
      </div>

      <header className="site-header">
        <button className="brand" type="button" onClick={() => navigate('/')}>
          <img src="/brand/gwm-radio-logo.png" alt="GWM Radio Station logo" />
          <div>
            <span>{stationIdentity.stationName}</span>
            <strong>{stationIdentity.ministryName}</strong>
          </div>
        </button>

        <nav className="site-nav" aria-label="Primary">
          {pages.map((page) => (
            <button
              key={page.key}
              type="button"
              className={route === page.key ? 'is-active' : ''}
              onClick={() => navigate(page.path)}
            >
              {page.label}
            </button>
          ))}
        </nav>
      </header>

      <section className="global-player section-block">
        <div className="global-player__bar panel">
          <div>
            <span className="stat-kicker">Persistent player</span>
            <h2>Live audio stays on while you browse.</h2>
            <p>{playerStatus}</p>
          </div>
          <div className="global-player__actions">
            <button className="button button-primary" type="button" onClick={isPlaying ? pauseStation : playStation}>
              {isPlaying ? 'Pause live audio' : 'Play live audio'}
            </button>
            <button className="button button-secondary" type="button" onClick={() => navigate('/listen-live')}>
              Open Listen Live
            </button>
          </div>
        </div>
      </section>

      <main>{renderPageContent()}</main>

      <footer className="site-footer section-block">
        <div className="site-footer__inner panel">
          <div>
            <span className="stat-kicker">Genesis Worship Ministry</span>
            <h3>{stationIdentity.stationName}</h3>
            <p>{stationIdentity.address}</p>
          </div>
          <div className="site-footer__meta">
            <a href={stationLinks.listenLive} target="_blank" rel="noreferrer">
              Official Listen Live
            </a>
            <a href={stationLinks.ministryAbout} target="_blank" rel="noreferrer">
              Ministry About
            </a>
            <a href={stationLinks.services} target="_blank" rel="noreferrer">
              Services
            </a>
            <span>{timeFormatter.format(new Date())} local station time</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
