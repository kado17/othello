import type { NextPage } from 'next'
import styled from 'styled-components'

const COLOR = ['white', 'black']

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #ccffff;
`

const Board = styled.div`
  align-items: center;
  width: 66vh;
  height: 66vh;
  background-color: #00dd00;
  border: 1vh solid black;
`

const Sqaure = styled.div<{ num: number }>`
  display: inline-block;
  width: 8vh;
  height: 8vh;
  font-size: 12vh;
  line-height: 4.5vh;
  vertical-align: bottom;
  text-align: center;
  color: ${({ num }) => (0 === num || num === 1 ? COLOR[num] : '')};
  border: 0.2vh solid black;
`

const Home: NextPage = () => {
  const board = [
    [9, 9, 9, 9, 9, 9, 9, 9],
    [9, 9, 9, 9, 9, 9, 9, 9],
    [9, 9, 9, 9, 9, 9, 9, 9],
    [9, 9, 9, 0, 1, 9, 9, 9],
    [9, 9, 9, 1, 0, 9, 9, 9],
    [9, 9, 9, 9, 9, 9, 9, 9],
    [9, 9, 9, 9, 9, 9, 9, 9],
    [9, 9, 9, 9, 9, 9, 9, 9],
  ]
  return (
    <Container>
      <Board>
        {board.map((row, y) =>
          row.map((num, x) => (
            <Sqaure key={`${x}-${y}`} num={num}>
              {0 <= num && num <= 1 ? '●' : ''}
            </Sqaure>
          ))
        )}
      </Board>
    </Container>
  )
}

export default Home
