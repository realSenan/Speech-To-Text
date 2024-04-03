import React, { useContext } from 'react'
import { LangContext, TranscriptContext } from '../App'
import { HiMiniClipboardDocumentList } from 'react-icons/hi2'
import { GrPowerReset } from 'react-icons/gr'
import toast, { Toaster } from 'react-hot-toast'

const TextArea: React.FC = () => {
    const { transcript, setTranscript } = useContext(TranscriptContext)
    const { setLang } = useContext(LangContext)

    const languageHandler = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedOption = e.target.selectedOptions[0]
        setLang(e.target.value)
        toast.success(`Changed successfully: ${selectedOption.innerText}`)
    }

    const resetValue = () => {
        setTranscript('')
        toast.success('Text reset!')
    }

    const copyClipBoard = async () => {
        try {
            await navigator.clipboard.writeText(transcript)
            toast.success('Text copied to clipboard!')
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <div className="bg-neutral-800 p-10 h-1/2">
            <div className="container mx-auto duration-300 h-full">
                <Toaster position="top-center" reverseOrder={false} />
                <div className="right-10 -mt-6 mb-2 ms-auto flex h-10 max-w-fit items-center gap-3 rounded-lg ">
                    <select
                        className="h-10 cursor-pointer  rounded-lg px-4 outline-none"
                        onChange={languageHandler}
                    >
                        <option value="az-AZ">Azerbaijan</option>
                        <option value="tr-TR">Turkish</option>
                        <option value="en-EN">English</option>
                    </select>

                    <button
                        onClick={copyClipBoard}
                        className=" cursor-pointer rounded-lg bg-zinc-500 p-2 px-4 hover:bg-green-300"
                    >
                        <HiMiniClipboardDocumentList size={20} />
                    </button>

                    <button
                        onClick={resetValue}
                        className="cursor-pointer rounded-lg bg-zinc-500  p-2 px-4 hover:bg-red-500"
                    >
                        <GrPowerReset size={20} />
                    </button>
                </div>
                <textarea
                placeholder='Just talk about something...'
                    onChange={(e) => setTranscript(e.target.value)}
                    className=" h-full w-full overscroll-y-auto rounded-lg bg-neutral-700/20 p-3 text-xl outline-none"
                    value={transcript.trim()}
                />
            </div>
        </div>
    )
}

export default TextArea
