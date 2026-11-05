import { useContext, useEffect, useRef, useState } from 'react'
import { HiOutlineMicrophone, HiOutlineStop } from 'react-icons/hi2'
import { LangContext, SpeechStatus, TranscriptContext } from '../App'

const waveformHeights = [
    18, 30, 22, 42, 27, 55, 34, 65, 40, 76, 48, 62, 33, 72, 44, 58, 28, 68,
    40, 78, 35, 60, 25, 50, 32, 70, 38, 58, 24, 44, 30,
]

const speechLanguageMarkers: Record<string, Set<string>> = {
    az: new Set([
        'mən', 'sən', 'çox', 'üçün', 'deyil', 'bəli', 'yox', 'necə',
        'hansı', 'niyə', 'amma', 'çünki', 'burada', 'indi', 'sabah',
        'danışıram', 'azərbaycanca',
    ]),
    tr: new Set([
        'ben', 'sen', 'çok', 'için', 'değil', 'evet', 'hayır', 'nasıl',
        'hangi', 'neden', 'ama', 'çünkü', 'şimdi', 'yarın', 'konuşuyorum',
        'türkçe', 'lütfen', 'teşekkür',
    ]),
    en: new Set([
        'the', 'and', 'you', 'are', 'this', 'that', 'with', 'for', 'please',
        'speak', 'clearly', 'because', 'what', 'how', 'have', 'want', 'hello',
        'thank', 'good', 'morning',
    ]),
    ru: new Set([
        'privet', 'spasibo', 'khorosho', 'zdravstvuyte', 'poka', 'russki',
        'russkiy', 'govoryu', 'govorit', 'eto', 'kak', 'ya', 'net', 'da',
    ]),
}

const getLanguageMismatch = (text: string, selectedLanguage: string) => {
    const selectedCode = selectedLanguage.slice(0, 2).toLowerCase()
    const words = new Set(
        text
            .toLocaleLowerCase()
            .match(/[\p{L}]+/gu) ?? []
    )
    const selectedMarkers = speechLanguageMarkers[selectedCode]
    if (!selectedMarkers || words.size < 2) return false

    const selectedScore = [...words].filter((word) =>
        selectedMarkers.has(word)
    ).length
    const otherLanguage = Object.entries(speechLanguageMarkers).find(
        ([code, markers]) =>
            code !== selectedCode &&
            [...words].filter((word) => markers.has(word)).length >= 2 &&
            selectedScore === 0
    )

    return otherLanguage?.[0] ?? false
}

const getLanguageGuidance = (language: string) => {
    if (language.toLowerCase().startsWith('az')) {
        return 'Zəhmət olmasa, Azərbaycan dilində danışın və sözləri aydın tələffüz edin.'
    }
    if (language.toLowerCase().startsWith('tr')) {
        return 'Lütfen Türkçe konuşun ve kelimeleri net telaffuz edin.'
    }
    return 'Please speak English and pronounce the words clearly.'
}

const hasNonLatinLetters = (text: string) => {
    const letters = text.match(/\p{L}/gu) ?? []
    return letters.some((letter) => !/\p{Script=Latin}/u.test(letter))
}

