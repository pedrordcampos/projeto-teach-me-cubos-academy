import { useState, useRef, useEffect } from 'react'
import './App.css'
import { ItemSuggestions } from './components/ItemSuggestions'
import { getHistoric, setHistoric } from './storage/historic'
import { sendMessage } from './api/openai'
import { ThreeDots } from 'react-loader-spinner'

type ProgressType = 'pending' | 'started' | 'done'
type Message = {
  role: 'user' | 'assistant'
  content: string
  subject?: string
}

function App() {
  const [progress, setProgress] = useState<ProgressType>('pending')
  const [textarea, setTextArea] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [chat, setChat] = useState<Message[]>([])
  const resetButtonRef = useRef<HTMLButtonElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function resetChat() {
    setProgress('pending')
    setChat([])
  }

  async function handleSubmitChat() {
    if (!textarea) {
      return
    }

    const message = textarea
    setTextArea('')

    if (progress === 'pending') {
      setHistoric(message)
      setProgress('started')
      const prompt = `gere uma pergunta onde simule uma entrevista de emprego
      sobre ${message}, após gerar a pergunta, enviarei a resposta e você me dará um feedback.
      O feedback precisa ser simples, objetivo e corresponder fielmente a resposta enviada. 
      Após o feedback não existirá mais interação.`
      const messageGPT: Message = {
        role: 'user',
        content: prompt,
        subject: message
      }
      setChat(text => [...text, messageGPT])

      setLoading(true)
      const questionGPT = await sendMessage([messageGPT])
      setLoading(false)
      setChat(text => [...text, { role: 'assistant', content: questionGPT.content }])
      return
    }

    const responseUser: Message = {
      role: 'user',
      content: message
    }

    setChat(text => [...text, responseUser])
    setLoading(true)
    const feedbackGPT = await sendMessage([...chat, responseUser])
    setChat(text => [...text, { role: 'assistant', content: feedbackGPT.content }])
    setLoading(false)
    setProgress('done')
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement | HTMLButtonElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()

      if (progress === 'pending' || progress === 'started') {
        handleSubmitChat()
      } else if (progress === 'done') {
        resetChat()
      }
    }
  }

  useEffect(() => {
    if (progress === 'done' && resetButtonRef.current) {
      resetButtonRef.current?.focus()
    }
  }, [progress])

  useEffect(() => {
    if (progress !== 'done' && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 0)
    }
  }, [progress])

  function handleSuggestionClick(topic: string) {
    setTextArea(topic)
    textareaRef.current?.focus()
  }

  function clearHistoric() {
    localStorage.removeItem('historics')
    window.location.reload()
  }

  return (
    <div className="container">
      <div className="sidebar">
        <details open className="suggestions">
          <summary>Tópicos sugeridos</summary>
          <ItemSuggestions title='HTML' onClick={() => handleSuggestionClick('HTML')} />
          <ItemSuggestions title='CSS' onClick={() => handleSuggestionClick('CSS')} />
          <ItemSuggestions title='Python' onClick={() => handleSuggestionClick('Python')} />
          <ItemSuggestions title='Javascript' onClick={() => handleSuggestionClick('Javascript')} />
        </details>

        <details open className="historic">
          <summary>Histórico</summary>
          {
            getHistoric()?.length > 0 ? getHistoric().map(item => (
              <ItemSuggestions key={item} title={item} onClick={() => handleSuggestionClick(item)} />
            )) : ''
          }

          <button className="clear-historic" onClick={clearHistoric}>
            🗑 Limpar histórico
          </button>
        </details>
      </div>

      <div className="content">
        {
          progress === 'pending' && (
            <div className="box-home">
              <span>olá, eu sou o</span>
              <h1>teach<span>.me</span></h1>
              <p>
                Estou aqui para te ajudar nos seus estudos.
                Selecione um dos tópicos sugeridos ao lado ou
                digite um tópico que deseja estudar para
                começarmos.
              </p>
            </div>
          )}

        {
          progress !== 'pending' && (
            <div className="box-chat">
              {chat[0] && (
                <h1>Você está estudando sobre <span>{chat[0].subject}</span></h1>
              )}

              {chat[1] && (
                <div className="question">
                  <h2>Pergunta</h2>
                  <p>
                    {chat[1].content}
                  </p>
                </div>
              )}

              {chat[2] && (
                <div className="answer">
                  <h2>Sua resposta</h2>
                  <p>
                    {chat[2].content}
                  </p>
                </div>
              )}

              {chat[3] && (
                <div className="feedback">
                  <h2>feedback teach<span>.me</span></h2>
                  <p>
                    {chat[3].content}
                  </p>
                  <div className="action">
                    <button
                      ref={resetButtonRef}
                      onClick={resetChat}
                      onKeyDown={handleKeyDown}
                    >
                      Estudar novo tópico
                    </button>
                  </div>
                </div>
              )}

              {
                loading && (
                  <ThreeDots
                    visible={true}
                    height="30"
                    width="40"
                    color="#d6409f"
                    radius="9"
                    ariaLabel='three-dots-loading'
                    wrapperStyle={{ margin: '30px auto' }}
                  />
                )
              }
            </div>
          )
        }

        {progress !== 'done' && (
          <div className="box-input">
            <textarea
              ref={textareaRef}
              value={textarea}
              onChange={element => setTextArea(element.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={progress === 'started' ? "Insira a sua resposta" : "Insira o tema que deseja estudar..."}
            />
            <button onClick={handleSubmitChat}>
              {progress === 'pending' ? 'Enviar pergunta' : 'Enviar resposta'}
            </button>
          </div>
        )}

        <div className="box-footer">
          <p>teach<span>.me</span></p>
        </div>
      </div>
    </div>
  )
}

export default App
