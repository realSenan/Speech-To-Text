import { useEffect, useState, useRef } from 'react'
import { MdMic, MdMicOff } from 'react-icons/md'

const VoiceArea: React.FC = () => {
    const [isRecording, setIsRecording] = useState(false)
    const [transcript, setTranscript] = useState('')
    const micEl = useRef<HTMLButtonElement | null>(null)
    const recognitionRef = useRef<SpeechRecognition | null>(null)

    useEffect(() => {
        recognitionRef.current = new (window as any).webkitSpeechRecognition()
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true
        recognitionRef.current.onresult = (event: any) => {
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    setTranscript(
                        (prevTranscript) =>
                            prevTranscript + event.results[i][0].transcript
                    )
                }
            }
        }
    }, [])

    const micHandler = () => {
        if (!isRecording) {
            recognitionRef.current?.start()
        } else {
            recognitionRef.current?.stop()
        }
        setIsRecording((prev) => !prev)
    }

    useEffect(() => {
        return () => {
            recognitionRef.current?.stop()
        }
    }, [])

    return (
        <section className="flex h-1/2 items-center justify-center text-3xl">
            <button
                ref={micEl}
                onClick={micHandler}
                className="grid max-h-44 min-h-36 min-w-36 max-w-44 place-content-center rounded-full bg-white text-7xl text-red-600 shadow-2xl transition-none duration-100 hover:bg-slate-200 active:bg-slate-400"
            >
                {isRecording ? (
                    <MdMic className="icon transition-none duration-0" />
                ) : (
                    <MdMicOff className="icon transition-none duration-0" />
                )}
            </button>
            <p>{transcript}</p>
        </section>
    )
}

export default VoiceArea
