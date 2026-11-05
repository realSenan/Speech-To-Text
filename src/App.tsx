import React, { createContext, useState } from 'react'
import { HiOutlineSignal, HiOutlineSparkles } from 'react-icons/hi2'
import TextArea from './components/TextArea'
import VoiceArea from './components/VoiceArea'

export type SpeechStatus =
    | 'idle'
    | 'starting'
    | 'listening'
    | 'switching'
    | 'processing'
    | 'complete'

export const TranscriptContext = createContext<{
    transcript: string
    setTranscript: React.Dispatch<React.SetStateAction<string>>
    replaceNextWord: boolean
    setReplaceNextWord: React.Dispatch<React.SetStateAction<boolean>>
}>({
    transcript: '',
    setTranscript: () => {},
    replaceNextWord: false,
    setReplaceNextWord: () => {},
})

export const LangContext = createContext<{
    lang: string
    setLang: React.Dispatch<React.SetStateAction<string>>
}>({
    lang: 'az-AZ',
    setLang: () => {},
})

function App() {
    const [transcript, setTranscript] = useState('')
    const [replaceNextWord, setReplaceNextWord] = useState(false)
    const [lang, setLang] = useState('az-AZ')
    const [speechStatus, setSpeechStatus] = useState<SpeechStatus>('idle')
    const [interimTranscript, setInterimTranscript] = useState('')

    return (
        <TranscriptContext.Provider
            value={{
                transcript,
                setTranscript,
                replaceNextWord,
                setReplaceNextWord,
            }}
        >
            <LangContext.Provider value={{ lang, setLang }}>
                <div className="app-shell">
                    <div className="ambient ambient-one" aria-hidden="true" />
                    <div className="ambient ambient-two" aria-hidden="true" />
                    <div className="app-container">
                        <header className="topbar">
                            <div className="brand" aria-label="Sayform">
                                <span className="brand-mark">
                                    <HiOutlineSignal aria-hidden="true" />
                                </span>
                                <span className="brand-name">
                                    sayform<span className="brand-period">.</span>
                                </span>
                            </div>
                            <div className="topbar-right">
                                <span className="topbar-caption">
                                    YOUR VOICE, IN WRITING
                                </span>
                                <span className="topbar-status">
                                    <span className="status-dot" />
                                    READY WHEN YOU ARE
                                </span>
                            </div>
                        </header>

                        <main className="main-grid">
                            <section className="intro" aria-labelledby="page-title">
                                <div className="eyebrow">
                                    <HiOutlineSparkles aria-hidden="true" />
                                    <span>THE LITTLE STUDIO FOR BIG IDEAS</span>
                                </div>
                                <h1 id="page-title">
                                    Good ideas
                                    <br />
                                    <span>sound better</span>
                                    <br />
                                    written down.
                                </h1>
                                <p className="intro-copy">
                                    Find your flow. Say it out loud and watch your
                                    words find their way onto the page.
                                </p>
                                <div className="intro-footnote">
                                    <span className="footnote-line" />
                                    <span>JUST YOU, YOUR VOICE &amp; A BLANK PAGE</span>
                                </div>
                            </section>

                            <section
                                className="workspace"
                                aria-label="Transcription workspace"
                            >
                                <VoiceArea
                                    status={speechStatus}
                                    onStatusChange={setSpeechStatus}
                                    onInterimChange={setInterimTranscript}
                                />
                                <TextArea
                                    status={speechStatus}
                                    interimTranscript={interimTranscript}
                                />
                            </section>
                        </main>

                        <footer className="page-footer">
                            <span>MADE FOR THE WAY YOU THINK.</span>
                            <span className="footer-note">
                                Take a breath. Start anywhere.
                            </span>
                        </footer>
                    </div>
                </div>
            </LangContext.Provider>
        </TranscriptContext.Provider>
    )
}

export default App
