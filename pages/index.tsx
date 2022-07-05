import type { NextPage } from 'next'
import { useEffect, useRef, useState } from 'react'
import type { Socket } from 'socket.io-client'
import { io } from 'socket.io-client'
import styled from 'styled-components'

const COLOR = ['white', 'black']
const URL = 'http://localhost:8000'

const Container = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #cff;
`

const Board = styled.div`
  align-items: center;
  width: 66vh;
  height: 65vh;
  background-color: #0d0;
  border: 1vh solid black;
`

const Sqaure = styled.div<{ num: number }>`
  position: relative;
  display: inline-block;
  width: 8vh;
  height: 8vh;
  font-size: 12vh;
  line-height: 4.5vh;
  color: ${({ num }) => (0 === num || num === 1 ? COLOR[num] : '')};
  text-align: center;
  vertical-align: bottom;
  border: 0.2vh solid black;
`

const WhiteDisk = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: 5vh;
  height: 5vh;
  margin: auto;
  background-color: white;
  border-radius: 50%;
`

const BlackDisk = styled(WhiteDisk)`
  background-color: black;
`

const ColumnArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 75vh;
  margin: 0 3vh;
  font-size: 0;
`

const GameStateShow = styled.div`
  height: 8vh;
  margin: 0 0 1vh;
  font-size: 3vh;
  font-weight: bold;
  line-height: 7vh;
  color: black;
  text-align: center;
`

const PlayerWhite = styled.div`
  width: 26vh;
  height: 8vh;
  margin: 25vh 0;
  font-size: 3vh;
  line-height: 7vh;
  color: black;
  text-align: center;
  background-color: white;
  border: solid 0.5vh black;
  border-radius: 0.5em;
`

const PlayerBlack = styled(PlayerWhite)`
  margin: 9vh 0 24vh;
  color: whitesmoke;
  text-align: center;
  background-color: black;
  border: solid 0.5vh white;
`

const LogArea = styled.textarea`
  width: 22vh;
  height: 40vh;
  margin-top: 9vh;
  margin-bottom: 10vh;
  font-size: 2vh;
  resize: none;
  border-radius: 4px;
`
const Modal = styled.div<{ isShow: boolean }>`
  position: absolute;
  top: 30%;
  right: 30%;
  bottom: 30%;
  left: 30%;
  z-index: 2;
  display: ${({ isShow }) => (isShow ? 'None' : 'flex')};
  flex-direction: column;
  background: whitesmoke;
  border-radius: 1.5em;

  div {
    display: flex;
    justify-content: center;
    width: 100%;
    height: 100%;
    margin-top: 15%;
  }
`

const ModalLable = styled.label`
  margin-top: 8%;
  font-size: 270%;
  color: black;
  text-align: center;
`

const ModalBack = styled.div<{ isShow: boolean }>`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1;
  display: ${({ isShow }) => (isShow ? '' : 'None')};
  display: None;
  width: 100%;
  height: 100%;
  background-color: rgb(0 0 0 / 80%);
`
const InputBox = styled.input.attrs({ type: 'text', maxLength: 6 })`
  width: 60%;
  height: 40%;
  font-size: 120%;
  border: solid 0.1vh black;
  border-radius: 0.2em;

  :focus {
    border: transparent 0.1vh solid;
    outline: 0;
    box-shadow: 0 0 0 0.2vh rgb(33 150 243) inset;
  }
`

const InputButton = styled.button`
  width: 15%;
  height: 40%;
  margin-left: 2%;
  font-size: 120%;
  background-color: #ddd;
  border: 0.1vh solid black;
  border-radius: 1.5em;

  :hover {
    background-color: #ccc;
  }
`
const AlertPrompt = styled.div`
  position: fixed;
  top: 0;
  z-index: 5;
  display: None;
  justify-content: center;
  width: 45%;
  height: 10%;
  margin-top: 2vh;
  background-color: red;
  border-radius: 1.5em;
  animation: slide-in 1.6s;
  @keyframes slide-in {
    0% {
      opacity: 0;
      transform: translateY(-64px);
    }

    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }
`
const ButtonArea = styled(ColumnArea)`
  height: 15vh;
  padding: 1vh;
  background-color: #dff;
  border: solid 0.1vh;
  border-radius: 1.5em;
