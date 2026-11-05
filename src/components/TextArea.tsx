import React, { useContext, useEffect, useRef, useState } from 'react'
import {
    HiOutlineCheck,
    HiOutlineChevronDown,
    HiOutlineClipboardDocument,
    HiOutlineArrowUturnLeft,
    HiOutlineTrash,
} from 'react-icons/hi2'
import toast, { Toaster } from 'react-hot-toast'
import { LangContext, SpeechStatus, TranscriptContext } from '../App'

const languages = [
    {
        code: 'az-AZ',
        name: 'Azerbaijani',
        nativeName: 'Azərbaycan dili',
        flag: 'AZ',
    },
    { code: 'tr-TR', name: 'Turkish', nativeName: 'Türkçe', flag: 'TR' },
    { code: 'en-US', name: 'English', nativeName: 'English (US)', flag: 'EN' },
]

type LanguageSelectProps = {
    value: string
    onChange: (value: string, name: string) => void
}

const LanguageSelect: React.FC<LanguageSelectProps> = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [activeIndex, setActiveIndex] = useState(
        Math.max(
            0,
            languages.findIndex((language) => language.code === value)
        )
    )
    const containerRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
    const selectedLanguage =
        languages.find((language) => language.code === value) ?? languages[0]

    useEffect(() => {
        if (isOpen) optionRefs.current[activeIndex]?.focus()
    }, [activeIndex, isOpen])

    useEffect(() => {
        const closeOnOutsideClick = (event: PointerEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false)
            }
        }

        document.addEventListener('pointerdown', closeOnOutsideClick)
        return () =>
            document.removeEventListener('pointerdown', closeOnOutsideClick)
    }, [])

    const openAtSelected = () => {
        setActiveIndex(
            Math.max(
                0,
                languages.findIndex((language) => language.code === value)
            )
        )
        setIsOpen(true)
    }

    const selectLanguage = (index: number) => {
        const language = languages[index]
        onChange(language.code, language.name)
        setIsOpen(false)
        triggerRef.current?.focus()
    }

    const moveActiveOption = (index: number) => {
        setActiveIndex((index + languages.length) % languages.length)
    }

    const handleTriggerKeyDown = (
        event: React.KeyboardEvent<HTMLButtonElement>
    ) => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            openAtSelected()
            return
        }

        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            if (isOpen) setIsOpen(false)
            else openAtSelected()
        }
    }

    const handleOptionKeyDown = (
        event: React.KeyboardEvent<HTMLButtonElement>,
        index: number
    ) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault()
            moveActiveOption(index + 1)
        } else if (event.key === 'ArrowUp') {
            event.preventDefault()
            moveActiveOption(index - 1)
        } else if (event.key === 'Home') {
            event.preventDefault()
            setActiveIndex(0)
        } else if (event.key === 'End') {
            event.preventDefault()
            setActiveIndex(languages.length - 1)
        } else if (event.key === 'Escape') {
            event.preventDefault()
            setIsOpen(false)
            triggerRef.current?.focus()
        } else if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            selectLanguage(index)
        } else if (event.key === 'Tab') {
            setIsOpen(false)
        }
    }

    return (
        <div>
            <div className="language-label">TRANSCRIBE IN</div>
            <div className="language-picker" ref={containerRef}>
                <button
                    ref={triggerRef}
                    className={`language-trigger${isOpen ? ' is-open' : ''}`}
                    type="button"
                    role="combobox"
                    aria-label="Transcription language"
                    aria-expanded={isOpen}
                    aria-controls="language-options"
                    aria-haspopup="listbox"
                    onClick={() =>
                        isOpen ? setIsOpen(false) : openAtSelected()
                    }
                    onKeyDown={handleTriggerKeyDown}
                >
                    <span className="language-flag">
                        {selectedLanguage.flag}
                    </span>
                    <span className="language-trigger-copy">
                        <span className="language-trigger-name">
                            {selectedLanguage.name}
                        </span>
                        <span className="language-trigger-native">
                            {selectedLanguage.nativeName}
                        </span>
                    </span>
                    <HiOutlineChevronDown
                        className="language-chevron"
                        aria-hidden="true"
                    />
                </button>
                {isOpen && (
                    <div
                        className="language-options"
                        id="language-options"
                        role="listbox"
                        aria-label="Choose transcription language"
                    >
                        {languages.map((language, index) => (
                            <button
                                ref={(element) => {
                                    optionRefs.current[index] = element
                                }}
                                className={`language-option${language.code === value ? ' selected' : ''}`}
                                id={`language-option-${language.code}`}
                                key={language.code}
                                type="button"
                                role="option"
                                aria-selected={language.code === value}
                                tabIndex={activeIndex === index ? 0 : -1}
                                onClick={() => selectLanguage(index)}
                                onKeyDown={(event) =>
                                    handleOptionKeyDown(event, index)
                                }
                            >
                                <span className="language-flag">
                                    {language.flag}
                                </span>
                                <span className="language-option-copy">
                                    <span>{language.name}</span>
                                    <span>{language.nativeName}</span>
                                </span>
                                {language.code === value && (
                                    <HiOutlineCheck
                                        className="language-check"
                                        aria-hidden="true"
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

type TextAreaProps = {
    status: SpeechStatus
    interimTranscript: string
}

const TextArea: React.FC<TextAreaProps> = ({ status, interimTranscript }) => {
    const { transcript, setTranscript, replaceNextWord, setReplaceNextWord } =
        useContext(TranscriptContext)
    const { lang, setLang } = useContext(LangContext)
    const wordCount = transcript.trim()
        ? transcript.trim().split(/\s+/).length
        : 0

    const languageHandler = (value: string, name: string) => {
        setLang(value)
        const successMessage =
            value === 'en-US'
                ? `Changed successfully: ${name}`
                : value === 'tr-TR'
                  ? `Başarıyla değiştirildi: ${name}`
                  : `Uğurla dəyişdirildi: ${name}`
        toast.success(successMessage)
    }

    const resetValue = () => {
        setTranscript('')
        setReplaceNextWord(false)
        const resetMessage =
            lang === 'en-US'
                ? 'Text cleared.'
                : lang === 'tr-TR'
                  ? 'Metin temizlendi.'
                  : 'Mətn təmizləndi.'
        toast.success(resetMessage)
    }

    const copyClipBoard = async () => {
        try {
            await navigator.clipboard.writeText(transcript)
            const copyMessage =
                lang === 'en-US'
                    ? 'Text copied to clipboard.'
                    : lang === 'tr-TR'
                      ? 'Metin panoya kopyalandı.'
                      : 'Mətn panoya köçürüldü.'
            toast.success(copyMessage)
        } catch (error) {
            console.error('Unable to copy transcript:', error)
            toast.error('Could not copy text. Check your browser permissions.')
        }
    }

    const speechFeedback = {
        starting: {
            badge: 'CONNECTING',
            message: 'Allow microphone access in your browser prompt…',
        },
        listening: {
            badge: 'LISTENING LIVE',
            message: 'Listening live — new words appear below as we hear them.',
        },
        switching: {
            badge: 'CHANGING LANGUAGE',
            message: 'Applying the new speech language. Your microphone stays on…',
        },
        processing: {
            badge: 'FINISHING UP',
            message: 'Finishing your last words and adding them to the page…',
        },
        complete: {
            badge: 'WORDS ADDED',
            message:
                'Your latest words are on the page. Keep going whenever you like.',
        },
        idle: {
            badge: transcript.trim() ? 'READY TO EDIT' : 'READY WHEN YOU ARE',
            message: 'Your words will appear here as you speak.',
        },
    }[status]
    const speechBadge = replaceNextWord ? 'REPLACE NEXT' : speechFeedback.badge
    const speechMessage = replaceNextWord
        ? 'Say the corrected word next; it will replace the last word on the page.'
        : speechFeedback.message

    return (
        <section className="transcript-card" aria-label="Transcript editor">
            <Toaster
                position="top-center"
                toastOptions={{
                    style: {
                        borderRadius: '14px',
                        background: '#20231f',
                        color: '#fffaf1',
                        fontSize: '13px',
                    },
                }}
            />
            <div className="transcript-header">
                <div>
                    <span className="card-index transcript-index">
                        02 / YOUR WORDS
                    </span>
                    <h2 className="transcript-title">The page is yours.</h2>
                </div>
                <span
                    className={`draft-status status-${status}${replaceNextWord ? ' status-replace' : ''}`}
                >
                    <span className="draft-dot" />
                    {speechBadge}
                </span>
            </div>

            <div className="editor-toolbar">
                <LanguageSelect value={lang} onChange={languageHandler} />

                <div className="editor-actions">
                    <button
                        className={`editor-button replace-button${replaceNextWord ? ' is-armed' : ''}`}
                        type="button"
                        onClick={() =>
                            setReplaceNextWord((isArmed) => !isArmed)
                        }
                        disabled={!transcript.trim()}
                        aria-label={
                            replaceNextWord
                                ? 'Cancel replace last word'
                                : 'Replace last word with next speech'
                        }
                        aria-pressed={replaceNextWord}
                        title={
                            replaceNextWord
                                ? 'Cancel word replacement'
                                : 'Replace the last word with what you say next'
                        }
                    >
                        <HiOutlineArrowUturnLeft aria-hidden="true" />
                    </button>
                    <button
                        className="editor-button copy-button"
                        type="button"
                        onClick={copyClipBoard}
                        disabled={!transcript.trim()}
                    >
                        <HiOutlineClipboardDocument aria-hidden="true" />
                        <span>Copy text</span>
                    </button>
                    <button
                        className="editor-button clear-button"
                        type="button"
                        onClick={resetValue}
                        disabled={!transcript.trim()}
                        aria-label="Clear transcript"
                        title="Clear transcript"
                    >
                        <HiOutlineTrash aria-hidden="true" />
                    </button>
                </div>
            </div>

            <div
                className={`speech-feedback speech-feedback-${status}`}
                aria-live="polite"
                aria-atomic="true"
            >
                <span
                    className="speech-feedback-indicator"
                    aria-hidden="true"
                />
                <span>{speechMessage}</span>
            </div>

            <div className="editor-body">
                <textarea
                    aria-label="Transcript text"
                    placeholder="Your words will appear here. You can also type or edit them anytime…"
                    onChange={(event) => setTranscript(event.target.value)}
                    value={transcript}
                    spellCheck
                />
                {interimTranscript && (
                    <div className="live-transcript">
                        <span className="live-transcript-label">
                            LIVE · MAY CHANGE
                        </span>
                        <span className="live-transcript-text">
                            {interimTranscript}
                        </span>
                    </div>
                )}
                {!transcript && !interimTranscript && (
                    <div className="empty-note" aria-hidden="true">
                        <span className="empty-note-mark">“</span>
                        <span>
                            Start with a thought. We’ll take it from there.
                        </span>
                    </div>
                )}
            </div>

            <div className="editor-footer">
                <span>EDIT, ADD, MAKE IT YOURS</span>
                <span>
                    {wordCount} {wordCount === 1 ? 'WORD' : 'WORDS'}
                    <span className="footer-separator">·</span>
                    {transcript.length} CHARACTERS
                </span>
            </div>
        </section>
    )
}

export default TextArea
