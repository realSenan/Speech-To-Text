import { createContext, useState } from 'react'
import TextArea from './components/TextArea'
import VoiceArea from './components/VoiceArea'

export const TranscriptContext = createContext<{
    transcript: string
    setTranscript: React.Dispatch<React.SetStateAction<string>>
}>({
    transcript: '',
    setTranscript: () => {},
})

function App() {
    const [transcript, setTranscript] = useState('')

    return (
        <TranscriptContext.Provider value={{ transcript, setTranscript }}>
            <div className="h-screen w-screen">
                <VoiceArea />
                <TextArea />
            </div>
        </TranscriptContext.Provider>
    )
}

export default App
