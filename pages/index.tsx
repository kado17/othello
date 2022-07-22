import type { NextPage } from 'next'
import { useEffect, useRef, useState } from 'react'
import type { Socket } from 'socket.io-client'
import { io } from 'socket.io-client'
import styled from 'styled-components'
import * as t from '../public/typedef'

const URL = 'https://reversiserver.herokuapp.com/'
const USER_STATE = {
  spectator: '観戦者',
  waiting: '対戦相手待機中',
  PLWhite: 'プレイヤー[白]',
  PLBlack: 'プレイヤー[黒]',
}

//背景
const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #cff;
`
//盤面
const Board = styled.div`
  align-items: center;
  width: 66vh;
  height: 65.9vh;
  background-color: #0d0;
  border: 1vh solid black;
`
//石を置く升目
const Sqaure = styled.div`
  position: relative;
  display: inline-block;
  width: 8vh;
  height: 8vh;
  font-size: 12vh;
  line-height: 4.5vh;
  text-align: center;
  vertical-align: bottom;
  border: 0.2vh solid black;
`
//オセロ石
const Disc = styled.div<{ disc: t.Disc }>`
  width: 5vh;
  height: 5vh;
  margin: auto;
  background-color: ${({ disc }) => (disc === 0 ? 'white' : disc === 1 ? 'black' : '')};
  border-radius: 50%;
`
//盤面に置く用の石
const BoardDisc = styled(Disc)`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: 5vh;
  height: 5vh;
`
//石を置ける場所を示すマーカー
const PutableMarker = styled(BoardDisc)<{ turnColor: t.PLColor; gameState: string }>`
  width: 2vh;
  height: 2vh;
  background-color: ${({ turnColor, gameState }) =>
    turnColor === 'White' && gameState === 'duringAGame'
      ? 'white'
      : turnColor === 'Black' && gameState === 'duringAGame'
      ? 'black'
      : ''};
`
//手番プレイヤーなどのゲーム情報を表示
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
//黒白両方の盤面に置かれている石の数を表示
const DiscCount = styled(GameMsg)`
  top: initial;
  bottom: 4vh;
  display: flex;
  width: initial;
  padding: 0.8vh;
  line-height: 4.5vh;
`
//モーダルの本体
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
//モーダル内のLable
const ModalLable = styled.label`
  margin-top: 8%;
  font-size: 270%;
  color: black;
  text-align: center;
`
//モーダル表示中の背景
const ModalBack = styled.div<{ isShow: boolean }>`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1;
  display: ${({ isShow }) => (isShow ? '' : 'None')};
  width: 100%;
  height: 100%;
  background-color: rgb(0 0 0 / 80%);