`

const EntryButton = styled.button`
  width: 20vh;
  height: 8vh;
  font-size: 4vh;
  background-color: #ddd;

  /* c0c0c0 暗い #e6e6fa 明るめ */
  border-bottom: solid 0.6vh #555;
  border-radius: 1.5em;

  :active {
    border-bottom: solid 0.1vh #555;
    box-shadow: 0 0 0.1vh rgb(0 0 0 / 30%);
  }
`
const UserInfoArea = styled.div`
  position: fixed;
  bottom: 1vh;
  left: 1vh;
  display: flex;
  flex-direction: column;
  padding: 0.7vh;
  background-color: whitesmoke;
  border-left: solid 0.5vh gray;
  box-shadow: 0 3px 5px rgb(0 0 0 / 22%);
`

const UserInfoLabel = styled.label`
  margin: 0.1vh 0;
  font-size: 3vh;
`

const ButtonLabel = styled.label`
  margin: 0.5vh 0;
  font-size: 2vh;
`

const Home: NextPage = () => {
  const boardInit = Array.from(new Array(8), () => new Array(8).fill(9))
  const [board, setBoard] = useState(boardInit)
  const [userInfo, setUserInfo] = useState({ userName: '匿名', userState: '観戦者' })
  const [isClickedStart, setIsClickedStart] = useState(false)
  const [isShowModal, setIsShowModal] = useState(true)
  const [isSocketCond, setIsSocketCond] = useState<null | boolean>(null)
  // eslint-disable-next-line
  const socket = useRef<Socket>(null!)
  useEffect(() => {
    socket.current = io(URL, {
      reconnection: false,
    })

    socket.current.on('board', (msg) => {
      console.log(msg)
      const b = msg.board
      setBoard(b)
    })
    socket.current.on('result', (msg) => {
      console.log(msg)
    })
    socket.current.on('connect', () => {
      setIsSocketCond(true)
      console.log('connect!')
    })
    socket.current.on('connect_error', () => {
      setIsSocketCond(false)
      console.log('not_connect!')
    })
    return () => {
      socket.current.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const b = (x: number, y: number) => {
    const data = { y: y, x: x }
    console.log(data)
    socket.current.emit('putDisk', { x: x, y: y })
  }

  const registerUserInfo = () => {
    setIsClickedStart(true)
    setIsShowModal(false)
    console.log('CL')
    /* socket.on('connect', () => {
      console.log(`socket.connectの中身：`)
      console.log(socket.id)
    })*/
  }

  return (
    <Container>
      <AlertPrompt />
      <ModalBack isShow={isShowModal}>
        <Modal isShow={isClickedStart}>
          <ModalLable>
            {isSocketCond === null
              ? 'サーバーに接続中'
              : isSocketCond
              ? 'ユーザー名を入力してください'
              : 'サーバーに接続できません'}
          </ModalLable>
          {isSocketCond ? (
            <div>
              <InputBox
                id="inputName"
                value={userInfo.userName}
                onChange={(e) => setUserInfo({ ...userInfo, userName: e.target.value })}
              />
              <InputButton id="inputName" type="submit" onClick={registerUserInfo}>
                Start
              </InputButton>
            </div>
          ) : (
            ''
          )}
        </Modal>
      </ModalBack>
      <ColumnArea>
        <PlayerBlack>黒 - 未着席さんだ</PlayerBlack>
        <PlayerWhite>白 - 未着席さんだ</PlayerWhite>
      </ColumnArea>
      <ColumnArea>
        <GameStateShow>参加者募集中</GameStateShow>
        <Board>
          {board.map((row, y) =>
            row.map((num, x) => (
              <Sqaure
                key={`${x}-${y}`}
                num={num}
                onClick={() => {
                  b(x, y)
                }}
              >
                {num === 0 ? <WhiteDisk /> : num === 1 ? <BlackDisk /> : ''}
              </Sqaure>
            ))
          )}
        </Board>
      </ColumnArea>
      <ColumnArea>
        <LogArea readOnly={true} />
        <ButtonArea>
          <ButtonLabel>参加はこちらから</ButtonLabel>
          <EntryButton>Entry</EntryButton>
        </ButtonArea>
      </ColumnArea>
      {isSocketCond ? (
        <UserInfoArea>
          {' '}
          <UserInfoLabel>UserName : {userInfo.userName}</UserInfoLabel>
          <UserInfoLabel>State : {userInfo.userState}</UserInfoLabel>
        </UserInfoArea>
      ) : (
        ''
      )}
    </Container>
  )
}

export default Home
