import React from 'react'
import Home from '../Pages/Home'
import Navbar from '../components/navbar'
import AboutBlood from '../Pages/AboutBlood'

function HomeLayout() {
  return (
    <div className='font-Outfit'>
      <Navbar/>
      <Home/>
      <AboutBlood/>
    </div>
  )
}

export default HomeLayout