`
//モーダル内のボタン
const ModalButton = styled.button<{ isBtnShow: boolean | null }>`
  display: ${({ isBtnShow }) => (isBtnShow ? '' : 'None')};
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
//ユーザーが押せるボタンの背景
const ButtonArea = styled.div<{ isShow: boolean }>`
  position: fixed;
  right: 1vh;
  bottom: 1vh;
  display: ${({ isShow }) => (isShow ? 'flex' : 'None')};
  flex-direction: column;
  height: 15vh;
  padding: 1vh;
  background-color: #dff;
  border: solid 0.2vh black;
  border-radius: 1.5em;
`
//ユーザーが押せるボタン
const ActButton = styled.button<{ backColor: string }>`
  width: 20vh;
  height: 8vh;
  font-size: 4vh;
  background-color: ${({ backColor }) => backColor};
  border-bottom: solid 0.6vh #555;
  border-radius: 1.5em;

  :active {
    border-bottom: solid 0.1vh #555;
    box-shadow: 0 0 0.1vh rgb(0 0 0 / 30%);
  }
`
//ボタンの説明ラベル
const ButtonLabel = styled.label`
  margin: 0.5vh 0;
  font-size: 2vh;
  text-align: center;
`
//ユーザーの情報を表示
const UserStateArea = styled.div<{ isShow: boolean | null; userStateKey: t.UserState }>`
  position: fixed;
  bottom: 1vh;
  left: 1vh;
  display: ${({ isShow }) => (isShow ? 'flex' : 'None')};
  flex-direction: column;
  padding: 1vh;
  font-size: 3.6vh;
  color: ${({ userStateKey }) => (userStateKey === 'PLBlack' ? 'white' : 'black')};
  background-color: ${({ userStateKey }) =>
    userStateKey === 'PLWhite' ? 'white' : userStateKey === 'PLBlack' ? 'black' : 'whitesmoke'};
  border-left: solid 0.5vh gray;
  box-shadow: 0 3px 5px rgb(0 0 0 / 22%);
`
//現在接続しているユーザー数を表示
const ConnectCountLabel = styled.label`
  position: fixed;
  top: 1vh;
  left: 1vh;
  padding: 1vh 2vh;
  font-size: 3vh;
  text-align: center;
  background-color: whitesmoke;
  border-radius: 1.5em;
  box-shadow: 0 3px 5px rgb(0 0 0 / 22%);
`
const Home: NextPage = () => {
  const boardInit = Array.from(new Array(8), () => new Array(8).fill(9))
  const gameInfoInit: t.GameInfo = {
    board: boardInit,
    msg: 'Reversi',
    turnColor: 'Black',
    numberOfDisc: { White: 2, Black: 2 },
    gameState: 'playerWanted',
  }
  const [gameInfo, setGameInfo] = useState({ ...gameInfoInit })
  const [userState, setUserState] = useState<t.UserState>('spectator')
  const [isClickedStart, setIsClickedStart] = useState<boolean>(false)
  const [isShowModal, setIsShowModal] = useState<boolean>(true)
  const [isSocketCond, setIsSocketCond] = useState<null | boolean>(null)
  const [connectCount, setConnectCount] = useState<number>(0)
  // eslint-disable-next-line
  const socket = useRef<Socket>(null!)

  useEffect(() => {
    //サーバーと接続
    socket.current = io(URL, {
      reconnection: false,
      withCredentials: true,
    })
    //サーバーから送られる情報の受け取り
    socket.current.on('gameInfo', (data) => {
      for (const key of Object.keys(gameInfo)) {
        if (key in data) {
          setGameInfo((current) => ({ ...current, [key]: data[key] }))
        }
      }
    })
    socket.current.on('showAlert', (data) => {
      const { alertMsg }: { alertMsg: string } = data
      window.alert(alertMsg)
    })
    socket.current.on('userState', (data) => {
      const { newUserState }: { newUserState: t.UserState } = data
      setUserState(newUserState)
    })
    socket.current.on('connectCount', (data) => {
      const { newConnectCount }: { newConnectCount: number } = data
      setConnectCount(newConnectCount)
    })
    //サーバーと接続できた時の処理
    socket.current.on('connect', () => {
      setIsSocketCond(true)
    })
    //サーバーと接続できなかった時の処理
    socket.current.on('connect_error', () => {
      setIsSocketCond(false)
      window.alert('サーバーに接続できませんでした。\nもう一度読み込みなおしてください。')
    })
    return () => {
      socket.current.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  //オセロ石を置く処理
  const putDisc = (x: number, y: number, disc: t.Disc) => {
    //クリックしたマスが置ける場所であり、自分の手番の時
    if (disc === 8) {
      if (
        (gameInfo.turnColor === 'Black' && userState === 'PLBlack') ||
        (gameInfo.turnColor === 'White' && userState === 'PLWhite')
      ) {
        socket.current.emit('putDisc', { x: x, y: y })
      }
    }
  }
  //ゲームの状態に応じて対応する連装配列のkeyを返す
  const getViewandEmitKey = (GState: t.GameState, UState: t.UserState): t.ViewandEmitKey => {
    let key: t.ViewandEmitKey = ''
    switch (GState) {
      case 'playerWanted':
        if (UState === 'spectator') key = 'entry'
        else if (UState === 'waiting') key = 'entryCancel'
        break
      case 'duringAGame':
        key = 'gameCancel'
        break
      case 'gameResult':
        key = 'gameResultEnd'
        break
    }
    return key
  }

  //ゲームの状態に応じたボタンの処理を行う
  const btnCmd = (GState: t.GameState, UState: t.UserState) => {
    const emitCmd: { [key: string]: { [key: string]: string } } = {
      entry: {
        confirm: 'エントリーしますか？',
        emit: 'entry',
      },
      entryCancel: {
        confirm: 'エントリーをキャンセルしますか?\n※観戦者になります。',
        emit: 'entryCancel',
      },
      gameCancel: {
        confirm: 'ゲームを中止しますか?\n※対戦結果へ移行します。',
        emit: 'cancel',
      },
      gameResultEnd: {
        confirm: '対戦結果の表示を終了しますか?\n※参加画面に移行します。',
        emit: 'reset',
      },
    }
    const emitKey = getViewandEmitKey(GState, UState)
    if (emitKey !== '') {
      if (window.confirm(emitCmd[emitKey].confirm)) {
        socket.current.emit(emitCmd[emitKey].emit)
      } else {
        window.alert('キャンセルされました。')
      }
    }
  }

  //ゲームの状態に対応したボタンのLabelや色を返す
  const getViewConfig = (GState: t.GameState, UState: t.UserState) => {
    const view_Config: { [key: string]: { [key: string]: string } } = {
      entry: {
        label: '参加はこちらから',
        btn: 'Entry',
        btnColor: '#ddd',
      },
      entryCancel: {
        label: '参加のキャンセル',
        btn: 'exit',
        btnColor: '#ccc',
      },
      gameCancel: {
        label: '対戦を中止する',
        btn: 'Cancel ',
        btnColor: '#c0c0c0',
      },
      gameResultEnd: {
        label: '結果発表の終了',
        btn: 'Reset',
        btnColor: '#e6e6fa',
      },
    }
    const viewKey = getViewandEmitKey(GState, UState)
    if (viewKey !== '') return view_Config[viewKey]
    return {
      label: 'label',
      btn: 'btn',
      btnColor: '',
    }
  }
  //接続完了時にモーダルを取り除く処理
  const registerUserInfo = () => {
    setIsClickedStart(true)
    setIsShowModal(false)
  }

  const zeroPadding = (num: number) => {
    return `0${num}`.slice(-2)
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
          <ModalButton
            id="inputName"
            type="submit"
            isBtnShow={isSocketCond}
            onClick={registerUserInfo}
          >
            Start
          </ModalButton>
        </Modal>
      </ModalBack>
      <ConnectCountLabel>現在の接続人数：{connectCount}人</ConnectCountLabel>
      <GameMsg> {gameInfo.msg}</GameMsg>
      <Board>
        {gameInfo.board.map((row, y) =>
          row.map((num, x) => (
            <Sqaure
              key={`${x}-${y}`}
              onClick={() => {
                putDisc(x, y, num)
              }}
            >
              {' '}
              {num === 8 ? (
                <PutableMarker
                  disc={9}
                  turnColor={gameInfo.turnColor}
                  gameState={gameInfo.gameState}
                />
              ) : (
                <BoardDisc disc={num} />
              )}
            </Sqaure>
          ))
        )}
      </Board>
      <DiscCount>
        <Disc disc={t.Disc.White} />：{zeroPadding(gameInfo.numberOfDisc.White)} -{' '}
        {zeroPadding(gameInfo.numberOfDisc.Black)}： <Disc disc={t.Disc.Black} />
      </DiscCount>

      <ButtonArea
        isShow={
          gameInfo.gameState !== 'duringAGame' || userState === 'PLWhite' || userState === 'PLBlack'
        }
      >
        <ButtonLabel>{getViewConfig(gameInfo.gameState, userState).label}</ButtonLabel>
        <ActButton
          backColor={getViewConfig(gameInfo.gameState, userState).btnColor}
          onClick={() => btnCmd(gameInfo.gameState, userState)}
        >
          {getViewConfig(gameInfo.gameState, userState).btn}
        </ActButton>
      </ButtonArea>

      <UserStateArea isShow={isSocketCond} userStateKey={userState}>
        State : {USER_STATE[userState]}
      </UserStateArea>
    </Container>
  )
}

export default Home
