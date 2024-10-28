import { Button, Result } from 'antd'
import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const navigate = useNavigate()
  return (
    <Result
    status="info"
    title="En desarrollo"
    subTitle="Esta sección todavia no ha sido terminada"
    extra={<Button onClick={()=> navigate("/timeFrame")} type="primary">Ir a Periodos</Button>}
  />
  )
}
