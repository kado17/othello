import type { NextPage } from 'next'
import { useEffect, useRef, useState } from 'react'
import type { Socket } from 'socket.io-client'
import { io } from 'socket.io-client'
import styled from 'styled-components'

const URL = 'http://localhost:8000'
const COLOR = ['white', 'black']
const USER_STATE = ['観戦者', '対戦相手待機中', 'プレイヤー[白]', 'プレイヤー[黒]']

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #cff;
`

const Board = styled.div`
  align-items: center;
  width: 66vh;
  height: 65.9vh;
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
  text-align: center;
  vertical-align: bottom;
  background-color: ${({ num }) => (num === 8 ? 'red' : '')};
  border: 0.2vh solid black;
`
const Disk = styled.div<{ num: number }>`
  width: 5vh;
  height: 5vh;
  margin: auto;
  background-color: ${({ num }) => (num === 0 || num === 1 ? COLOR[num] : '')};
  border-radius: 50%;
`

const BoardDisk = styled(Disk)`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: 5vh;
  height: 5vh;
`

const GameMsg = styled.div`
  position: fixed;
  top: 5vh;
  width: 66vh;
  padding: 0.2vh;
  margin: 0 0 3vh;
  font-size: 4vh;
  font-weight: bold;
  line-height: 7vh;
  color: black;
  text-align: center;
  background: #eee;
  border: 0.3vh solid #222;
  border-radius: 0.5em;

  span.white {
    color: white;
    text-shadow: 1px 1px 0 black, -1px -1px 0 black, -1px 1px 0 black, 1px -1px 0 black,
      0 1px 0 black, 0 -1px 0 black, -1px 0 0 black, 1px 0 0 black;
  }
`
const DiskCount = styled(GameMsg)`
  top: initial;
  bottom: 5vh;
  display: flex;
  width: initial;
  padding: 0.8vh;
  line-height: 4.5vh;
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
  align-items: center;
  background: whitesmoke;
  border-radius: 1.5em;
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

const ModalButton = styled.button`
  width: 40%;
  height: 30%;
  margin-top: 10%;
  font-size: 300%;
  background-color: #ddd;
  border: 0.1vh solid black;
  border-radius: 1.5em;

  :hover {
    background-color: #ccc;
  }
`
const ButtonArea = styled.div`
  position: fixed;
  right: 1vh;
  bottom: 1vh;
  display: flex;
  flex-direction: column;
  height: 15vh;
  padding: 1vh;
  background-color: #dff;
  border: solid 0.2vh black;
  border-radius: 1.5em;
`

const EntryButton = styled.button`
  width: 20vh;
  height: 8vh;
  font-size: 4vh;
  background-color: #ddd;

  /* #c0c0c0 暗い #e6e6fa 明るめ */
  border-bottom: solid 0.6vh #555;
  border-radius: 1.5em;

  :active {
    border-bottom: solid 0.1vh #555;
    box-shadow: 0 0 0.1vh rgb(0 0 0 / 30%);
  }
`
const UserStateLabel = styled.div<{ userState: string }>`
  position: fixed;
  bottom: 1vh;
  left: 1vh;
  display: flex;
  flex-direction: column;
  padding: 1vh;
  font-size: 3.6vh;
  color: ${({ userState }) => (userState === USER_STATE[3] ? 'white' : 'black')};
  background-color: ${({ userState }) =>
    userState === USER_STATE[2] ? 'white' : userState === USER_STATE[3] ? 'black' : 'whitesmoke'};
  border-left: solid 0.5vh gray;
  box-shadow: 0 3px 5px rgb(0 0 0 / 22%);
`

const ButtonLabel = styled.label`
  margin: 0.5vh 0;
  font-size: 2vh;
  text-align: center;
`

