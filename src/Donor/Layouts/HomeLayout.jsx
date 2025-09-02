import React from 'react'
import Home from '../Pages/Home'
import Navbar from '../components/navbar'

function HomeLayout() {
  return (
    <div className='font-Outfit'>
      <Navbar/>
      <Home/>
    </div>
  )
}

export default HomeLayout
