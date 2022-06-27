import axios from 'axios'
import type { NextPage } from 'next'
import { useEffect, useState } from 'react'
import styled from 'styled-components'
//import {io} from 'socket.io-client'

const COLOR = ['white', 'black']

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #cff;
`

const Board = styled.div`
  align-items: center;
  width: 66vh;
  height: 66vh;
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

const White_disk = styled.div`
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
const Black_disk = styled(White_disk)`
  background-color: black;
`

const Home: NextPage = () => {
  interface b {
    board: number[][]
  }

  useEffect(() => {
    const intervalId = setInterval(() => {
      a()
    }, 1000)
    return () => {
      clearInterval(intervalId)
    }
  }, [])

  const board_init = [
    [9, 9, 9, 9, 9, 9, 9, 9],
    [9, 9, 9, 9, 9, 9, 9, 9],
    [9, 9, 9, 9, 9, 9, 9, 9],
    [9, 9, 9, 0, 1, 9, 9, 9],
    [9, 9, 9, 1, 0, 9, 9, 9],
    [9, 9, 9, 9, 9, 9, 9, 9],
    [9, 9, 9, 9, 9, 9, 9, 9],
    [9, 9, 9, 9, 9, 9, 9, 9],
  ]
  const [board, setBoard] = useState(board_init)

  const a = () => {
    const url = axios
      .get('http://localhost:8000/api/test')

      // thenで成功した場合の処理
      .then((r) => {
        const a: number[][] = r.data.board
        console.log('ステータスコード:', r)
        setBoard(a)
      })
      // catchでエラー時の挙動を定義
      .catch((err) => {
        console.log('err:', err)
      })
  }

  const b = (x: number, y: number) => {
    const data = { y: y, x: x }
    console.log(data)

    const url = axios
      .post('http://localhost:8000/api/disk', data)

      // thenで成功した場合の処理
      .then((r) => {
        console.log('res:', r.data)
        const a: number[][] = r.data.a
        setBoard(a)
      })
  }

  return (
    <Container>
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
              {0 === num ? <White_disk /> : num === 1 ? <Black_disk /> : ''}
            </Sqaure>
          ))
        )}
      </Board>
    </Container>
  )
}

export default Home