const Home: NextPage = () => {
  const boardInit = Array.from(new Array(8), () => new Array(8).fill(9))
  const gameInfoInit = {
    board: boardInit,
    msg: 'INIT',
    turnColor: 'black',
    diskCount: { whiteCount: 0, blackCount: 0 },
    isPlaying: false,
    isGameOver: false,
  }
  const [gameInfo, setGameInfo] = useState(gameInfoInit)
  const [userState, setUserState] = useState(USER_STATE[0])
  const [isClickedStart, setIsClickedStart] = useState(false)
  const [isShowModal, setIsShowModal] = useState(true)
  const [isSocketCond, setIsSocketCond] = useState<null | boolean>(null)
  // eslint-disable-next-line
  const socket = useRef<Socket>(null!)
  const zeroPadding = (num: number) => {
    return `0${num}`.slice(-2)
  }

  useEffect(() => {
    socket.current = io(URL, {
      reconnection: false,
    })
    socket.current.on('gameInfo', (data) => {
      const { board = null, msg = null, diskCount = null, turnColor = null } = data
      console.log(data)
      if (board !== null) setGameInfo((current) => ({ ...current, board: board }))

      if (msg !== null) setGameInfo((current) => ({ ...current, msg: msg }))

      if (diskCount !== null) setGameInfo((current) => ({ ...current, diskCount: diskCount }))
      if (turnColor !== null) setGameInfo((current) => ({ ...current, turnColor: turnColor }))
    })
    socket.current.on('btnActionRep', (data) => {
      const { type, isSuccses } = data
      if (type === 'entry') {
        if (isSuccses) {
          window.alert('エントリーしました')
          setUserState(USER_STATE[1])
        }
      }
    })
    socket.current.on('startReversi', (data) => {
      const { color } = data
      if (color === 'white') {
        setUserState(USER_STATE[2])
      } else if (color === 'black') {
        setUserState(USER_STATE[3])
      }
      setGameInfo({ ...gameInfo, isPlaying: true })
    })

    socket.current.on('gameOver', (data) => {
      const { result } = data
      console.log(result)
      setGameInfo((current) => ({ ...current, isGameover: true }))
    })
    socket.current.on('connect', () => {
      setIsSocketCond(true)
      console.log('connect!')
    })
    socket.current.on('connect_error', () => {
      setIsSocketCond(false)
      console.log('not_connect!')
      window.alert('サーバーに接続できませんでした。\nもう一度読み込みなおしてください。')
    })
    return () => {
      socket.current.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const putDisk = (x: number, y: number, num: number) => {
    if (num === 8) {
      const data = { y: y, x: x }
      console.log(data)
      socket.current.emit('putDisk', { x: x, y: y })
    }
  }

  const registerUserInfo = () => {
    setIsClickedStart(true)
    setIsShowModal(false)
    console.log(socket.current.id)
    /* socket.on('connect', () => {
      console.log(`socket.connectの中身：`)
      console.log(socket.id)
    })*/
  }

  const entry = () => {
    if (window.confirm('エントリーしますか？')) {
      alert('エントリーしました。')
      socket.current.emit('entry')
    } else {
      alert('キャンセルされました。')
    }
  }

  return (
    <Container>
      <ModalBack isShow={isShowModal}>
        <Modal isShow={isClickedStart}>
          <ModalLable>
            {isSocketCond === null
              ? 'サーバーに接続中'
              : isSocketCond
              ? '接続完了!'
              : 'サーバーに接続できません'}
          </ModalLable>
          {isSocketCond ? (
            <ModalButton id="inputName" type="submit" onClick={registerUserInfo}>
              Start
            </ModalButton>
          ) : (
            ''
          )}
        </Modal>
      </ModalBack>

      <GameMsg> {gameInfo.msg}</GameMsg>
      <Board>
        {gameInfo.board.map((row, y) =>
          row.map((num, x) => (
            <Sqaure
              key={`${x}-${y}`}
              num={num}
              onClick={() => {
                putDisk(x, y, num)
              }}
            >
              <BoardDisk num={num} />
            </Sqaure>
          ))
        )}
      </Board>
      <DiskCount>
        <Disk num={0} />：{zeroPadding(gameInfo.diskCount.whiteCount)} -{' '}
        {zeroPadding(gameInfo.diskCount.blackCount)}： <Disk num={1} />
      </DiskCount>
      {!gameInfo.isPlaying || userState === USER_STATE[2] || userState === USER_STATE[3] ? (
        <ButtonArea>
          <ButtonLabel>参加はこちらから</ButtonLabel>
          <EntryButton onClick={() => entry()}>Entry</EntryButton>
        </ButtonArea>
      ) : (
        ''
      )}
      {isSocketCond ? (
        <UserStateLabel userState={userState}>State : {userState}</UserStateLabel>
      ) : (
        ''
      )}
    </Container>
  )
}

export default Home