const replaceLastWord = (transcript: string, replacement: string) => {
    const lastWord = transcript.match(/(\S+)(\s*)$/u)
    if (!lastWord) return replacement
    const punctuation = lastWord[1].match(/[.,!?;:…]+["'”’)]*$/u)?.[0] ?? ''
    const replacementHasPunctuation = /[.,!?;:…]["'”’)]*$/u.test(replacement)

    return (
        transcript.slice(0, transcript.length - lastWord[0].length) +
        replacement +
        (replacementHasPunctuation ? '' : punctuation) +
        lastWord[2]
    )
}

type VoiceAreaProps = {
    status: SpeechStatus
    onStatusChange: (status: SpeechStatus) => void
    onInterimChange: (transcript: string) => void
}

const VoiceArea: React.FC<VoiceAreaProps> = ({
    status,
    onStatusChange,
    onInterimChange,
}) => {
    const [error, setError] = useState('')
    const [warning, setWarning] = useState('')
    const recognitionRef = useRef<SpeechRecognition | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const completionTimerRef = useRef<number | null>(null)
    const hasFinalResultRef = useRef(false)
    const languageRestartRef = useRef(false)
    const { lang } = useContext(LangContext)
    const languageRef = useRef(lang)
    const activeRecognitionLanguageRef = useRef('')
    const {
        setTranscript,
        replaceNextWord,
        setReplaceNextWord,
    } = useContext(TranscriptContext)
    const replaceNextWordRef = useRef(replaceNextWord)
    const isRecording = status === 'listening'
    const isStarting = status === 'starting'
    const isSwitchingLanguage = status === 'switching'
    const isProcessing = status === 'processing'
    const isComplete = status === 'complete'

    useEffect(() => {
        replaceNextWordRef.current = replaceNextWord
    }, [replaceNextWord])

    useEffect(() => {
        languageRef.current = lang
        if (
            !recognitionRef.current ||
            status !== 'listening' ||
            activeRecognitionLanguageRef.current === lang ||
            languageRestartRef.current
        ) {
            return
        }

        languageRestartRef.current = true
        setWarning('')
        onInterimChange('')
        onStatusChange('switching')
        recognitionRef.current.stop()
    }, [lang, onInterimChange, onStatusChange, status])

    const releaseStream = () => {
        streamRef.current?.getTracks().forEach((track) => track.stop())
        streamRef.current = null
    }

    const clearCompletionTimer = () => {
        if (completionTimerRef.current !== null) {
            window.clearTimeout(completionTimerRef.current)
            completionTimerRef.current = null
        }
    }

    const stopRecording = () => {
        if (!recognitionRef.current || !isRecording) return
        onStatusChange('processing')
        recognitionRef.current.stop()
    }

    const startRecognition = (language: string) => {
        const recognition = new window.webkitSpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = language
        recognition.maxAlternatives = 5
        recognition.onresult = (event: SpeechRecognitionEvent) => {
            const results = Array.from(event.results)
            const getRecognizedText = (result: SpeechRecognitionResult) => {
                const alternatives = Array.from(result)
                return (
                    alternatives.find(
                        (alternative) =>
                            alternative.transcript.trim() &&
                            !hasNonLatinLetters(alternative.transcript)
                    )?.transcript.trim() ?? ''
                )
            }
            const changedResults = results.slice(event.resultIndex)
            const finalTranscript = changedResults
                .filter((result) => result.isFinal)
                .map(getRecognizedText)
                .filter(Boolean)
            const interimResults = results.filter((result) => !result.isFinal)
            const interim = interimResults
                .map(getRecognizedText)
                .filter(Boolean)
                .join(' ')
            const rejectedForeignScript = changedResults.some((result) => {
                const alternatives = Array.from(result).filter((alternative) =>
                    alternative.transcript.trim()
                )
                return (
                    alternatives.length > 0 &&
                    alternatives.every((alternative) =>
                        hasNonLatinLetters(alternative.transcript)
                    )
                )
            })
            const mismatch = getLanguageMismatch(
                [interim, ...finalTranscript].join(' '),
                language
            )
            const rejectSpeech = rejectedForeignScript || mismatch

            if (rejectSpeech) {
                setWarning(getLanguageGuidance(language))
            } else if (finalTranscript.length > 0) {
                setWarning('')
            }

            onInterimChange(mismatch ? '' : interim)

            if (finalTranscript.length > 0 && !mismatch) {
                hasFinalResultRef.current = true
                const shouldReplace = replaceNextWordRef.current
                if (shouldReplace) {
                    replaceNextWordRef.current = false
                    setReplaceNextWord(false)
                }
                setTranscript((current) => {
                    const [firstResult, ...remainingResults] = finalTranscript
                    const updatedTranscript = shouldReplace
                        ? replaceLastWord(current, firstResult)
                        : [current.trim(), firstResult]
                              .filter(Boolean)
                              .join(' ')

                    return remainingResults.reduce(
                        (text, result) =>
                            [text.trim(), result].filter(Boolean).join(' '),
                        updatedTranscript
                    )
                })
            }
        }
        recognition.onerror = (event) => {
            if (recognitionRef.current !== recognition) return

            if (languageRestartRef.current && event.error === 'aborted') return

            const messages: Record<string, string> = {
                'audio-capture':
                    'We could not access your microphone. Check its connection and try again.',
                'not-allowed':
                    'Microphone permission was denied. Allow access and try again.',
                'service-not-allowed':
                    'Speech recognition is blocked by your browser settings.',
                'no-speech':
                    'We did not catch any words. Try again when you are ready.',
                network:
                    'Speech recognition needs a network connection. Check your connection and try again.',
            }

            if (event.error !== 'aborted') {
                setError(
                    messages[event.error] ??
                        'Something interrupted speech recognition. Please try again.'
                )
            }
            onInterimChange('')
            onStatusChange('idle')
            recognitionRef.current = null
            languageRestartRef.current = false
            releaseStream()
        }
        recognition.onend = () => {
            if (recognitionRef.current !== recognition) return

            recognitionRef.current = null
            if (languageRestartRef.current) {
                languageRestartRef.current = false
                try {
                    startRecognition(languageRef.current)
                } catch (recordingError) {
                    console.error(
                        'Unable to restart speech recognition after a language change:',
                        recordingError
                    )
                    releaseStream()
                    setError(
                        'Could not change the recognition language. Please try again.'
                    )
                    onStatusChange('idle')
                }
                return
            }

            releaseStream()

            if (hasFinalResultRef.current) {
                onInterimChange('')
                onStatusChange('complete')
                clearCompletionTimer()
                completionTimerRef.current = window.setTimeout(() => {
                    onStatusChange('idle')
                    completionTimerRef.current = null
                }, 2600)
                return
            }

            onInterimChange('')
            setError(
                'No confirmed words yet. Try speaking again when you are ready.'
            )
            onStatusChange('idle')
        }

        recognitionRef.current = recognition
        activeRecognitionLanguageRef.current = language
        recognition.start()
        onStatusChange('listening')
    }

    const startRecording = async () => {
        setError('')
        setWarning('')
        onInterimChange('')
        clearCompletionTimer()
        hasFinalResultRef.current = false
        languageRestartRef.current = false
        onStatusChange('starting')

        if (!navigator.mediaDevices?.getUserMedia) {
            setError('Microphone access is not available in this browser.')
            onStatusChange('idle')
            return
        }

        if (!window.webkitSpeechRecognition) {
            setError('Speech recognition is not supported in this browser.')
            onStatusChange('idle')
            return
        }

        try {
            streamRef.current = await navigator.mediaDevices.getUserMedia({
                audio: true,
            })

            startRecognition(languageRef.current)
        } catch (recordingError) {
            console.error('Unable to start voice transcription:', recordingError)
            releaseStream()
            setError('Could not start your microphone. Please check its permission.')
            onStatusChange('idle')
        }
    }

    useEffect(
        () => () => {
            clearCompletionTimer()
            const recognition = recognitionRef.current
            recognitionRef.current = null
            recognition?.stop()
            streamRef.current?.getTracks().forEach((track) => track.stop())
        },
        []
    )

    const statusLabel = isStarting
        ? 'CONNECTING'
        : isSwitchingLanguage
          ? 'CHANGING LANGUAGE'
        : isRecording
          ? 'LISTENING LIVE'
          : isProcessing
            ? 'FINISHING UP'
            : isComplete
              ? 'WORDS ADDED'
              : replaceNextWord
                ? 'REPLACE NEXT'
                : 'VOICE INPUT'

    return (
        <section
            className={`voice-card${isRecording ? ' is-recording' : ''}${isSwitchingLanguage ? ' is-switching' : ''}${isProcessing ? ' is-processing' : ''}${isComplete ? ' is-complete' : ''}`}
            aria-label="Voice recording controls"
        >
            <div className="card-topline">
                <span className="card-index">01 / SPEAK</span>
                <span
                    className={`listening-pill${isRecording ? ' live' : ''}${isSwitchingLanguage || isProcessing ? ' processing' : ''}${isComplete ? ' complete' : ''}`}
                >
                    <span className="listening-dot" />
                    {statusLabel}
                </span>
            </div>

            <div className="voice-content">
                <p className="voice-kicker">
                    {isRecording
                        ? 'WE’RE ALL EARS'
                        : isStarting
                          ? 'GETTING THINGS READY'
                          : isSwitchingLanguage
                            ? 'KEEP GOING'
                          : isProcessing
                            ? 'ONE LAST MOMENT'
                            : isComplete
                              ? 'SAFELY ON THE PAGE'
                              : 'WHEN YOU’RE READY'}
                </p>
                <h2>
                    {isRecording
                        ? 'Go on.'
                        : isStarting
                          ? 'Just a second.'
                          : isSwitchingLanguage
                            ? 'One moment.'
                          : isProcessing
                            ? 'Wrapping up.'
                            : isComplete
                              ? 'All caught up.'
                              : 'Find your voice.'}
                </h2>
                <p className="voice-description" aria-live="polite">
                    {isRecording
                        ? replaceNextWord
                            ? 'Say the corrected word now; it will replace the last word on the page.'
                            : 'Speak naturally. Live words are showing on the page.'
                        : isStarting
                          ? 'Allow microphone access in your browser prompt…'
                          : isSwitchingLanguage
                            ? 'Changing the recognition language. Your microphone will stay on.'
                          : isProcessing
                            ? 'Finishing your last words and adding them to the page.'
                            : isComplete
                              ? 'Your latest words are ready. Keep going whenever you like.'
                              : replaceNextWord
                                ? 'The next recognized words will replace the last word on the page.'
                                : 'Tap the button and let your thoughts flow.'}
                </p>

                <div className="voice-visual">
                    <div className="waveform" aria-hidden="true">
                        {waveformHeights.map((height, index) => (
                            <span
                                className="waveform-bar"
                                key={index}
                                style={{
                                    height: `${height}%`,
                                    animationDelay: `${index * -45}ms`,
                                }}
                            />
                        ))}
                    </div>
                    <button
                        className={`record-button${isRecording ? ' recording' : ''}${isProcessing ? ' processing' : ''}`}
                        type="button"
                        onClick={
                            isRecording ? stopRecording : startRecording
                        }
                        disabled={isStarting || isSwitchingLanguage || isProcessing}
                        aria-label={
                            isStarting
                                ? 'Starting microphone'
                                : isSwitchingLanguage
                                  ? 'Changing speech language'
                                : isProcessing
                                  ? 'Finishing transcription'
                                  : isRecording
                                    ? 'Stop recording'
                                    : isComplete
                                      ? 'Record another thought'
                                      : 'Start recording'
                        }
                    >
                        <span className="record-button-inner">
                            {isRecording || isProcessing ? (
                                <HiOutlineStop aria-hidden="true" />
                            ) : (
                                <HiOutlineMicrophone aria-hidden="true" />
                            )}
                        </span>
                    </button>
                </div>

                <p className="record-hint" aria-live="polite">
                    {isStarting
                        ? 'CONNECTING TO MICROPHONE…'
                        : isSwitchingLanguage
                          ? 'APPLYING NEW LANGUAGE…'
                        : isRecording
                          ? 'TAP TO FINISH'
                          : isProcessing
                            ? 'ADDING YOUR LAST WORDS…'
                            : isComplete
                              ? 'READY FOR YOUR NEXT THOUGHT'
                              : replaceNextWord
                                ? 'NEXT WORD WILL REPLACE THE LAST'
                                : 'TAP TO START'}
                </p>
                {error && (
                    <p className="record-error" role="alert">
                        {error}
                    </p>
                )}
                {warning && (
                    <p className="record-warning" role="status">
                        {warning}
                    </p>
                )}
            </div>

            <div className="voice-card-footer">
                <span className="footer-orbit" aria-hidden="true">
                    <span />
                </span>
                <span>YOUR THOUGHTS, AT YOUR PACE</span>
                <span className="footer-duration">NO RUSH · NO RULES</span>
            </div>
        </section>
    )
}

export default VoiceArea
