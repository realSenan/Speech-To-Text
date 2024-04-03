import { useContext } from 'react'
import { TranscriptContext } from '../App'

const TextArea = () => {
    const { transcript } = useContext(TranscriptContext)

    return (
        <div className='h-1/2 bg-neutral-800 p-10 '>
            <div className=" bg-neutral-700/20 p-3 rounded-lg h-full overscroll-y-auto text-xl">{transcript}</div>
        </div>
    )
}

export default TextArea
