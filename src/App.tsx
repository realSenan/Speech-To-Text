import React, { createContext, useState } from 'react'
import TextArea from './components/TextArea'
import VoiceArea from './components/VoiceArea'

export const TranscriptContext = createContext<{
    transcript: string
    setTranscript: React.Dispatch<React.SetStateAction<string>>
}>({
    transcript: '',
    setTranscript: () => {},
})

export const LangContext = createContext<{
    lang: string
    setLang: React.Dispatch<React.SetStateAction<string>>
}>({
    lang: '',
    setLang: () => {},
})

function App() {
    const [transcript, setTranscript] = useState('')
    const [lang, setLang] = useState('az-AZ')

    return (
        <TranscriptContext.Provider value={{ transcript, setTranscript }}>
            <LangContext.Provider value={{ lang, setLang }}>
                <div className="h-screen w-screen">
                    <VoiceArea />
                    <TextArea />
                </div>
            </LangContext.Provider>
        </TranscriptContext.Provider>
    )
}

export default App
