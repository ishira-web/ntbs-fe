import React from 'react'
import Navbar from '../components/navbar'
import Learn from '../Pages/Learn'
import Footer from '../Pages/footer'

function LearnLayout() {
  return (
    <div className='font-Outfit'>
      <Navbar/>
      <Learn/>
      <Footer/>
    </div>
  )
}

export default LearnLayout
