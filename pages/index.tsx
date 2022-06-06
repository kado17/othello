import type { NextPage } from 'next'
import styled from 'styled-components'

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

const Sqaure = styled.div`
  display: inline-block;
  width: 8vh;
  height: 8vh;
  vertical-align: bottom;
  background-repeat: no-repeat;
  background-position: -50vh 0;
  background-size: 70vh 5vh;
  border: 0.2vh solid black;
`

const Home: NextPage = () => {
  const board = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ]
  return (
    <Container>
      <Board>{board.map((row, y) => row.map((num, x) => <Sqaure key={`${x}-${y}`} />))}</Board>
    </Container>
  )
}

export default Home
