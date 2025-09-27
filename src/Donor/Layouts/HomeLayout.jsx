import React from 'react'
import Home from '../Pages/Home'
import Navbar from '../components/navbar'
import AboutBlood from '../Pages/AboutBlood'
import Footer from '../Pages/footer'
import ChatAssistant from '../components/ChatAssistant'


function HomeLayout() {
  return (
    <div className='font-Outfit'>
      <Navbar/>
      <Home/>
      <AboutBlood/>
      <ChatAssistant/>
      <Footer/>
    </div>
  )
}

export default HomeLayout
