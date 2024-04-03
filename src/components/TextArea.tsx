import React, { useContext } from 'react';
import { LangContext, TranscriptContext } from '../App';
import { HiMiniClipboardDocumentList } from 'react-icons/hi2';
import { GrPowerReset } from 'react-icons/gr';
import toast, { Toaster } from 'react-hot-toast';

const TextArea: React.FC = () => {
    const { transcript, setTranscript } = useContext(TranscriptContext);
    const { setLang, lang } = useContext(LangContext);

    const languageHandler = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedOption = e.target.selectedOptions[0];
        setLang(e.target.value);

        const successMessage =
            e.target.value === 'en'
                ? `Changed successfully: ${selectedOption.innerText}`
                : e.target.value === 'tr'
                  ? `Başarıyla değiştirildi: ${selectedOption.innerText}`
                  : `Uğurla dəyişdirildi: ${selectedOption.innerText}`;
        toast.success(successMessage);
    };

    const resetValue = () => {
        setTranscript('');
        const resetMessage =
            lang === 'en'
                ? 'Text reset!'
                : lang === 'tr'
                  ? 'Metin sıfırlandı!'
                  : 'Mətn sıfırlandı!';
        toast.success(resetMessage);
    };

    const copyClipBoard = async () => {
        try {
            await navigator.clipboard.writeText(transcript);
            const copyMessage =
                lang === 'en'
                    ? 'Text copied to clipboard!'
                    : lang === 'tr'
                      ? 'Metin panoya kopyalandı!'
                      : 'Mətn panoya kopyalandı!';
            toast.success(copyMessage);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="h-1/2 bg-neutral-800 p-10">
            <div className="container mx-auto h-full duration-300">
                <Toaster position="top-center" reverseOrder={false} />
                <div className="right-10 -mt-6 mb-2 ms-auto flex h-10 max-w-fit items-center gap-3 rounded-lg ">
                    <select
                        className="h-10 cursor-pointer  rounded-lg px-4 outline-none"
                        onChange={languageHandler}
                    >
                        <option value="az">Azerbaijan</option>
                        <option value="tr">Turkish</option>
                        <option value="en">English</option>
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
                    placeholder="Just talk about something..."
                    onChange={(e) => setTranscript(e.target.value)}
                    className=" h-full w-full overscroll-y-auto rounded-lg bg-neutral-700/20 p-3 text-xl outline-none"
                    value={transcript.trim()}
                />
            </div>
        </div>
    );
};

export default TextArea;
