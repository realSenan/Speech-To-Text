import { useEffect, useMemo, useRef, useState, useContext } from 'react'
import { MdMic, MdMicOff } from 'react-icons/md'
import { LangContext, TranscriptContext } from '../App'

const VoiceArea: React.FC = () => {
    const [isRecording, setIsRecording] = useState<boolean>(false)
    const audioContext = useMemo(() => new window.AudioContext(), [isRecording])
    const analyser = audioContext.createAnalyser()
    const micEl = useRef<HTMLButtonElement | null>(null)
    const recognitionRef = useRef<null | SpeechRecognition>(null)
    const { setTranscript } = useContext(TranscriptContext)

    const { lang } = useContext(LangContext)

    useEffect(() => {
        let stream: MediaStream | null = null

        if (isRecording) {
            navigator.mediaDevices
                .getUserMedia({ audio: true })
                .then((userStream) => {
                    stream = userStream
                    const source =
                        audioContext.createMediaStreamSource(userStream)
                    source.connect(analyser)
                    analyser.fftSize = 32
                    const bufferLength = analyser.frequencyBinCount
                    const dataArray = new Uint8Array(bufferLength)

                    recognitionRef.current =
                        new window.webkitSpeechRecognition()
                    recognitionRef.current.continuous = true
                    recognitionRef.current.lang = lang
                    recognitionRef.current.interimResults = true
                    recognitionRef.current.onresult = (
                        event: SpeechRecognitionEvent
                    ) => {
                        for (
                            let i = event.resultIndex;
                            i < event.results.length;
                            ++i
                        ) {
                            if (event.results[i].isFinal) {
                                setTranscript(
                                    (prevTranscript) =>
                                        prevTranscript +
                                        ' ' +
                                        event.results[i][0].transcript
                                )
                            }
                        }
                    }
                    recognitionRef.current.start()

                    const updateMicrophone = () => {
                        requestAnimationFrame(updateMicrophone)
                        analyser.getByteFrequencyData(dataArray)
                        const average =
                            dataArray.reduce((a, b) => a + b, 0) / bufferLength
                        const size = average / 2 + 50
                        if (micEl.current) {
                            micEl.current.style.width = size + 67 + 'px'
                            micEl.current.style.height = size + 67 + 'px'
                            micEl.current.style.fontSize = size / 18 + 'rem'
                        }
                    }
                    updateMicrophone()
                })
                .catch((err) => {
                    console.error(`Mic request declined ${err}`)
                })
        } else {
            recognitionRef.current?.stop()
        }

        // Cleanup function
        return () => {
            if (stream) {
                stream.getTracks().forEach((track) => track.stop())
            }
            recognitionRef.current?.stop()
        }
    }, [analyser, audioContext, isRecording, setTranscript])

    const openMic = () => {
        setIsRecording(true)
    }

    const closeMic = () => {
        setIsRecording(false)
    }

    return (
        <section className="flex h-1/2 items-center justify-center text-3xl">
            <button
                ref={micEl}
                onClick={isRecording ? closeMic : openMic}
                className="grid max-h-44 min-h-36 min-w-36 max-w-44 place-content-center rounded-full bg-neutral-800/50 text-7xl text-red-600 shadow-2xl transition-none duration-100 hover:bg-neutral-700/35 active:bg-neutral-800/30 border border-zinc-400/35"
            >
                {isRecording ? (
                    <MdMic className="icon transition-none duration-0" />
                ) : (
                    <MdMicOff className="icon transition-none duration-0" />
                )}
            </button>
        </section>
    )
}

export default VoiceArea
